/**
* @module Observer
*/

/**
* Using an object to check if tagName is disallowed is faster when using
* `tagName in {}` than using `Array.indexOf(tagname)`.
* @returns {Object} - List of disallowed html tags.
*/
let getBlockedTagNames = function() {
    // tag list based on:
    // eslint-disable-next-line max-len
    // https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/HTML5_element_list
    const tags = [
        'TITLE', 'BASE', 'LINK', 'META', 'STYLE', 'SCRIPT', 'TEMPLATE', 'PRE', 'FIGURE',
        'DATA', 'TIME', 'CODE', 'VAR', 'SAMP', 'KBD', 'SUB', 'SUP', 'RUBY', 'RT', 'RP',
        'BDI', 'BR', 'WBR', 'IMG', 'EMBED', 'OBJECT', 'PARAM', 'VIDEO', 'AUDIO', 'SOURCE',
        'TRACK', 'CANVAS', 'MAP', 'AREA', 'SVG', 'MATH', 'INPUT', 'BUTTON', 'SELECT',
        'DATALIST', 'OPTGROUP', 'OPTION', 'TEXTAREA', 'KEYGEN', 'PROGRESS', 'METER',
        'DETAILS', 'SUMMARY', 'MENUITEM', 'MENU',
    ]

    let disallowed = {}
    tags.forEach((i) => {disallowed[i] = null})
    return disallowed
}

/**
* Role list based on: http://www.w3.org/TR/wai-aria/roles#landmark_roles
* @returns {Object} - List of disallowed html tags.
*/
let getBlockedRoles = function() {
    const roles = [
        'button', 'checkbox', 'command', 'input', 'radio', 'range',
        'slider', 'option', 'search', 'textbox', 'timer',
    ]

    let disallowed = {}
    roles.forEach((i) => {disallowed[i] = null})
    return disallowed
}


/**
* Walk the DOM.
*/
class Walker {

    constructor(app) {
        this.app = app
        this.blockedRoles = getBlockedRoles()
        this.blockedTagNames = getBlockedTagNames()
    }


    /**
    * Skip elements which *probably* wouldn't (or shouldn't)
    * contain a phone number.
    * @param {Node} element - The DOM element to check.
    * @returns {Boolean} - Whether the element is blocked or not.
    */
    isBlockedElement(element) {
        if (element.tagName in this.blockedTagNames) return true

        const isContentEditable = element.isContentEditable
        // Deal with ARIA accessability content.
        const role = element.getAttribute('role')
        const isBlockedRole = (role && (role.toLowerCase() in this.blockedRoles))
        const hasRoleLabelledBy = element.hasAttribute('aria-labelledby')

        // Check for attributes on *element*.
        if (isContentEditable || hasRoleLabelledBy || isBlockedRole) return true
        else {
            // check for attributes on *parents*
            const closestRoleElement = element.closest('[role]')
            const closestIsBlockedRole = (closestRoleElement && closestRoleElement.toLowerCase() in this.blockedRoles)
            const closestAriaLabelledBy = element.closest('[aria-labelledby]')
            const closestContentEditable = element.closest('[contenteditable]')
            if (closestContentEditable || closestAriaLabelledBy || closestIsBlockedRole) return true
        }

        return false
    }


    /**
    * Test if `node` should even be processed.
    * @param {Node} node - Node to check for skipping.
    * @returns {Boolean} - Whether the node can be skipped or not.
    */
    skipNode(node) {
        // Only parse element and text nodes.
        if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.TEXT_NODE) return true
        if (node.nodeType === Node.ELEMENT_NODE && this.isBlockedElement(node)) return true
        if (node.nodeType === Node.TEXT_NODE && node.data.trim().length === 0) return true // Skip empty nodes.

        let parentElement = node.parentElement
        if (parentElement) {
            // skip invisible elements,
            // Sizzle: an element is invisible when it has no height or width
            if (!(parentElement.offsetWidth > 0 || parentElement.offsetHeight > 0)) return true
            // Skip existing numbers with an icon.
            if (parentElement.classList.contains('ctd-phone-number')) return true
            if (this.isBlockedElement(parentElement)) return true
        }

        return false
    }


    /**
    * Walk the DOM and apply fn for every node.
    * @param {Node} root - The root node to iterate on.
    * @param {Function} fn - Function to call on each node.
    */
    walkTheDOM(root, fn) {
        // Skip element nodes, we'll get to those using a text
        // node's parentNode attr.
        let whatToShow = NodeFilter.SHOW_TEXT

        // Apply filtering on what nodes to process.
        let filter = {
            acceptNode: (node) => {
                if (this.skipNode(node)) {
                    return NodeFilter.FILTER_SKIP
                } else {
                    return NodeFilter.FILTER_ACCEPT
                }
            },
        }

        let nodeIterator = document.createNodeIterator(root, whatToShow, filter)

        let curNode
        while ((curNode = nodeIterator.nextNode())) {
            fn(curNode)
        }
    }
}

module.exports = Walker
