const {_extend} = require('util')

const addsrc = require('gulp-add-src')
const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const childExec = require('child_process').exec
const cleanCSS = require('gulp-clean-css')
const composer = require('gulp-uglify/composer')
const concat = require('gulp-concat')
const connect = require('connect')
const envify = require('gulp-envify')
const fs = require('fs')
const gulp = require('gulp-help')(require('gulp'), {})
const gutil = require('gulp-util')
const http = require('http')
const ifElse = require('gulp-if-else')
const insert = require('gulp-insert')
const livereload = require('gulp-livereload')

const minifier = composer(require('uglify-es'), console)
const mount = require('connect-mount')
const notify = require('gulp-notify')
const path = require('path')

const runSequence = require('run-sequence')
const sass = require('gulp-sass')
const serveIndex = require('serve-index')
const serveStatic = require('serve-static')
const size = require('gulp-size')
const source = require('vinyl-source-stream')
const sourcemaps = require('gulp-sourcemaps')
const watchify = require('watchify')

// Browserify instance caching.
let BUNDLERS = {bg: null, fg: null, tab: null}
// Switches extra application verbosity on/off.


/**
* This helper class is here, so the main gulpfile won't get
* beyond 500 lines. Generally implement custom logic here,
* and call it from the main gulpfile.
*/
class Helpers {

    constructor(settings) {
        this.settings = settings
    }


    /**
    * Build the plugin and deploy it to an environment.
    * Currently, branded builds can be deployed to chrome and firefox.
    * @param {String} brandName - Brand to deploy.
    * @param {String} buildType - Environment to deploy to.
    * @param {String} distributionName - Name of the generated build zip.
    * @returns {Promise} - Resolves when done deploying.
    */
    deploy(brandName, buildType, distributionName) {
        const OLD_BRAND_TARGET = this.settings.BRAND_TARGET
        const OLD_BUILD_TARGET = this.settings.BUILD_TARGET

        this.settings.BRAND_TARGET = brandName
        this.settings.BUILD_TARGET = buildType

        return new Promise((resolve, reject) => {
            const PACKAGE = require('../package')

            if (buildType === 'chrome') {
                runSequence('build-dist', async() => {
                    const api = this.settings.brands[brandName].store.chrome
                    const zipFile = fs.createReadStream(`./dist/${brandName}/${buildType}/${distributionName}.zip`)

                    let res, token

                    const webStore = require('chrome-webstore-upload')({
                        clientId: api.clientId,
                        clientSecret: api.clientSecret,
                        // (!) Deploys to production, alpha or beta environment.
                        extensionId: api[`extensionId_${this.settings.DEPLOY_TARGET}`],
                        refreshToken: api.refreshToken,
                    })

                    try {
                        token = await webStore.fetchToken()
                        res = await webStore.uploadExisting(zipFile, token)
                    } catch (err) {
                        gutil.log(`An error occured during uploading: ${JSON.stringify(res, null, 4)}`)
                    }


                    if (res.uploadState !== 'SUCCESS') {
                        gutil.log(`An error occured during uploading: ${JSON.stringify(res, null, 4)}`)
                        return
                    }

                    gutil.log(`Uploaded ${brandName} Chrome WebExtension version ${PACKAGE.version}.`)
                    // Chrome store has a distinction to publish for `trustedTesters` and
                    // `default`(world). Instead, we use a separate extension which
                    // gives us more control over the release process.
                    try {
                        const _res = await webStore.publish('default', token)
                        if (_res.status.includes('OK')) {
                            gutil.log(`Published ${brandName} Chrome WebExtension version ${PACKAGE.version}.`)
                            this.settings.BRAND_TARGET = OLD_BRAND_TARGET
                            this.settings.BUILD_TARGET = OLD_BUILD_TARGET
                            resolve()
                        } else {
                            reject()
                            gutil.log(`An error occured during publishing: ${JSON.stringify(_res, null, 4)}`)
                        }
                    } catch (err) {
                        gutil.log(err)
                    }
                })
            } else if (buildType === 'firefox') {
                // The extension target is defined in the manifest.
                runSequence('build', () => {
                    // A Firefox extension version number can only be signed and
                    // uploaded once using web-ext. The second time will fail with an
                    // unobvious reason.
                    const api = this.settings.brands[brandName].store.firefox
                    // eslint-disable-next-line max-len
                    let _cmd = `web-ext sign --source-dir ./build/${brandName}/${buildType} --api-key ${api.apiKey} --api-secret ${api.apiSecret} --artifacts-dir ./build/${brandName}/${buildType}`
                    let child = childExec(_cmd, undefined, (err, stdout, stderr) => {
                        if (stderr) gutil.log(stderr)
                        if (stdout) gutil.log(stdout)
                        gutil.log(`Published ${brandName} Firefox WebExtension version ${PACKAGE.version}.`)
                        this.settings.BRAND_TARGET = OLD_BRAND_TARGET
                        this.settings.BUILD_TARGET = OLD_BUILD_TARGET
                        resolve()
                    })

                    child.stdout.on('data', (data) => {
                        process.stdout.write(`${data.toString()}\r`)
                    })
                })
            }
        })
    }


