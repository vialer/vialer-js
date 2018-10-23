const test = require('tape-catch')

const {
    brand,
    createBrowser,
    login,
    wizard,
} = require('../shared/bootstrap.js')


test('[browser] <alice> I am logging in.', async(t) => {
    let [browserAlice, browserBob] = await Promise.all([createBrowser('alice'), createBrowser('bob')])
    let alice = browserAlice.pages[0]
    let bob = browserBob.pages[0]

    alice.setViewport({height: 600, width: 500})
    bob.setViewport({height: 600, width: 500})

    const uri = `http://127.0.0.1:${brand.tests.port}/index.html?test=true`
    await Promise.all([alice.goto(uri, {}), bob.goto(uri, {})])

    await Promise.all([
        await login(alice, true),
        await login(bob, false),
    ])

    t.end()

    test('[browser] <alice> I am going to complete the wizard.', async(_t) => {
        const aliceContainer = await alice.$('#app')
        let [aliceOptions, bobOptions] = await Promise.all([
            await wizard(alice, true),
            await wizard(bob, false),
        ])

        await brand.tests.screenshot(aliceContainer, alice, 'ready-to-use')

        await Promise.all([
            alice.click('.test-delete-notification'),
            bob.click('.test-delete-notification'),
        ])

        // Check that there are 3 fake input/output/sound devices at the start.
        const aliceDevices = aliceOptions.input.length + aliceOptions.output.length + aliceOptions.sounds.length
        const bobDevices = bobOptions.input.length + bobOptions.output.length + bobOptions.sounds.length
        t.equal(aliceDevices, 9, '[browser] <alice> all devices are available')
        t.equal(bobDevices, 9, '[browser] <bob> all devices are available')

        _t.end()

        test('[browser] <alice> I am calling bob.', async(__t) => {
            // Wait until the status indicates a registered device.
            await alice.waitFor('.test-status-registered')
            // Enter a number and press the call button.
            await alice.click('.component-call-keypad .test-key-2')
            await alice.click('.component-call-keypad .test-key-2')
            await alice.click('.component-call-keypad .test-key-9')
            await brand.tests.screenshot(aliceContainer, alice, 'dialpad-call')
            await alice.click('.test-call-button')

            await alice.waitFor('.component-calls .call-ongoing')
            await brand.tests.screenshot(aliceContainer, alice, 'calldialog-outgoing')

            __t.end()

            test('[browser] <bob> alice is calling; let\'s talk.', async(___t) => {
                const bobContainer = await bob.$('#app')
                await bob.waitFor('.component-calls .call-ongoing')
                await brand.tests.screenshot(bobContainer, bob, 'calldialog-incoming')
                await bob.click('.component-call .test-button-accept')
                // Alice and bob are now getting connected;
                // wait for Alice to see the connected screen.
                await alice.waitFor('.component-call .call-options')
                await brand.tests.screenshot(aliceContainer, alice, 'calldialog-outgoing-accepted')
                await brand.tests.screenshot(bobContainer, bob, 'calldialog-incoming-accepted')

                await browserAlice.browser.close()
                await browserBob.browser.close()
                ___t.end()
            })
        })
    })
})
