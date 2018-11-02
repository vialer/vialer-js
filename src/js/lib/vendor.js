Vue.config.ignoredElements = ['component']

global.VueSVGIcon = require('vue-svgicon')
Vue.use(global.VueSVGIcon, {tagName: 'icon'})

if (global.document) {
    window.global = window
    global.$ = document.querySelector.bind(document)
    global.$$ = document.querySelectorAll.bind(document)
}

global.resizeSensor = require('css-element-queries').ResizeSensor
global.EventEmitter = require('eventemitter3')
if (!global.translations) global.translations = {}

global.VueStash = require('vue-stash').default
Vue.use(global.VueStash)

global.I18nStash = require('@vialer/vue-i18n')
global.I18nStore = require('@vialer/vue-i18n/src/store-stash')

if (process.env.NODE_ENV === 'production') {
    Vue.config.productionTip = false
    Vue.config.devtools = false
}

global.shortid = require('shortid')
