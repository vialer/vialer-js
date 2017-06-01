'use strict'

const Actions = require('../../lib/actions')


class PageActions extends Actions {


    background() {}


    /**
     * Hide panel when clicking outside the iframe.
     */
    hideFrameOnClick(event) {
        $(this.frame).remove()
        delete this.frame
        this.app.emit('callstatus.onhide', {
            // Extra info to identify call.
            callid: this.callid,
        })
    }


    popup() {}


    showCallstatus(callid) {
        let iframeStyle = {
            // Positional CSS.
            'position': 'fixed',
            'margin': 'auto',
            'top': '0',
            'right': '0',
            'bottom': '0',
            'left': '0',
            'width': '320px',
            'height': '79px',
            'z-index': '2147483647',
            // Pretty styling.
            'border': 'none',
            'border-radius': '5px',
            'box-shadow': 'rgba(0,0,0,0.25) 0 0 0 2038px, rgba(0,0,0,0.25) 0 10px 20px',
        }

        this.frame = $('<iframe>', {
            src: this.app.browser.runtime.getURL(`build/click-to-dial-callstatus.html?callid=${callid}`),
            style: (function() {
                // Cannot set !important with .css("property", "value !important"),
                // so build a string to use as style.
                let style = ''
                for (let property in iframeStyle) {
                    style += `${property}: ${iframeStyle[property]} !important; `
                }
                return style
            }()),
            scrolling: false,
        })

        $(this.frame).hide()
        $(this.frame).load(() => {
            $(this.frame).show()
        })
        $('html').append(this.frame)
    }


    tab() {
        // Hides the callstatus dialog when clicking anywhere in the page.
        // $('html').on('click', this.hideFrameOnClick.bind(this))
        this.app.on('callstatus.show', (data) => {
            this.app.logger.debug(`${this}callstatus.show`)
            this.showCallstatus(data.callid)
        })

        // Hides the callstatus popup.
        this.app.on('callstatus.hide', (data) => {
            this.app.logger.debug(`${this}callstatus.hide triggered`)
            $(this.frame).remove()
            delete this.frame
        })

        this.app.on('callstatus.onshow', (data) => {
            this.app.logger.debug(`${this}callstatus.onshow triggered`)
            this.callid = data.callid
        })
    }


    toString() {
        return `${this.app} [PageActions]        `
    }
}

module.exports = PageActions
