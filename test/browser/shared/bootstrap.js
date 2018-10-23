const {promisify} = require('util')
const mkdirp = promisify(require('mkdirp'))
const path = require('path')
const puppeteer = require('puppeteer')


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

Object.assign(brand.tests, {
    step: (runner) => {
        if (!this.steps[runner._name]) this.steps[runner._name] = 0
        this.steps[runner._name] += 1
        // Don't use steps in the filename, because the step number
        // may defer per build.
        return `${runner._name}-`
    },
    screenshot: async (browser, runner, name) => {
        if (SCREENS) {
            await mkdirp(settings.SCREENS_DIR)
            screenshotPath = path.join(settings.SCREENS_DIR, `${brand.tests.step(runner)}${name}.png`)
            await browser.screenshot({path: screenshotPath})
        }
    },
    steps: {},
})

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


module.exports = {
    settings: settings,
    brand: brand,
    createBrowser: createBrowser,
    login: require('./login')(settings),
    wizard: require('./wizard')(settings),
}
