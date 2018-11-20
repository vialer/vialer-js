const test = require('tape-catch')


/**
 * Perform a async tape test.
 *
 * This function will automatically call `t.end` when the test body is done.
 *
 * It also provides an `onExit` hook to register handlers that will be called
 * when the test is done (irregardless of failure or success).
 *
 * Finally it will catch exceptions in the async test body and report them and
 * fail the tape test.
 *
 * @param {String} title - Test title.
 * @param {AsyncFunction} func - Test body.
 * @returns {Tape} - Tape test case
 */
function asyncTest(title, func) {
    const cleanup = []
    const onExit = (f) => cleanup.push(f)

    return test(title, async(t) => {
        try {
            await func(t, onExit)
            t.end()
        } catch (e) {
            t.fail('exception')
        } finally {
            for (const f of cleanup) {
                await f()
            }
        }
    })
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


async function keypadEntry({page}, str) {
    for (const number of str) {
        await delay(1000)
        await page.click(`.component-call-keypad .test-key-${number}`)
    }
}


async function getText({page}, selector) {
    return await page.$eval(selector, el => el.innerText)
}





module.exports = {
    asyncTest,
    delay,
    getText,
    keypadEntry,
}
