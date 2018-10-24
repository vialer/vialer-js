const utils = require('../shared/utils')
const test = utils.asyncTest

const {
    brand,
    screenshot,
    step,
    loginAndWizard,
} = require('../shared/bootstrap.js')


test('[browser] Alice calls Bob and blind transfers to Charlie.', async (t, onExit) => {
    const [alice, bob, charlie] = await Promise.all([
        loginAndWizard('alice', onExit),
        loginAndWizard('bob', onExit),
        loginAndWizard('charlie', onExit),
    ])
    // Call bob.
    await step('alice', 'I am calling bob.')
    await utils.keypadEntry(alice, brand.tests.bob.number)
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
    t.equal(brand.tests.bob.number, aliceNumber, '[browser] <alice> is called by number of bob.')

    await bob.page.waitFor('.component-call .call-options')
    // Verify bob is talking to alice.
    const bobNumber = await utils.getText(bob, '.component-call .info-number')
    t.equal(brand.tests.alice.number, bobNumber, '[browser] <bob> is called by number of alice.')

    console.log('[browser] Letting alice and bob "talk" for 2 seconds.')
    await utils.delay(2000)

    // Alice blind transfers to Charlie.
    step('alice', 'Blind transfers to charlie.')
    await alice.page.click('.component-call .test-transfer-button')
    await alice.page.waitFor('.component-call .transfer-options')
    // Pick blind (unattended) transfer.
    await alice.page.click('.component-call .transfer-options .test-blind-button')
    // Focus number input
    await alice.page.click('.component-call .transfer-options .number-input input')
    await alice.page.type('.component-call .transfer-options .number-input input', brand.tests.charlie.number)
    // Click on icon-small (transfer)
    await alice.page.click('.component-call .transfer-options .test-keypad-action')

    // Charlie is being called and answers.
    step('charlie', 'Is being called and answers.')
    await charlie.page.waitFor('.component-calls .call-ongoing')
    await screenshot(charlie, 'calldialog-incoming')
    await charlie.page.click('.component-call .test-button-accept')
    await charlie.page.waitFor('.component-call .call-options')
    // Verify charlie is talking to bob.
    const charlieNumber = await utils.getText(charlie, '.component-call .info-number')
    t.equal(brand.tests.bob.number, charlieNumber, '[browser] <charlie> is called by number of bob.')
    // Verify bob is still talking to alice.
    const bobNumberAfterTransfer = await utils.getText(bob, '.component-call .info-number')
    t.equal(brand.tests.alice.number, bobNumberAfterTransfer, '[browser] <bob> is still being called by number of alice.')
    // Alice's call should be ended now.
    await alice.page.waitFor('.component-call .new-call')

    console.log('[browser] Letting bob and charlie "talk" for 2 seconds.')
    await utils.delay(2000)

    step('bob', 'Hangs up.')
    await bob.page.click('.component-call .test-button-terminate')
    // Wait for all actors to return to the keypad.
    await bob.page.waitFor('.component-call .new-call')
    await charlie.page.waitFor('.component-call .new-call')
})
