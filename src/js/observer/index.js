/** @module Observer */

global.$ = document.querySelector.bind(document)
global.$$ = document.querySelectorAll.bind(document)

global.EventEmitter = require('eventemitter3')


const Skeleton = require('../lib/skeleton')
const Walker = require('./walker')
const utils = require('../lib/utils')


/**
* The ObserverFrame is injected in ALL browser tab frames, because it has to
* be able to add click-to-dial icons to every phonenumber it finds.
* This script needs to be as lightweight as possible, so it doesn't
* affect browsing performance too much.
*/
class ObserverFrame extends Skeleton {

    constructor(...args) {
        super(...args)

        this.parsers = require('./parsers')
        this.walker = new Walker(this)
        // Search and insert icons after mutations.
        this.observer = null
        this.handleMutationsTimeout = null
        this.parkedNodes = []
        this.stylesheet = document.createElement('link')
        this.stylesheet.setAttribute('rel', 'stylesheet')
        this.stylesheet.setAttribute('href', browser.runtime.getURL('css/observer.css'))
        $('head').appendChild(this.stylesheet)
        /**
        * Toggle listening to DOM mutations and adding icons to the tab.
        * Triggered when the user logs out or when the click2dial
        * setting is modified from the popup.
        */
        this.on('observer:toggle', ({enabled}) => {
            if (enabled) {
                this.processPage()
            } else {
                if (this.observer) this.observer.disconnect()
                // Remove icons.
                this.revertInsertedIcons()
                this.stylesheet.remove()
            }
        })


        /**
        * Signal the background that the observer has been loaded and is
        * ready to look for phone numbers if the background demands it.
        */
        this.emit('bg:tabs:observer_toggle', {
            callback: ({observe}) => {
                // Don't start observing, unless the background says so.
                if (!observe) return

                if (window !== window.top && !(document.body.offsetWidth > 0 || document.body.offsetHeight > 0)) {
                    // This is a hidden iframe. We wait for it to become visible,
                    // before starting the observer.
                    const resizeListener = (e) => {
                        this.processPage()
                        window.removeEventListener('resize', resizeListener)
                    }
                    this.resizeListener = window.addEventListener('resize', resizeListener)
                } else {
                    this.processPage()
                }
            },
        })


        /**
        * Event delegate for the whole page. Respond to <A> tags
        * and <CTDICON> tags; otherwise just let it pass.
        */
        document.addEventListener('click', (e) => {
            if (e.target.nodeName === 'A') {
                // Handle links with hrefs starting with `tel:`.
                const href = e.target.getAttribute('href')
                if (href.startsWith('tel:')) {
                    e.preventDefault()
                    this.emit('bg:calls:call_create', {number: href.substring(4), start: true})
                }
            } else if (e.target.nodeName === 'CTDICON') {
                // Handle clicking on injected c2d icons.
                e.preventDefault()
                // Skip disabled icons.
                if (e.target.classList.contains('disabled')) return
                const data = e.target.dataset
                if (data.number) this.emit('bg:calls:call_create', {number: data.number, start: true})
                // Immediatly disable all the icons for this number.
                for (let node of $$(`.ctd-icon-${data.number}`)) {
                    node.classList.add('disabled')
                }
            }
        })
    }


