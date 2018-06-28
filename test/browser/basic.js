const {promisify} = require('util')
const mkdirp = promisify(require('mkdirp'))
const path = require('path')
const puppeteer = require('puppeteer')
const rc = require('rc')
const test = require('tape')

const rootPath = path.join(__dirname, '../', '../', 'build', 'tutorials')

let settings = {}
rc('vialer-js', settings)

// Environment initialization.
const BRAND_TARGET = process.env.BRAND_TARGET ? process.env.BRAND_TARGET : 'vialer'
let CI_PASSWORD, CI_USERNAME

if (process.env.CI_USERNAME && process.env.CI_PASSWORD) {
    // (!) Do NOT log these and commit to Github under any circumstance,
    // since it may expose the Travis CI secrets in the build log. Change the
    // account credentials immediately in case this happens by accident.
    CI_USERNAME = process.env.CI_USERNAME
    CI_PASSWORD = process.env.CI_PASSWORD
} else {
    CI_USERNAME = settings.tests.integration.username
    CI_PASSWORD = settings.tests.integration.password
}


test('[browser] <alice> I am logging in.', async(t) => {
    await mkdirp(rootPath)

    const browser = await puppeteer.launch({
        args: [
            '--disable-web-security',
            '--hide-scrollbars',
            '--ignore-certificate-errors',
            '--no-sandbox',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
        ],
        headless: settings.tests.integration.headless,
        pipe: true,
    })

    let alice, bob
    const pages = await browser.pages()
    if (!pages.length) {
        alice = await browser.newPage()
        bob = await browser.newPage()
    } else {
        alice = pages[0]
        bob = await browser.newPage()
    }

    if (!settings.tests.integration.headless) {
        alice.setViewport({height: 600, width: 500})
        bob.setViewport({height: 600, width: 500})
    }

    await Promise.all([
        alice.goto(`http://localhost:${settings.tests.integration.port}/${BRAND_TARGET}/webview/`, {waitUntil: 'networkidle0'}),
        bob.goto(`http://127.0.0.1:${settings.tests.integration.port}/${BRAND_TARGET}/webview/`, {waitUntil: 'networkidle0'}),
    ])

    await alice.waitFor('.greeting')
    await alice.screenshot({path: path.join(rootPath, '1. login.png')})

    await alice.type('input[name="username"]', CI_USERNAME)
    await alice.type('input[name="password"]', CI_PASSWORD)
    await alice.screenshot({path: path.join(rootPath, '2. login-credentials.png')})

    await alice.click('.test-login-button')
    await alice.waitFor('.component-step-welcome')
    t.end()

    test('[browser] <alice> I am going to complete the wizard.', async(_t) => {
        await alice.screenshot({path: path.join(rootPath, '3. wizard-step-welcome.png')})

        await alice.click('.test-wizard-button-next')
        await alice.waitFor('.component-step-telemetry')
        await alice.screenshot({path: path.join(rootPath, '4. wizard-step-telemetry.png')})

        await alice.click('.test-step-telemetry-button-yes')
        await alice.waitFor('.component-step-voipaccount')
        // Wait for the select to be filled by the API call.
        await alice.waitFor('select option:not([disabled="disabled"])')
        await alice.screenshot({path: path.join(rootPath, '5. wizard-step-voipaccount.png')})

        await alice.click('.test-wizard-button-next')
        await alice.waitFor('.component-step-mic-permission')
        await alice.screenshot({path: path.join(rootPath, '6. wizard-step-microphone.png')})

        await alice.click('.test-wizard-button-finish')
        await alice.waitFor('.component-main-statusbar')

        // Transfer Alice as-is to Bob.
        const vaultKey = await alice.evaluate('bg.crypto.storeVaultKey()')
        let bobState = await alice.evaluate('bg.state')
        // The third account is Bob.
        bobState.settings.webrtc.account.selected = bobState.settings.webrtc.account.options[2]

        await bob.evaluate(`bg.setState(${JSON.stringify(bobState)})`)
        await bob.evaluate(`bg.crypto._importVaultKey('${vaultKey}')`)
        await bob.evaluate('bg.modules.calls.connect()')
        // Wait until bob is connected.
        await bob.waitFor('.component-main-statusbar.ok')
        _t.end()

        // Open a second tab and get another tab ready.
        test('[browser] <alice> I am calling bob.', async(__t) => {
            let [inputOptions, outputOptions, soundsOptions] = await Promise.all([
                alice.$$('#input_device option'),
                alice.$$('#output_device option'),
                alice.$$('#sounds_device option'),
            ])
            await alice.screenshot({path: path.join(rootPath, '7. settings-audio-devices.png')})

            // There are exactly 3 fake input/output devices.
            t.equal(inputOptions.length, 3, 'input devices are filled from browser devices query')
            t.equal(outputOptions.length, 3, 'output devices are filled from browser devices query')
            t.equal(soundsOptions.length, 3, 'sounds devices are filled from browser devices query')

            // Close audio settings check notification and head over to the calls page.
            await alice.click('.notification .test-delete')
            await alice.click('.component-main-menubar .test-menubar-calls')

            // Enter a number and press the call button.
            await alice.waitFor('.component-call-keypad')
            await alice.click('.component-call-keypad .test-key-2')
            await alice.click('.component-call-keypad .test-key-2')
            await alice.click('.component-call-keypad .test-key-9')
            await alice.screenshot({path: path.join(rootPath, '8. dialpad-call.png')})
            await alice.click('.test-call-button')

            await alice.waitFor('.component-calls .call-ongoing')
            await alice.screenshot({path: path.join(rootPath, '9. calldialog-outgoing.png')})

            __t.end()

            test('[browser] <bob> alice is calling; let\'s talk.', async(___t) => {
                await bob.waitFor('.component-calls .call-ongoing')
                await bob.screenshot({path: path.join(rootPath, '10. calldialog-incoming.png')})
                await bob.click('.component-call .test-button-accept')
                // Alice and bob are now getting connected;
                // wait for Alice to see the connected screen.
                await alice.waitFor('.component-call .call-options')
                await alice.screenshot({path: path.join(rootPath, '11. calldialog-outgoing-accepted.png')})
                await bob.screenshot({path: path.join(rootPath, '12. calldialog-incoming-accepted.png')})

                await browser.close()
                ___t.end()
            })
        })
    })
})