    /**
    * Generate a brand-specific distribution name.
    * @param {String} brandName - The brand name to use for the distribution.
    * @returns {String} - The distribution name to use.
    */
    distributionName(brandName) {
        let name = this.settings.brands[brandName].name[this.settings.DEPLOY_TARGET]
        return `${name}-${this.settings.PACKAGE.version}`
    }


    /**
    * Converts branding data to a valid SCSS variables string.
    * @param {Object} brandProperties: Key/value object that's converted to a SCSS variable string.
    * @returns {String} - Scss-formatted variables string.
    */
    formatScssVars(brandProperties) {
        return Object.keys(brandProperties).map((name) => '$' + name + ': ' + brandProperties[name] + ';').join('\n')
    }


    /**
    * Read the manifest file and augment it with generic
    * variable options(e.g. branding options)
    * that are not browser-specific.
    * @param {String} brandName - Brand to generate a manifest for.
    * @param {String} buildType - Target environment to generate a manifest for.
    * @returns {Object} - The manifest template.
    */
    getManifest(brandName, buildType) {
        const PACKAGE = require('../package')
        let manifest = require('../src/manifest.json')
        // Distinguish between the test-version and production name.
        manifest.name = this.settings.brands[brandName].name[this.settings.DEPLOY_TARGET]

        if (buildType === 'edge') {
            manifest.background.persistent = true
            manifest.browser_specific_settings = {
                edge: {
                    browser_action_next_to_addressbar: true,
                },
            }
        } else if (buildType === 'firefox') {
            // The id_beta property should not end up in the manifest.
            let storeIds = {
                alpha: this.settings.brands[brandName].store.firefox.gecko.id_alpha,
                beta: this.settings.brands[brandName].store.firefox.gecko.id_beta,
                production: this.settings.brands[brandName].store.firefox.gecko.id_production,
            }
            // Make sure these don't end up in the manifest.
            delete this.settings.brands[brandName].store.firefox.gecko.id_alpha
            delete this.settings.brands[brandName].store.firefox.gecko.id_beta
            delete this.settings.brands[brandName].store.firefox.gecko.id_production

            manifest.applications = {
                gecko: {
                    // (!) Deploys to production, alpha or beta environment.
                    id: this.settings.brands[brandName].store.firefox.gecko[`id_${this.settings.DEPLOY_TARGET}`],
                    strict_min_version: this.settings.brands[brandName].store.firefox.gecko.strict_min_version,
                },
            }
        }

        manifest.browser_action.default_title = manifest.name
        // Make sure this permission is not pushed multiple times
        // to the same manifest.
        if (!manifest.permissions.includes(this.settings.brands[brandName].permissions)) {
            manifest.permissions.push(this.settings.brands[brandName].permissions)
        }

        manifest.homepage_url = this.settings.brands[brandName].homepage_url
        manifest.version = PACKAGE.version
        return manifest
    }


