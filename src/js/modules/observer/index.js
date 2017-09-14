/**
* @module Observer
*/
// Identify our elements with these class names.
const phoneElementClassName = 'voipgrid-phone-number'
const phoneIconClassName = 'voipgrid-phone-icon'

const Walker = require('./walker')


/**
 * The Observer module. Injected in all tabs and all its frames.
 */
class ObserverModule {

    constructor(app) {
        this.app = app
        this.parsers = require('./parsers')
        this.walker = new Walker(this.app)
        // Search and insert icons after mutations.
        this.observer = null
        this.handleMutationsTimeout = null
        this.parkedNodes = []

        this.printStyle = $(
            `<link rel="stylesheet" href="${this.app.browser.runtime.getURL('css/webext_print.css')}" media="print">`)

        /**
        * Stop listening to DOM mutations. Triggered when
        * the user logs out.
        */
        this.app.on('observer:stop', (data) => {
            this.stopObserver()
            // Remove icons.
            this.restorePhonenumbers()
            // Remove our stylesheet.
            $(this.printStyle).remove()
        })

        this.app.on('observer:start', (data) => {
            // Stop listening to DOM mutations.
            this.processPage()
        })


        /**
        * Signal this script has been loaded and ready to look for
        * phone numbers.
        */
        this.app.emit('dialer:observer.ready', {
            callback: (response) => {
                // Fill the contact list.
                if (response && response.hasOwnProperty('observe')) {
                    let observe = response.observe
                    if (!observe) return

                    if (window !== window.top && !(document.body.offsetWidth > 0 || document.body.offsetHeight > 0)) {
                        // This hidden iframe might become visible, wait for
                        // this to happen.
                        $(window).on('resize', () => {
                            this.processPage()
                            // No reason to wait for more resize events.
                            $(window).off('resize')
                        })
                    } else {
                        this.processPage()
                    }
                }
            },
        })

        /**
        * Handle a click on a click-to-dial icon next to a phonenumber within
        * a tab. Use the number in the attribute `data-number`.
        */
        $('body').on('click', `.${phoneIconClassName}`, (e) => {
            // Don't process the click when the icon has
            // a disabled property set.
            if ($(e.currentTarget).attr('disabled')) {
                e.preventDefault()
                return
            }

            if ($(e.currentTarget).attr('data-number') &&
                $(e.currentTarget).parents(`.${phoneElementClassName}`).length) {
                // Disable all c2d icons until the tab is notified
                // by the callstatus that it wants to close again.
                $(`.${phoneIconClassName}`).each((i, el) => {
                    $(el).attr('disabled', true)
                })
                $(e.currentTarget).blur()

                // Don't do anything with this click in the actual page.
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()

                const b_number = $(e.currentTarget).attr('data-number')
                this.app.emit('dialer:dial', {
                    analytics: 'Webpage',
                    b_number: b_number,
                })
            }
        })

        /**
        * Handle the event when a link is clicked that contains
        * <a href="tel:"></a>.
        */
        $('body').on('click', '[href^="tel:"]', (e) => {
            $(e.currentTarget).blur()
            // Don't do anything with this click in the actual page.
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()

            // Dial the b_number.
            const bNumber = $(e.currentTarget).attr('href').substring(4)
            this.app.emit('dialer:dial', {
                analytics: 'Webpage',
                b_number: bNumber,
            })
        })
    }


    /**
    * Returns a new `<ctd></ctd>` node, that will wrap the phonenumber
    * and the click-to-dial icon.
    */
    get ctdNode() {
        let ctd = document.createElement('ctd')
        ctd.setAttribute('style', 'font-style: inherit; font-family: inherit;')
        ctd.classList.add(phoneElementClassName)
        return ctd
    }


    /**
    * Element that shows the icon and triggers a call.
    */
    get iconElement() {
        let a = document.createElement('a')
        a.setAttribute('style', this.iconStyle)
        a.setAttribute('href', '')
        a.classList.add(phoneIconClassName)
        return a
    }


    get iconStyle() {
        let iconStyle = {
            '-moz-border-radius': '9px !important',
            '-moz-box-shadow': '0 1px 1px rgba(0, 0, 0, 0.2) !important',
            'background-color': 'transparent !important',
            'background-image': `url("${this.app.browser.runtime.getURL('img/clicktodial.png')}")`,
            'background-position': 'center center',
            'background-repeat': 'no-repeat',
            'border-radius': '9px !important',
            bottom: '-3px !important',
            'box-shadow': '0 1px 1px rgba(0, 0, 0, 0.2) !important',
            display: 'inline-block',
            height: '18px !important',
            'line-height': '18px !important',
            margin: '0 4px !important',
            padding: '0 !important',
            position: 'relative !important',
            width: '18px !important',
        }
        let style = ''
        for (let property in iconStyle) {
            style += `${property}: ${iconStyle[property]}; `
        }
        return style
    }


    /**
    * Create an HTML element containing an anchor with a phone icon with
    * the phone number in a data attribute.
    * @param {String} number - Number to use for the icon.
    * @returns {Node} - Newly created p element.
    */
    createNumberIconElement(number) {
        let icon = this.iconElement.cloneNode(false)
        // Add properties unique for "number".
        icon.setAttribute('data-number', number)
        icon.classList.add(`c2d-icon-${number}`)
        // Wrap in element so ".innerHTML" contains the icon HTML.
        let wrapper = document.createElement('p')
        wrapper.appendChild(icon)
        return wrapper
    }


