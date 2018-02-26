
const Skeleton = require('../lib/skeleton')

/**
* The tab Dialer module. It takes care of dialing a phonenumber
* from a tab and showing a popup.
* @module Dialer
*/
class DialerTab extends Skeleton {

    constructor(options) {
        super(options)
    }

}


let env = require('../lib/env')
env.role.tab = true

global.app = new DialerTab({
    env: env,
    i18n: {},
    name: 'tab',
})
