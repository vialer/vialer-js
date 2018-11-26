const {_extend, promisify} = require('util')
const fs = require('fs')
const path = require('path')

const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const composer = require('gulp-uglify/composer')
const envify = require('gulp-envify')

const gulp = require('gulp')
const ifElse = require('gulp-if-else')
const logger = require('gulplog')
const minifier = composer(require('uglify-es'), console)
const notify = require('gulp-notify')
const size = require('gulp-size')
const source = require('vinyl-source-stream')
const sourcemaps = require('gulp-sourcemaps')
const through = require('through2')
const watchify = require('watchify')

const writeFileAsync = promisify(fs.writeFile)

let bundlers = {}
let helpers = {}
let tasks = {}


module.exports = function(settings) {
    /**
     * Create a Browserify bundle.
     * @param {Object} options - Options to pass.
     * @param {Array} options.addons - Extra bundle entries.
     * @param {String} options.entry - Entrypoint file.
     * @param {String} options.name - Bundle name.
     * @param {Array} options.requires - Extra bundle requires.
     * @returns {Promise} - Resolves when bundling is finished.
     */
    helpers.compile = function({addons = [], entry, requires = [], name}) {
        const brand = settings.brands[settings.BRAND_TARGET]

        if (!bundlers[name]) {
            let bundlerOptions = {
                basedir: settings.BASE_DIR,
                cache: {},
                debug: !settings.BUILD_OPTIMIZED,
                packageCache: {},
                paths: [
                    path.join(settings.ROOT_DIR, '../'),
                ],
            }

            if (entry) bundlerOptions.entries = entry
            bundlers[name] = browserify(bundlerOptions)

            if (settings.LIVERELOAD) bundlers[name].plugin(watchify)

            for (let _addon of addons) bundlers[name].add(_addon)
            for (const _require of requires) bundlers[name].require(_require)

            bundlers[name].ignore('buffer')
            bundlers[name].ignore('process')
            bundlers[name].ignore('rc')
            bundlers[name].ignore('module-alias/register')

            // Exclude the webextension polyfill from non-webextension builds.
            if (name === 'webview') bundlers[name].ignore('webextension-polyfill')
            helpers.transform(bundlers[name])
        }

        return new Promise((resolve) => {
            bundlers[name].bundle()
                .on('error', notify.onError('Error: <%= error.message %>'))
                .on('end', () => {resolve()})
                .pipe(source(`${name}.js`))
                .pipe(buffer())
                .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(helpers.envify(brand))
                .pipe(ifElse(settings.BUILD_OPTIMIZED, () => minifier()))
                .pipe(sourcemaps.write('./'))
                .pipe(size(_extend({title: `${name}.js`}, settings.SIZE_OPTIONS)))
                .pipe(gulp.dest(path.join(settings.BUILD_DIR, 'js')))
        })
    }


    helpers.envify = function(brand) {
        return envify({
            ANALYTICS_ID: brand.telemetry.analytics_id[settings.BUILD_TARGET],
            APP_NAME: brand.name.production,
            BRAND_TARGET: settings.BRAND_TARGET,

            BUILD_VERBOSE: settings.BUILD_VERBOSE,
            BUILTIN_AVAILABILITY_ADDONS: brand.plugins.builtin.availability.addons,
            BUILTIN_CONTACTS_I18N: brand.plugins.builtin.contacts.i18n,
            BUILTIN_CONTACTS_PROVIDERS: brand.plugins.builtin.contacts.providers,
            BUILTIN_USER_ADAPTER: brand.plugins.builtin.user.adapter,
            BUILTIN_USER_I18N: brand.plugins.builtin.user.i18n,
            CUSTOM_MOD: brand.plugins.custom,

            NODE_ENV: settings.NODE_ENV,
            PLATFORM_URL: brand.permissions,
            PORTAL_NAME: brand.vendor.portal.name,
            PORTAL_URL: brand.vendor.portal.url,
            PUBLISH_CHANNEL: settings.PUBLISH_CHANNEL,
            SENTRY_DSN: brand.telemetry.sentry.dsn,
            SIP_ENDPOINT: brand.sip_endpoint,
            STUN: brand.stun,
            LOGENTRIES_API_KEY: brand.telemetry.logentries.apiKey,

            VENDOR_NAME: brand.vendor.name,
            VENDOR_SUPPORT_EMAIL: brand.vendor.support.email,
            VENDOR_SUPPORT_PHONE: brand.vendor.support.phone,
            VENDOR_SUPPORT_WEBSITE: brand.vendor.support.website,
            VERSION: settings.PACKAGE.version,
        })
    }


    helpers.plugins = async function(sectionModules, appSection) {
        let requires = []

        for (const moduleName of Object.keys(sectionModules)) {
            const sectionModule = sectionModules[moduleName]

            // Builtin modules use special markers.
            if (['bg', 'i18n'].includes(appSection)) {
                if (sectionModule.adapter) {
                    logger.info(`[${appSection}] adapter plugin ${moduleName} (${sectionModule.adapter})`)
                    requires.push(`${sectionModule.adapter}/src/js/${appSection}`)
                } else if (sectionModule.providers) {
                    for (const provider of sectionModule.providers) {
                        logger.info(`[${appSection}] provider plugin ${moduleName} (${provider})`)
                        requires.push(`${provider}/src/js/${appSection}`)
                    }
                }
            }

            if (sectionModule.addons) {
                for (const addon of sectionModule.addons[appSection]) {
                    logger.info(`[${appSection}] addon plugin ${moduleName} (${addon})`)
                    requires.push(`${addon}/src/js/${appSection}`)
                }
            } else if (sectionModule.name) {
                logger.info(`[${appSection}] custom plugin ${moduleName} (${sectionModule.name})`)
                // A custom module is limited to a bg or fg section.
                if (sectionModule.parts.includes(appSection)) {
                    requires.push(`${sectionModule.name}/src/js/${appSection}`)
                }
            }
        }

        await helpers.compile({name: `app_${appSection}_plugins`, requires})
    }


    /**
     * Allow cleaner imports by rewriting commonjs require.
     *   From: "vialer-js/bg/plugins/user/adapter"
     *   To: "vialer-js/src/js/bg/plugins/user/adapter"
     *
     * Within the node runtime, the same kind of aliasing is applied
     * using module-alias. See `package.json` for the alias definition.
     * @param {Browserify} bundler - The Browserify bundler.
     */
    helpers.transform = function(bundler) {
        bundler.transform({global: true}, function(file, opts) {
            // Do a negative look-ahead to exclude matches that contain `vialer-js/src`.
            const aliasMatch = /(require\('vialer-js)(?!.*src)./g
            return through(function(buf, enc, next) {
                this.push(buf.toString('utf8').replace(aliasMatch, 'require(\'vialer-js/src/js/'))
                next()
            })
        })
    }


    tasks.appBg = async function codeAppBg(done) {
        await helpers.compile({entry: './src/js/bg/index.js', name: 'app_bg'})
        done()
    }


    tasks.appFg = async function codeAppFg(done) {
        await helpers.compile({entry: './src/js/fg/index.js', name: 'app_fg'})
        done()
    }


    tasks.appI18n = async function codeAppI18n(done) {
        const builtin = settings.brands[settings.BRAND_TARGET].plugins.builtin
        const custom = settings.brands[settings.BRAND_TARGET].plugins.custom
        await Promise.all([
            helpers.plugins(Object.assign(builtin, custom), 'i18n'),
            helpers.compile({entry: './src/js/i18n/index.js', name: 'app_i18n'}),
        ])
        done()
    }


    tasks.appObserver = async function codeAppObserver(done) {
        await helpers.compile({entry: './src/js/observer/index.js', name: 'app_observer'})
        done()
    }


    tasks.plugins = function codeAppPlugins(done) {
        const builtin = settings.brands[settings.BRAND_TARGET].plugins.builtin
        const custom = settings.brands[settings.BRAND_TARGET].plugins.custom

        Promise.all([
            helpers.plugins(Object.assign(builtin, custom), 'bg'),
            helpers.plugins(Object.assign(builtin, custom), 'fg'),
        ]).then(() => {
            done()
        })
    }


    tasks.electron = function codeElectron(done) {
        if (settings.BUILD_TARGET !== 'electron') {
            logger.info(`Electron task doesn\'t make sense for build target ${settings.BUILD_TARGET}`)
            return
        }

        // Vendor-specific info for Electron's main.js file.
        fs.createReadStream('./src/js/main.js').pipe(
            fs.createWriteStream(`./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}/main.js`)
        )

        const electronBrandSettings = settings.brands[settings.BRAND_TARGET].vendor
        const settingsFile = `./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}/settings.json`
        writeFileAsync(settingsFile, JSON.stringify(electronBrandSettings)).then(() => {done()})
    }


    tasks.vendorBg = async function codeVendorBg(done) {
        await helpers.compile({entry: './src/js/bg/vendor.js', name: 'vendor_bg'})
        done()
    }


    tasks.vendorFg = async function codeVendorFg(done) {
        await helpers.compile({
            addons: [
                path.join(settings.TEMP_DIR, settings.BRAND_TARGET, 'build', 'index.js'),
            ],
            entry: './src/js/fg/vendor.js',
            name: 'vendor_fg',
        })
        done()
    }

    return {helpers, tasks}
}