    /**
    * Create an HTML element containing an anchor with a phone icon with
    * the phone number in a data attribute.
    * @param {String} number - Number to use for the icon.
    * @returns {Node} - Newly created p element.
    */
    createNumberIconElement(number) {
        number = utils.sanitizeNumber(number)
        let icon = document.createElement('ctdicon')
        icon.classList.add('ctd-icon', `ctd-icon-${number}`)
        icon.setAttribute('data-number', number)
        return icon
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
            this.logger.debug(`${this}processing ${_parkedNodes.length} parked nodes.`)
            let batchSize = 40 // random size
            for (let i = 0; i < Math.ceil(_parkedNodes.length / batchSize); i++) {
                ((index) => {
                    setTimeout(() => {
                        for (let j = index * batchSize; j < (index + 1) * batchSize; j++) {
                            let node = _parkedNodes[j]
                            let stillInDocument = document.contains(node) // no lookup costs
                            if (stillInDocument) {
                                this.insertIconInDom(node)
                            }
                        }
                    }, 0) // Push back execution to the end on the current event stack.
                })(i)
            }
        }
    }


    /**
    * Transforms matching phonenumbers in augmented
    * elements which contain the icon.
    * @param {Node} [root] - The DOM node to start matching from.
    */
    insertIconInDom(root) {
        const pause = !!root
        if (pause && this.observer) this.observer.disconnect()
        root = root || document.body

        // Walk the DOM looking for elements to parse, but block reasonably
        // sized pages to prevent locking the page.
        const childrenLength = root.querySelectorAll('*').length // no lookup costs
        if (childrenLength >= 2001) return

        this.walker.walkTheDOM(root, (currentNode) => {
            // Scan using every available parser.
            this.parsers.forEach((localeParser) => {
                const parser = localeParser[1]()
                // Transform Text node to HTML-capable node, to
                // - deal with html-entities (&nbsp;, &lt;, etc.) since
                // they mess up the start/end from matches when reading
                // from node.data, and
                // - enable inserting the icon html
                // (doesn't work with a text node)
                const ctdNode = document.createElement('ctd')
                ctdNode.classList.add('ctd-phone-number')
                // ctdNode.textContent = currentNode.data
                const nodeData = this.escapeHTML(currentNode.data)
                const matches = parser.parse(nodeData)
                if (matches.length) {
                    if (!parser.isBlockingNode(currentNode.previousElementSibling) &&
                            !parser.isBlockingNode(currentNode.parentNode.previousElementSibling)) {

                        matches.reverse().forEach((match) => {
                            const numberIconElement = this.createNumberIconElement(match.number)
                            ctdNode.setAttribute('data-original', nodeData)
                            const numberText = nodeData.slice(match.start, match.end)
                            const beforeText = nodeData.slice(0, match.start)
                            const afterText = nodeData.slice(match.end)

                            const numberTextNode = document.createTextNode(numberText)
                            // There may be text in front of the phonenumber.
                            if (beforeText.length) {
                                const beforeTextNode = document.createTextNode(beforeText)
                                ctdNode.appendChild(beforeTextNode)
                            }
                            // The phonenumber itself.
                            ctdNode.appendChild(numberTextNode)
                            // The icon.
                            ctdNode.appendChild(numberIconElement)
                            // And finally text after the icon when there is any.
                            if (afterText.length) {
                                const afterTextNode = document.createTextNode(afterText)
                                ctdNode.appendChild(afterTextNode)
                            }
                        })

                        currentNode.parentNode.insertBefore(ctdNode, currentNode)
                        currentNode.parentNode.removeChild(currentNode)
                    }
                }
            })
        })

        if (pause) this.observePage()
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
                        for (const node of mutation.addedNodes) {
                            if (!this.walker.skipNode(node)) {
                                this.parkedNodes.push(node)
                            }
                        }
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
    * Injects icons in the page and start observing the page for changes.
    */
    processPage() {
        this.logger.debug(`${this}start observing`)
        // Inject our print stylesheet.
        $('head').appendChild(this.stylesheet)
        // Insert icons.
        this.insertIconInDom()
        // Start listening to DOM mutations.
        this.observePage()
    }


    /**
     * Restore the original numbers by replacing all ctd nodes with a new
     * text node containing the phonenumber.
     */
    revertInsertedIcons() {
        $$('ctd').forEach((el) => {
            el.parentNode.replaceChild(document.createTextNode(el.dataset.original), el)
        })
    }
}


let env = JSON.parse(JSON.stringify(require('../lib/env')))
env.role.fg = true

global.app = new ObserverFrame({
    env: env,
    name: 'observer',
})
