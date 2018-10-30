const path = require('path')

module.exports = function(settings, screenshot) {
    const brand = settings.brands[settings.BRAND_TARGET]

    return async function({page, app}, screens) {
        await page.waitFor('.greeting')
        if (screens) await screenshot({page, app}, 'login')

        // The voip adapter has an endpoint field that must be filled.
        if (brand.plugins.builtin.user.adapter === 'vjs-adapter-user-voip') {
            await page.type('input[name="endpoint"]', brand.tests.endpoint)
        }

        await page.type('input[name="username"]', brand.tests[page._name].username)
        await page.type('input[name="password"]', brand.tests[page._name].password)
        if (screens) await screenshot({page, app}, 'login-credentials')

        await page.click('.test-login-button')
        await page.waitFor('.component-wizard-welcome')
    }
}
