const utils = require('../shared/utils')
const test = utils.asyncTest

const {
    brand,
    screenshot,
    step,
    loginAndWizard,
} = require('../shared/bootstrap.js')


test('[browser] Alice calls Bob, Bob answers.', async (t, onExit) => {
    const [alice, bob] = await Promise.all([
        loginAndWizard('alice', onExit, {screens: true}),
        loginAndWizard('bob', onExit),
    ])

    await screenshot(alice, 'ready-to-use')

    // Check that there are 3 fake input/output/sound devices at the start.
    const aliceDevices = alice.options.input.length + alice.options.output.length + alice.options.sounds.length
    const bobDevices = bob.options.input.length + bob.options.output.length + bob.options.sounds.length
    t.equal(aliceDevices, 9, '[browser] <alice> all devices are available')
    t.equal(bobDevices, 9, '[browser] <bob> all devices are available')

    // Call bob.
    await step('alice', 'I am calling bob.')
    await utils.keypadEntry(alice, brand.tests.bob.number)
    await screenshot(alice, 'dialpad-call')
    await alice.page.click('.test-call-button')
    await alice.page.waitFor('.component-calls .call-ongoing')
    await screenshot(alice, 'calldialog-outgoing')

    // Answer alice.
    await step('bob', 'alice is calling; let\'s talk.')
    await bob.page.waitFor('.component-calls .call-ongoing')
    await screenshot(bob, 'calldialog-incoming')
    await bob.page.click('.component-call .test-button-accept')

    // Alice and bob are now getting connected;
    // wait for alice and bob to see the connected screen.
    await alice.page.waitFor('.component-call .call-options')
    // Verify alice is talking to bob.
    const aliceNumber = await utils.getText(alice, '.component-call .info-number')
    t.equal(brand.tests.bob.number, aliceNumber, '[browser] <alice> is called by number bob.')

    await bob.page.waitFor('.component-call .call-options')
    // Verify bob is talking to alice.
    const bobNumber = await utils.getText(bob, '.component-call .info-number')
    t.equal(brand.tests.alice.number, bobNumber, '[browser] <bob> is called by number alice.')

    await screenshot(alice, 'calldialog-outgoing-accepted')
    await screenshot(bob, 'calldialog-incoming-accepted')

    console.log('[browser] Letting alice and bob "talk" for 2 seconds.')
    await utils.delay(2000)

    // Alice hangs up.
    step('alice', 'Hangs up.')
    await alice.page.click('.component-call .test-button-terminate')

    // Wait for alice and bob to return to the keypad.
    await alice.page.waitFor('.component-call .new-call')
    await bob.page.waitFor('.component-call .new-call')
})
