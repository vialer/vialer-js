window.global = window
if (!global.translations) global.translations = {}

global.$ = require('jquery')
global.Vue = require('vue/dist/vue.runtime')
global.VueStash = require('vue-stash').default
Vue.use(global.VueStash)
global.i18n = require('vue-i18n-stash')
global.I18nStore = require('vue-i18n-stash/src/store-stash')

if (process.env.NODE_ENV === 'production') {
    Vue.config.productionTip = false
    Vue.config.devtools = false
}
