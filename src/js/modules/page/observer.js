'use strict'

// Identify our elements with these class names.
const phoneElementClassName = 'voipgrid-phone-number'
const phoneIconClassName = 'voipgrid-phone-icon'
// This style's intention is to hide the icons when printing.
const printStyle = $(`<link rel="stylesheet" href="${chrome.runtime.getURL('build/css/print.css')}" media="print">`)


class Observer {

    constructor(app, walker) {
        this.app = app
        this.app.logger.info(`${this} init`)
        this.walker = walker
        // Search and insert icons after mutations.
        this.observer = null
        this.handleMutationsTimeout = null
        this.parkedNodes = []
    }


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
        a.classList.add(phoneIconClassName)
        return a
    }


    get iconStyle() {
        // Cannot set !important with `.css("property", "value !important"),`
        // so build a string to use as style.
        let iconStyle = {
            // 'background-attachment': 'scroll',  // this is set later, conditionally
            'background-color': 'transparent !important',
            'background-image': 'url("' + chrome.runtime.getURL('build/img/clicktodial.png') + '")',
            'background-repeat': 'no-repeat',
            'bottom': '-3px !important',
            'background-position': 'center center',
            '-moz-border-radius': '9px !important',
            'border-radius': '9px !important',
            '-moz-box-shadow': '0 1px 1px rgba(0, 0, 0, 0.2) !important',
            'box-shadow': '0 1px 1px rgba(0, 0, 0, 0.2) !important',
            'display': 'inline-block',
            'height': '18px !important',
            'margin': '0 4px !important',
            'line-height': '18px !important',
            'padding': '0 !important',
            'position': 'relative !important',
            'width': '18px !important',
        }
        let style = ''
        for (let property in iconStyle) {
            style += property + ': ' + iconStyle[property] + '; '
        }
        return style
    }


    /**
     * Create an HTML element containing an anchor with a phone icon with
     * the phone number in a data attribute.
     */
    createNumberIconElement(number) {
        let icon = this.iconElement.cloneNode(false)
        // Add properties unique for "number".
        icon.setAttribute('data-number', number)
        icon.href = `javascript:clicktodial(${number})`
        // Wrap in element so ".innerHTML" contains the icon HTML.
        let wrapper = document.createElement('p')
        wrapper.appendChild(icon)
        return wrapper
    }


    doInsert(root) {
        let pause = !!root

        if (pause) {
            this.stopObserver()
        }

        root = root || document.body

        // walk the DOM looking for elements to parse
        // but block reasonably sized pages to prevent locking the page
        let childrenLength = $(root).find('*').length  // no lookup costs
        if (childrenLength < 2001) {
            this.app.logger.debug(`${this} scanning ${childrenLength} elements`)

            this.walker.walkTheDOM(root, (node) => {
                let curNode = node
                // Scan using every available parser.
                window.parsers.forEach((localeParser) => {
                    let parser = localeParser[1]()

                    // transform Text node to HTML-capable node, to
                    // - deal with html-entities (&nbsp;, &lt;, etc.) since
                    // they mess up the start/end from
                    // matches when reading from node.data, and
                    // - enable inserting the icon html (doesn't work with a text node)
                    let replacementNode = this.ctdNode.cloneNode(false)
                    replacementNode.textContent = node.data
                    replacementNode.innerHTML = this.escapeHTML(node.data)

                    let matches = parser.parse(replacementNode.innerHTML)
                    if (matches.length) {
                        if (!parser.isBlockingNode(curNode.previousElementSibling) &&
                                !parser.isBlockingNode(curNode.parentNode.previousElementSibling)) {

                            matches.reverse().forEach((match) => {
                                let numberIconElement = this.createNumberIconElement(match.number)

                                // prefix icon with match (==number)
                                let originalText = replacementNode.innerHTML.slice(match.start, match.end)
                                numberIconElement.innerHTML = originalText + ' ' + numberIconElement.innerHTML

                                let before = replacementNode.innerHTML.slice(0, match.start)
                                let after = replacementNode.innerHTML.slice(match.end)
                                replacementNode.innerHTML = before + numberIconElement.innerHTML + after
                            })

                            node.parentNode.insertBefore(replacementNode, node)
                            node.parentNode.removeChild(node)
                        }
                    }
                })
            })
        } else {
            this.app.logger.debug(`${this} not scanning ${childrenLength} elements`)
        }

        if (pause) {
            this.startObserver()
        }
    }


    doRun() {
        this.app.logger.debug(`${this} start observing`)

        // Inject our print stylesheet.
        $('head').append(printStyle)

        // Insert icons.
        let before = new Date().getTime()
        this.doInsert()
        this.app.logger.debug(`${this} doInsert (doRun) took`, new Date().getTime() - before)

        // Start listening to DOM mutations.
        this.startObserver()
    }


    /**
     * Escape HTML chars when assigning text to innerHTML.
     */
    escapeHTML(str) {
        let replacements = {'&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' }
        return str.replace(/[&"<>]/g, (m) => replacements[m])
    }


    events() {
        /**
         * Click event handler: dial the number in the attribute `data-number`.
         */
        $('body').on('click', `.${phoneIconClassName}`, (e) => {
            if ($(e.currentTarget).attr('data-number') && $(e.currentTarget).parents(`.${phoneElementClassName}`).length) {
                // remove focus
                $(e.currentTarget).blur()

                // Don't do anything with this click in the actual page.
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()

                // dial
                let b_number = $(e.currentTarget).attr('data-number')
                this.app.emit('clicktodial.dial', {'b_number': b_number})
            }
        })

        /**
         * Click event handler: dial the number in the attribute `href`.
         */
        $('body').on('click', '[href^="tel:"]', function(event) {
            $(this).blur()
            // Don't do anything with this click in the actual page.
            event.preventDefault()
            event.stopPropagation()
            event.stopImmediatePropagation()

            // Dial the b_number.
            let b_number = $(this).attr('href').substring(4)
            chrome.runtime.sendMessage({'clicktodial.dial': {'b_number': b_number}})
        })

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request === 'page.observer.stop') {
                this.app.logger.debug(`${this} page.observer.stop triggered`)
                // Stop listening to DOM mutations.
                this.stopObserver()
                // Remove icons.
                this.undoInsert()
                // Remove our stylesheet.
                $(printStyle).remove()
            }
        })

        // Signal this script has been loaded and ready to look for phone numbers.
        this.app.emit('page.observer.ready', {
            callback: (response) => {
                // Fill the contact list.
                if (response && response.hasOwnProperty('observe')) {
                    let observe = response.observe
                    if (!observe) return

                    this.app.logger.debug(`${this} page.observer.ready emitted`, window.location.href)

                    if (window !== window.top && !(document.body.offsetWidth > 0 || document.body.offsetHeight > 0)) {
                        // This hidden iframe might become visible, wait for this to happen.
                        $(window).on('resize', () => {
                            this.doRun()
                            // No reason to wait for more resize events.
                            $(window).off('resize')
                        })
                    } else {
                        this.doRun()
                    }
                }
            },
        })
    }


    /**
     * Process parked DOM mutations.
     */
    handleMutations() {
        // Copy and clear parkedNodes.
        let _parkedNodes = this.parkedNodes.slice()
        this.parkedNodes = []

        // Handle mutations if it probably isn't too much to handle
        // (current limit is totally random)
        if (_parkedNodes.length < 151) {
            this.app.logger.debug(`${this} Processing ${_parkedNodes.length} parked nodes.`)
            let batchSize = 40  // random size
            for (let i = 0; i < Math.ceil(_parkedNodes.length / batchSize); i++) {
                ((index) => {
                    setTimeout(() => {
                        for (let j = index * batchSize; j < (index + 1) * batchSize; j++) {
                            let node = _parkedNodes[j]
                            let stillInDocument = document.contains(node) // no lookup costs
                            if (stillInDocument) {
                                let before = new Date().getTime()
                                this.doInsert(node)
                                this.app.logger.debug(`${this} doInsert (handleMutations) took`, new Date().getTime() - before)
                            } else {
                                this.app.logger.debug(`${this} doInsert (handleMutations) took 0 - removed node`)
                            }
                        }
                    }, 0) // push back execution to the end on the current event stack
                })(i)
            }
        }
    }


    /**
     * Observer start: listen for DOM mutations and let `handleMutations`
     * process them.
     */
    startObserver() {
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
                // characterData: true,
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
        return `${this.app} [Observer]           `
    }


    undoInsert() {
        // remove icons from page
        $(`.${phoneIconClassName}`).remove()
    }
}

module.exports = Observer
