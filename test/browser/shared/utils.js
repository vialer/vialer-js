const test = require('tape-catch')


function asyncTest(title, func) {
    cleanup = []

    onExit = (f) => cleanup.push(f)

    return test(title, async (t) => {
        try {
            await func(t, onExit)
            t.end()
        } catch (e) {
            console.log('error', e)
            t.fail('exception')
        } finally {
            for (f of cleanup) {
                await f()
            }
        }
    })
}


async function keypadEntry({page}, str) {
    for (number of str) {
        await page.click(`.component-call-keypad .test-key-${number}`)
    }
}


async function getText({page}, selector) {
    return await page.$eval(selector, el => el.innerText)
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


module.exports = {
    asyncTest: asyncTest,
    keypadEntry: keypadEntry,
    getText: getText,
    delay, delay,
}
