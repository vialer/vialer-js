module.exports = (function() {
    const env = require('../../lib/env')({section: 'fg'})

    let options = {
        env,
        plugins: {
            builtin: [
                {
                    addons: null,
                    module: require('../plugins/availability'),
                    name: 'availability',
                },
            ],
            custom: null,
        },
    }

    let availabilityPlugin = options.plugins.builtin.find((i) => i.name === 'availability')

    if (env.isNode) {
        const rc = require('rc')
        let settings = {}
        rc('vialer-js', settings)
        const BRAND = process.env.BRAND ? process.env.BRAND : 'bologna'
        const brand = settings.brands[BRAND]
        availabilityPlugin.addons = brand.plugins.builtin.availability.addons
    } else {
        // Load modules through envify replacement.
        availabilityPlugin.addons = process.env.BUILTIN_AVAILABILITY_ADDONS
        options.plugins.custom = process.env.CUSTOM_MOD
    }

    return options
})()
