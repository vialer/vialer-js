module.exports = (function() {
    const env = require('vialer-js/lib/env')({section: 'app'})

    let options = {
        env,
        plugins: {
            builtin: [
                {module: require('../plugins/page'), name: 'page'},
            ],
            custom: [],
        },
    }

    return options
})()