    doInsert(root) {
        let pause = !!root
        if (pause) this.stopObserver()
        root = root || document.body

        // Walk the DOM looking for elements to parse, but block reasonably
        // sized pages to prevent locking the page.
        let childrenLength = $(root).find('*').length // no lookup costs
        if (childrenLength < 2001) {
            this.app.logger.debug(`${this}scanning ${childrenLength} elements`)

            this.walker.walkTheDOM(root, (currentNode) => {
                // Scan using every available parser.
                this.parsers.forEach((localeParser) => {
                    let parser = localeParser[1]()
                    // Transform Text node to HTML-capable node, to
                    // - deal with html-entities (&nbsp;, &lt;, etc.) since
                    // they mess up the start/end from matches when reading
                    // from node.data, and
                    // - enable inserting the icon html
                    // (doesn't work with a text node)
                    let replacementNode = this.ctdNode.cloneNode(false)
                    replacementNode.textContent = currentNode.data
                    replacementNode.innerHTML = this.escapeHTML(currentNode.data)

                    let matches = parser.parse(replacementNode.innerHTML)
                    if (matches.length) {
                        if (!parser.isBlockingNode(currentNode.previousElementSibling) &&
                                !parser.isBlockingNode(currentNode.parentNode.previousElementSibling)) {

                            matches.reverse().forEach((match) => {
                                let numberIconElement = this.createNumberIconElement(match.number)

                                // prefix icon with match (==number)
                                let originalText = replacementNode.innerHTML.slice(match.start, match.end)
                                numberIconElement.innerHTML = `${originalText} ${numberIconElement.innerHTML}`

                                let before = replacementNode.innerHTML.slice(0, match.start)
                                let after = replacementNode.innerHTML.slice(match.end)
                                replacementNode.innerHTML = before + numberIconElement.innerHTML + after
                            })

                            currentNode.parentNode.insertBefore(replacementNode, currentNode)
                            currentNode.parentNode.removeChild(currentNode)
                        }
                    }
                })
            })
        } else {
            this.app.logger.debug(`${this}not scanning ${childrenLength} elements`)
        }

        if (pause) {
            this.observePage()
        }
    }


    /**
    * Injects icons in the page and start observing the page for changes.
    */
    processPage() {
        this.app.logger.debug(`${this}start observing`)
        // Inject our print stylesheet.
        $('head').append(this.printStyle)
        // Insert icons.
        const before = new Date().getTime()
        this.doInsert()
        this.app.logger.debug(`${this}doInsert (processPage) took`, new Date().getTime() - before)
        // Start listening to DOM mutations.
        this.observePage()
    }


    /**
    * Escape HTML chars when assigning text to innerHTML.
    * @param {String} str - The string to escape html from.
    * @returns {String} - The HTML escaped string.
    */
    escapeHTML(str) {
        const replacements = {
            '"': '&quot;',
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
        }
        return str.replace(/[&"<>]/g, (m) => replacements[m])
    }



    /**
     * Process parked DOM mutations.
     */
    handleMutations() {
        // Copy and clear parkedNodes.
        let _parkedNodes = this.parkedNodes.slice()
        this.parkedNodes = []
        // Handle mutations if it probably isn't too much to handle
        // (current limit is totally random).
        if (_parkedNodes.length < 151) {
            this.app.logger.debug(`${this}processing ${_parkedNodes.length} parked nodes.`)
            let batchSize = 40 // random size
            for (let i = 0; i < Math.ceil(_parkedNodes.length / batchSize); i++) {
                ((index) => {
                    setTimeout(() => {
                        for (let j = index * batchSize; j < (index + 1) * batchSize; j++) {
                            let node = _parkedNodes[j]
                            let stillInDocument = document.contains(node) // no lookup costs
                            if (stillInDocument) {
                                let before = new Date().getTime()
                                this.doInsert(node)
                                this.app.logger.debug(
                                    `${this}doInsert (handleMutations) took`, new Date().getTime() - before)
                            } else {
                                this.app.logger.debug(`${this}doInsert (handleMutations) took 0 - removed node`)
                            }
                        }
                    }, 0) // Push back execution to the end on the current event stack.
                })(i)
            }
        }
    }


    /**
     * Observer start: listen for DOM mutations and let `handleMutations`
     * process them.
     */
    observePage() {
        if (!this.observer) {
            this.observer = new MutationObserver((mutations) => {
                if (this.handleMutationsTimeout) {
                    // Don't handle the mutations yet after all.
                    clearTimeout(this.handleMutationsTimeout)
                }

                mutations.forEach((mutation) => {
                    // Filter mutations to park.
                    if (mutation.addedNodes.length) {
                        $.each(mutation.addedNodes, (index, addedNode) => {
                            if (!this.walker.skipNode(addedNode)) {
                                this.parkedNodes.push(addedNode)
                            }
                        })
                    } else if (!mutation.removedNodes.length && mutation.target) {
                        if (!this.walker.skipNode(mutation.target)) {
                            this.parkedNodes.push(mutation.target)
                        }
                    }
                })

                // Assuming nothing happens, scan the nodes in 500 ms - after
                // this the page should've been done dealing with the mutations.
                if (this.parkedNodes.length) {
                    this.handleMutationsTimeout = setTimeout(this.handleMutations.bind(this), 500)
                }
            })
        }

        if (this.observer) {
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
            })
        }
    }


    /**
     * Observer stop: simply stop listening to DOM mutations.
     */
    stopObserver() {
        if (this.observer) {
            this.observer.disconnect()
        }
    }


    toString() {
        return `${this.app}[observer] `
    }


    /**
     * Restore the original numbers by replacing all ctd nodes with a new
     * text node containing the phonenumber.
     */
    restorePhonenumbers() {
        document.querySelectorAll('ctd').forEach((el) => {
            el.parentNode.replaceChild(document.createTextNode(el.textContent), el)
        })
    }
}

module.exports = ObserverModule
