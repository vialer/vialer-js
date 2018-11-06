const utils = require('../shared/utils')
const test = utils.asyncTest

const {
    brand,
    screenshot,
    step,
    loginAndWizard,
} = require('../shared')


test('[browser] Alice calls Bob, Bob answers.', async(t, onExit) => {
    const [alice, bob] = await Promise.all([
        loginAndWizard('alice', onExit, {screens: true}),
        loginAndWizard('bob', onExit),
    ])

    await screenshot(alice, 'ready-to-use')

    // Check that there are 3 fake input/output/sound devices at the start.
    const aliceDevices = alice.options.input.length + alice.options.output.length + alice.options.sounds.length
    t.equal(aliceDevices, 9, '    devices are available')

    // Call bob.
    await step('alice', 'calling bob')
    await utils.keypadEntry(alice, brand.tests.bob.number)
    await screenshot(alice, 'dialpad-call')
    await alice.page.click('.test-call-button')
    await alice.page.waitForSelector('.component-calls .call-ongoing')
    await screenshot(alice, 'calldialog-outgoing')

    // Answer alice.
    await bob.page.waitForSelector('.component-calls .call-ongoing')
    await step('bob', 'answer call', 'alice calls')
    await screenshot(bob, 'calldialog-incoming')
    await bob.page.click('.component-call .test-button-accept')

    // Alice and bob are now getting connected;
    // wait for alice and bob to see the connected screen.
    await alice.page.waitForSelector('.component-call .call-options')
    // Verify alice is talking to bob.
    const aliceNumber = await utils.getText(alice, '.component-call .info-number')
    t.equal(brand.tests.bob.number, aliceNumber, 'alice sees bob\'s number')

    await bob.page.waitForSelector('.component-call .call-options')
    // Verify bob is talking to alice.
    const bobNumber = await utils.getText(bob, '.component-call .info-number')
    t.equal(brand.tests.alice.number, bobNumber, 'bob sees alice\'s number')

    await screenshot(alice, 'calldialog-outgoing-accepted')
    await screenshot(bob, 'calldialog-incoming-accepted')

    // Alice hangs up.
    step('alice', 'hangs up')
    await alice.page.click('.component-call .test-button-terminate')

    // Wait for alice and bob to return to the keypad.
    await alice.page.waitForSelector('.component-call .new-call')
    await bob.page.waitForSelector('.component-call .new-call')
})
