module.exports = function(settings, screenshot) {
    const brand = settings.brands[settings.BRAND_TARGET]

    return async function({page, app}, screens) {
        await page.waitForSelector('.greeting')
        if (screens) await screenshot({app, page}, 'login')

        // The voip adapter has an endpoint field that must be filled.
        if (brand.plugins.builtin.user.adapter === '@vialer/vjs-adapter-user-voip') {
            await page.type('input[name="endpoint"]', brand.tests.endpoint)
        }

        await page.type('input[name="username"]', brand.tests[page._name].username)
        await page.type('input[name="password"]', brand.tests[page._name].password)
        if (screens) await screenshot({app, page}, 'login-credentials')

        await page.click('.test-login-button')
        await page.waitForSelector('.component-wizard-welcome')
    }
}
