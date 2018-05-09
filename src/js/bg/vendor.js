// Already defined by vendor_fg.js in case of being part of a webview.
if (!global.Vue) {
    if (!global.translations) global.translations = {}
    if (global.document) {
        window.global = window
        global.$ = document.querySelector.bind(document)
        global.$$ = document.querySelectorAll.bind(document)
    }

    global.Vue = require('vue/dist/vue.runtime')
    global.EventEmitter = require('eventemitter3')
    // Define custom tags here, so they are not interpreted by Vue.
    global.VueStash = require('vue-stash').default
    Vue.use(global.VueStash)
    global.i18n = require('vue-i18n-stash')
    global.I18nStore = require('vue-i18n-stash/src/store-stash')
    global.Raven = require('raven-js')

    if (process.env.NODE_ENV === 'production') {
        Vue.config.productionTip = false
        Vue.config.devtools = false
    }
}

// Specific to vendor_bg.js
global.axios = require('axios')
global.sdpTransform = require('sdp-transform')
global.shortid = require('shortid')
global.SIP = require('sip.js')
