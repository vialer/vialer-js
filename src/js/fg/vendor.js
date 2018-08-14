require('../lib/vendor')

global.Vuelidate = require('vuelidate')
global.Vuelidate.validators = require('vuelidate/lib/validators')
Vue.use(global.Vuelidate.default)

global.Raven = require('raven-js')
global.shortid = require('shortid')
