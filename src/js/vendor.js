window.global = window

global.$ = document.querySelector.bind(document)
global.$$ = document.querySelectorAll.bind(document)

global.EventEmitter = require('eventemitter3')
if (!global.translations) global.translations = {}

global.Vue = require('vue/dist/vue.runtime')
// Define custom tags here, so they are not interpreted by Vue.
Vue.config.ignoredElements = ['component']

global.VueStash = require('vue-stash').default
Vue.use(global.VueStash)

global.i18n = require('vue-i18n-stash')
global.I18nStore = require('vue-i18n-stash/src/store-stash')

if (process.env.NODE_ENV === 'production') {
    Vue.config.productionTip = false
    Vue.config.devtools = false
}

global.VueSVGIcon = require('vue-svgicon')

global.Vuelidate = require('vuelidate')
global.Vuelidate.validators = require('vuelidate/lib/validators')

Vue.use(global.Vuelidate.default)

Vue.use(global.VueSVGIcon, {
    tagName: 'svgicon',
})
