const {promisify} = require('util')
const c = require('ansi-colors')
const mkdirp = promisify(require('mkdirp'))
const path = require('path')
const puppeteer = require('puppeteer')
const utils = require('./utils.js')

// Use the project directory as base directory.
const settings = require('../../../gulp/settings')(
    path.join(__dirname, '../../../'), {
        overrides: {
            // Force webview build modus.
            BUILD_TARGET: 'webview',
        },
    }
)

// WARNING: Do NOT log CI variables while committing to Github.
// This may expose the Circle CI secrets in the build log. Change the
// account credentials immediately when this happens.
if (process.env[`CI_USERNAME_ALICE_${settings.BRAND_TARGET.toUpperCase()}`]) {
    settings.BRAND.tests.endpoint = process.env[`CI_ENDPOINT_${settings.BRAND_TARGET.toUpperCase()}`]
    for (const actor of ['alice', 'bob', 'charlie']) {
        for (const field of ['id', 'number', 'username', 'password']) {
            const name = ['ci', field, actor, settings.BRAND_TARGET].map(e => e.toUpperCase()).join('_')
            settings.BRAND.tests[actor][field] = process.env[name]
        }
    }
}

/**
* Each test user has its own browser.
* @param {String} name - Name of the testrunner.
* @param {Object} options - Options to pass to the runner.
* @returns {Object} - Browser and pages.
*/
async function createBrowser(name, options) {
    let browser = await puppeteer.launch({
        args: [
            '--disable-notifications',
            '--disable-web-security',
            '--hide-scrollbars',
            '--ignore-certificate-errors',
            '--no-sandbox',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
        ],
        executablePath: process.env.OVERRIDE_CHROMIUM_PATH,
        headless: settings.HEADLESS,
        pipe: true,
    })

    let pages = await browser.pages()
    pages[0]._name = name
    return {browser, pages}
}


/**
 * Report a test step of `actor`.
 * When not in HEADLESS mode, it will also pause for 2 seconds.
 * @param {String} actor - Name of the actor.
 * @param {String} message - Step message to print.
 * @param {String} context - Step context to print.
 */
async function step(actor, message, context = '') {
    let prefix

    prefix = actor.padEnd(7)
    if (context) context = c.italic(` <${context}>`)
    if (actor === 'alice') prefix = c.cyan(prefix)
    else if (actor === 'bob') prefix = c.magenta(prefix)
    else if (actor === 'charlie') prefix = c.yellow(prefix)
    console.log(`${prefix}${context} ${c.grey(message)}`)
    if (settings.DEBUG_MODE) {
        await utils.delay(2000)
    }
}


/**
 * Take a screenshot of `browser` and write it to file.
 * @param {Object} browser - Browser instance returned by `loginAndWizard`.
 * @param {*} name - Name the screenshot (actor name will be prepended).
 */
async function screenshot({app, page}, name) {
    if (settings.SCREENS) {
        await mkdirp(settings.SCREENS_DIR)
        const filename = `${page._name}-${name}.png`
        const screenshotPath = path.join(settings.SCREENS_DIR, filename)
        await app.screenshot({path: screenshotPath})
    }
}


const login = require('./login')(settings, screenshot)
const wizard = require('./wizard')(settings, screenshot)


/**
 * Start a new browser, login and complete the wizard and return the
 * instance for further testing. Login credentials are read from the
 * settings.
 * @param {String} name - Name of the actor.
 * @param {Function} onExit - Exit function registration.
 * @param {Object} options - Options.
 * @returns {Object} - Browser instance.
 */
async function loginAndWizard(name, onExit, {screens = false} = {}) {
    await step(name, 'open browser')
    let browser = await createBrowser(name)

    // Keep browsers open when DEBUG=true, this will halt the next tests
    // and gives the developer time to debug.
    if (!settings.DEBUG_MODE) {
        onExit(async() => {
            await step(name, 'close browser')
            await browser.browser.close()
        })
    } else {
        console.log('NOEXIT=false: Not closing browsers automatically.')
    }

    let page = browser.pages[0]
    page.setViewport({height: 600, width: 500})
    // Apply timeouts to make tests fail earlier.
    page.setDefaultNavigationTimeout(15000)
    // Patch waitForSelector to always use a default timeout.
    const _waitForSelector = page.waitForSelector.bind(page)
    page.waitForSelector = async(selector, options = {timeout: 30000}) => {
        await _waitForSelector(selector, options)
    }

    const uri = `http://127.0.0.1:${settings.BRAND.tests.port}/index.html?test=true`
    await page.goto(uri, {})

    const me = {
        app: await page.$('#app'),
        browser: browser,
        page: page,
    }

    await step(name, 'logging in')
    await login(me, screens)

    await step(name, 'completing wizard')
    const options = await wizard(me, screens)
    await page.click('.test-delete-notification')

    // Wait until the keypad is available.
    await page.waitForSelector('.test-keypad-available')
    return Object.assign({options}, me)
}


module.exports = {
    brand: settings.BRAND,
    loginAndWizard,
    screenshot,
    settings,
    step,
}
