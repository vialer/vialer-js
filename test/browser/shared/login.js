const path = require('path')

module.exports = function(settings) {
    const brand = settings.brands[settings.BRAND_TARGET]

    return async function(runner, screens) {
        const container = await runner.$('#app')
        await runner.waitFor('.greeting')
        if (screens) await brand.tests.screenshot(container, runner, 'login')

        // The voip adapter has an endpoint field that must be filled.
        if (brand.plugins.builtin.user.adapter === 'vjs-adapter-user-voip') {
            await runner.type('input[name="endpoint"]', brand.tests.endpoint)
        }

        await runner.type('input[name="username"]', brand.tests[runner._name].username)
        await runner.type('input[name="password"]', brand.tests[runner._name].password)
        if (screens) await brand.tests.screenshot(container, runner, 'login-credentials')

        await runner.click('.test-login-button')
        await runner.waitFor('.component-wizard-welcome')
    }
}
