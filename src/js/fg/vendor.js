global.Vue = require('vue/dist/vue.runtime')

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

global.i18n = require('vue-i18n-stash')
global.I18nStore = require('vue-i18n-stash/src/store-stash')

if (process.env.NODE_ENV === 'production') {
    Vue.config.productionTip = false
    Vue.config.devtools = false
}

global.shortid = require('shortid')
global.Vuelidate = require('vuelidate')
global.Vuelidate.validators = require('vuelidate/lib/validators')

Vue.use(global.Vuelidate.default)

global.Raven = require('raven-js')
