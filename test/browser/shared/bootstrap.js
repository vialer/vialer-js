const {promisify} = require('util')
const mkdirp = promisify(require('mkdirp'))
const path = require('path')
const puppeteer = require('puppeteer')
const test = require('tape-catch')
const utils = require('./utils.js')


// Environment initialization.
const BRAND = process.env.BRAND ? process.env.BRAND : 'bologna'
const SCREENS = process.env.SCREENS ? true : false

const settings = require('../../../tools/settings')(path.join(__dirname, '../../'))
// Force to webview.
settings.BUILD_TARGET = 'webview'

const brand = settings.brands[BRAND]

// Allows overriding the headless setting with an environment flag.
let HEADLESS
if (process.env.HEADLESS) {
    HEADLESS = process.env.HEADLESS === '1' ? true : false
} else HEADLESS = brand.tests.headless


// WARNING: Do NOT log CI variables while committing to Github.
// This may expose the Circle CI secrets in the build log. Change the
// account credentials immediately when this happens.
if (process.env[`CI_USERNAME_ALICE_${BRAND.toUpperCase()}`]) {
    brand.tests.endpoint = process.env[`CI_ENDPOINT_${BRAND.toUpperCase()}`]
    brand.tests.alice.username = process.env[`CI_USERNAME_ALICE_${BRAND.toUpperCase()}`]
    brand.tests.alice.password = process.env[`CI_PASSWORD_ALICE_${BRAND.toUpperCase()}`]
    brand.tests.alice.id = process.env[`CI_ID_ALICE_${BRAND.toUpperCase()}`]
    brand.tests.bob.username = process.env[`CI_USERNAME_BOB_${BRAND.toUpperCase()}`]
    brand.tests.bob.password = process.env[`CI_PASSWORD_BOB_${BRAND.toUpperCase()}`]
    brand.tests.bob.id = process.env[`CI_ID_BOB_${BRAND.toUpperCase()}`]
}

/**
* Each test user has its own browser.
* @param {String} name - Name of the testrunner.
* @param {Object} options - Options to pass to the runner.
* @returns {Object} - Browser and pages.
*/
async function createBrowser(name, options) {
    let browser = await puppeteer.launch({
        executablePath: process.env.OVERRIDE_CHROMIUM_PATH,
        args: [
            '--disable-notifications',
            '--disable-web-security',
            '--hide-scrollbars',
            '--ignore-certificate-errors',
            '--no-sandbox',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
        ],
        headless: HEADLESS,
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
 * @param {String} message - Message to print.
 */
async function step(actor, message) {
    console.log(`[browser] <${actor}> ${message}`)
    if (!HEADLESS) await utils.delay(2000)
}


/**
 * Take a screenshot of `browser` and write it to file.
 * @param {Object} browser - Browser instance returned by `loginAndWizard`.
 * @param {*} name - Name the screenshot (actor name will be prepended).
 */
async function screenshot({app, page}, name) {
    if (SCREENS) {
        await mkdirp(settings.SCREENS_DIR)
        const filename = `${page._name}-${name}.png`
        screenshotPath = path.join(settings.SCREENS_DIR, filename)
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
    await step(name, 'Opening browser')
    let browser = await createBrowser(name)

    // Keep browsers open when HEADLESS=false, this will halt the next tests
    // and gives the developer time to debug.
    if (HEADLESS) {
        onExit(async () => {
            console.log(`[browser] <${name}> Closing browser.`)
            await browser.browser.close()
        })
    }

    let page = browser.pages[0]
    page.setViewport({height: 600, width: 500})

    const uri = `http://127.0.0.1:${brand.tests.port}/index.html?test=true`
    await page.goto(uri, {})

    const me = {
        browser: browser,
        page: page,
        app: await page.$('#app'),
    }

    await step(name, 'Logging in.')
    await login(me, screens)

    await step(name, 'Completing wizard.')
    const options = await wizard(me, screens)
    await page.click('.test-delete-notification')

    // Wait until the status indicates a registered device.
    await page.waitFor('.test-status-registered')

    return Object.assign({options: options}, me)
}


module.exports = {
    brand: brand,
    settings: settings,
    screenshot: screenshot,
    step: step,
    loginAndWizard: loginAndWizard,
}