    /**
    * Return a browserify function task used for multiple entrypoints.
    * @param {String} brandName - Brand to produce js for.
    * @param {String} buildType - Target environment to produce js for.
    * @param {String} target - Path to the entrypoint.
    * @param {String} bundleName - Name of the entrypoint.
    * @param {Function} entries - Optional extra entries.
    * @param {Function} cb - Callback when the task is done.
    */
    jsEntry(brandName, buildType, target, bundleName, entries = [], cb) {
        if (!BUNDLERS[bundleName]) {
            BUNDLERS[bundleName] = browserify({
                cache: {},
                debug: !this.settings.PRODUCTION,
                entries: path.join(this.settings.SRC_DIR, 'js', `${target}.js`),
                packageCache: {},
            })
            if (this.settings.LIVERELOAD) BUNDLERS[bundleName].plugin(watchify)
            for (let entry of entries) BUNDLERS[bundleName].add(entry)
        }
        BUNDLERS[bundleName].ignore('process')
        // Exclude the webextension polyfill from non-webextension builds.
        if (bundleName === 'webview') {
            BUNDLERS[bundleName].ignore('webextension-polyfill')
        }

        BUNDLERS[bundleName].bundle()
            .on('error', notify.onError('Error: <%= error.message %>'))
            .on('end', () => {
                cb()
            })
            .pipe(source(`${bundleName}.js`))
            .pipe(buffer())
            .pipe(ifElse(!this.settings.PRODUCTION, () => sourcemaps.init({loadMaps: true})))
            .pipe(envify({
                ANALYTICS_ID: this.settings.brands[brandName].analytics_id[buildType],
                APP_NAME: this.settings.brands[brandName].name.production,
                HOMEPAGE: this.settings.brands[brandName].homepage_url,
                NODE_ENV: this.settings.NODE_ENV,
                PLATFORM_URL: this.settings.brands[brandName].permissions,
                SIP_ENDPOINT: this.settings.brands[brandName].sip_endpoint,
                VENDOR_NAME: this.settings.brands[brandName].vendor.name,
                VENDOR_SUPPORT: this.settings.brands[brandName].vendor.support,
                VENDOR_TYPE: this.settings.brands[brandName].vendor.type,
                VERBOSE: this.settings.VERBOSE,
                VERSION: this.settings.PACKAGE.version,
            }))
            .pipe(ifElse(this.settings.PRODUCTION, () => minifier()))
            .pipe(ifElse(!this.settings.PRODUCTION, () => sourcemaps.write('./')))
            .pipe(gulp.dest(path.join(this.settings.BUILD_DIR, brandName, buildType, 'js')))
            .pipe(size(_extend({title: `${bundleName}.js`}, this.settings.SIZE_OPTIONS)))
    }


    /**
    * Generic scss task used for multiple entrypoints.
    * @param {String} brandName - Brand to produce scss for.
    * @param {String} buildType - Target environment to produce scss for.
    * @param {String} scssName - Name of the scss entrypoint.
    * @param {String} sourcemap - Generate sourcemaps.
    * @param {String} extraSource - Add extra entrypoints.
    * @returns {Function} - Sass function to use.
    */
    scssEntry(brandName, buildType, scssName, sourcemap = false, extraSource = false) {
        const brandColors = this.formatScssVars(this.settings.brands[brandName].colors)
        return gulp.src(`./src/scss/${scssName}.scss`)
            .pipe(ifElse(extraSource, () => addsrc(extraSource)))
            .pipe(insert.prepend(brandColors))
            .pipe(ifElse(sourcemap, () => sourcemaps.init({loadMaps: true})))
            .pipe(sass({
                includePaths: this.settings.NODE_PATH,
                sourceMap: false,
                sourceMapContents: false,
            }))
            .on('error', notify.onError('Error: <%= error.message %>'))
            .pipe(concat(`${scssName}.css`))
            .pipe(ifElse(this.settings.PRODUCTION, () => cleanCSS({advanced: true, level: 2})))
            .pipe(ifElse(sourcemap, () => sourcemaps.write('./')))
            .pipe(gulp.dest(path.join(this.settings.BUILD_DIR, brandName, buildType, 'css')))
            .pipe(size(_extend({title: `scss-${scssName}`}, this.settings.SIZE_OPTIONS)))
            .on('end', () => {
                if (this.settings.LIVERELOAD) livereload.changed(`${scssName}.css`)
            })
    }


    /**
    * Fire up a development server that serves docs
    * and the build directory.
    */
    startDevServer() {
        gutil.log('Starting development server. Hit Ctrl-c to quit.')
        const app = connect()
        livereload.listen({silent: false})
        app.use(serveStatic(this.settings.BUILD_DIR))
        app.use('/', serveIndex(this.settings.BUILD_DIR, {icons: false}))
        app.use(mount('/docs', serveStatic(path.join(__dirname, 'docs', 'build'))))
        http.createServer(app).listen(8999)
    }
}


module.exports = Helpers
