global.Vue = require('vue/dist/vue.runtime')
require('../lib/vendor')

global.vClickOutside = require('v-click-outside')
Vue.use(global.vClickOutside)

global.Vuelidate = require('vuelidate')
global.Vuelidate.validators = require('vuelidate/lib/validators')
Vue.use(global.Vuelidate.default)

global.Raven = require('raven-js')
global.shortid = require('shortid')
