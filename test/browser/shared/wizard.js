module.exports = function(settings, screenshot) {
    const brand = settings.brands[settings.BRAND_TARGET]

    return async function({page, app}, screens) {
        if (screens) await screenshot({app, page}, 'wizard-welcome')

        await page.click('.test-wizard-welcome-next')
        await page.waitForSelector('.component-wizard-telemetry')
        if (screens) await screenshot({app, page}, 'wizard-telemetry')

        await page.click('.test-wizard-telemetry-yes')

        // For now, only vjs-adapter-user-vg supports account selection.
        if (brand.plugins.builtin.user.adapter === '@vialer/vjs-adapter-user-vg') {
            await page.waitForSelector('.component-wizard-account')
            // Wait for the select to be filled by the platform API call.
            await page.waitForSelector('.filtered-options .option')

            await page.click('input[id="webrtc_account"]')
            await page.click(`.filtered-options #option-${brand.tests[page._name].id}`)

            if (screens) await screenshot({app, page}, 'wizard-account')
            await page.click('.test-wizard-account-next')
        }

        await page.waitForSelector('.component-wizard-mic-permission')
        if (screens) await screenshot({app, page}, 'wizard-mic-permission')
        await page.click('.test-wizard-mic-permission-next')

        await page.waitForSelector('.component-wizard-devices')
        await page.waitForSelector('select option:not([disabled="disabled"])')

        let [input, output, sounds] = await Promise.all([
            page.$$('#input_device option'),
            page.$$('#output_device option'),
            page.$$('#sounds_device option'),
        ])

        if (screens) await screenshot({app, page}, 'wizard-devices')
        await page.click('.test-wizard-devices-next')

        await page.waitForSelector('.notification')

        return {input, output, sounds}
    }

}
