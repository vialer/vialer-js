/** @memberof Gulp */
const {_extend} = require('util')

const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const childExec = require('child_process').exec
const cleanCSS = require('gulp-clean-css')
const composer = require('gulp-uglify/composer')
const concat = require('gulp-concat')
const connect = require('connect')
const createReleaseManager = require('gulp-sentry-release-manager')
const envify = require('gulp-envify')
const fs = require('fs')
const fuet = require('gulp-fuet')
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
const through = require('through2')
const watchify = require('watchify')

// Browserify instance caching.
let BUNDLERS = {bg: null, fg: null, tab: null}
// Switches extra application verbosity on/off.


/**
* This helper class is here, so the main gulpfile won't get
* beyond 500 lines. Generally implement custom logic here,
* and call it from the main gulpfile.
* @memberof Gulp
*/
class Helpers {

    constructor(settings) {
        this.settings = settings
    }


    _jsEnvify(brand) {
        return envify({
            ANALYTICS_ID: brand.telemetry.analytics_id[this.settings.BUILD_TARGET],
            APP_NAME: brand.name.production,
            BRAND_NAME: this.settings.BRAND_TARGET,

            BUILTIN_AVAILABILITY_ADDONS: brand.plugins.builtin.availability.addons,
            BUILTIN_CONTACTS_I18N: brand.plugins.builtin.contacts.i18n,
            BUILTIN_CONTACTS_PROVIDERS: brand.plugins.builtin.contacts.providers,
            BUILTIN_USER_ADAPTER: brand.plugins.builtin.user.adapter,
            BUILTIN_USER_I18N: brand.plugins.builtin.user.i18n,
            CUSTOM_MOD: brand.plugins.custom,

            DEPLOY_TARGET: this.settings.DEPLOY_TARGET,
            NODE_ENV: this.settings.NODE_ENV,
            PLATFORM_URL: brand.permissions,
            PORTAL_NAME: brand.vendor.portal.name,
            PORTAL_URL: brand.vendor.portal.url,
            SENTRY_DSN: brand.telemetry.sentry.dsn,
            SIP_ENDPOINT: brand.sip_endpoint,
            STUN: brand.stun,

            VENDOR_NAME: brand.vendor.name,
            VENDOR_SUPPORT_EMAIL: brand.vendor.support.email,
            VENDOR_SUPPORT_PHONE: brand.vendor.support.phone,
            VENDOR_SUPPORT_WEBSITE: brand.vendor.support.website,
            VERBOSE: this.settings.VERBOSE,
            VERSION: this.settings.PACKAGE.version,
        })
    }


    /**
    * Rewrite requires in modules from something like 'vialer-js/bg/plugins/user/adapter`
    * to `vialer-js/src/js/bg/plugins/user/adapter`. Within the node runtime,
    * the same kind of aliasing is applied with module-alias. See `package.json`
    * for the alias definition.
    * @param {String} file - Browserify file being transformed.
    * @param {Object} opts - Browserify options.
    * @returns {Stream} - A stream that is both readable and writable.
    */
    browserifyTransform(file, opts) {
        // Do a negative look-ahead to exclude matches that contain `vialer-js/src`.
        const aliasMatch = /(require\('vialer-js)(?!.*src)./g
        return through(function(buf, enc, next) {
            this.push(buf.toString('utf8').replace(aliasMatch, 'require(\'vialer-js/src/js/'))
            next()
        })
    }


    compileTemplates(sources) {
        return gulp.src(sources)
            .pipe(fuet({
                commonjs: false,
                namespace: 'global.templates',
                pathfilter: ['src', 'components', 'node_modules'],
            }))
            .on('error', notify.onError('Error: <%= error.message %>'))
            .pipe(ifElse(this.settings.PRODUCTION, () => minifier()))
            .on('end', () => {
                if (this.settings.LIVERELOAD) livereload.changed('templates.js')
            })
            .pipe(concat('templates.js'))
            .pipe(insert.prepend('global.templates={};'))
            .pipe(gulp.dest(path.join(this.settings.BUILD_DIR, 'js')))
            .pipe(size(_extend({title: 'templates'}, this.settings.SIZE_OPTIONS)))
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
                    const distTarget = `./dist/${brandName}/${distributionName}`
                    const zipFile = fs.createReadStream(distTarget)

                    let res, token

                    const webStore = require('chrome-webstore-upload')({
                        clientId: api.clientId,
                        clientSecret: api.clientSecret,
                        // (!) Deploys to production, alpha or beta environment.
                        extensionId: api[`extensionId_${this.settings.DEPLOY_TARGET}`],
                        refreshToken: api.refreshToken,
                    })

                    try {
                        gutil.log('Retrieving Google store access token')
                        token = await webStore.fetchToken()
                        gutil.log(`Access token retrieved; uploading ${distTarget}`)
                        res = await webStore.uploadExisting(zipFile, token)
                    } catch (err) {
                        gutil.log(`An error occured during uploading: ${JSON.stringify(err, null, 4)}`)
                        return
                    }


                    if (res.uploadState !== 'SUCCESS') {
                        gutil.log(`An error occured after uploading: ${JSON.stringify(res, null, 4)}`)
                        return
                    }

                    gutil.log(`Uploaded ${brandName} Chrome WebExtension version ${PACKAGE.version}.`)
                    // Chrome store has a distinction to publish for `trustedTesters` and
                    // `default`(world). Instead, we use a separate extension which
                    // gives us more control over the release process.
                    try {
                        const _res = await webStore.publish('default', token)
                        if (_res.status.includes('OK')) {
                            // Upload stacktrace related files to Sentry.
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
        let distName = `${this.settings.BRAND_TARGET}-${this.settings.BUILD_TARGET}-${this.settings.PACKAGE.version}`
        if (this.settings.BUILD_TARGET === 'electron') distName += `-${this.settings.BUILD_ARCH}`

        if (this.settings.DEPLOY_TARGET !== 'production') distName += `-${this.settings.DEPLOY_TARGET}`
        distName += '.zip'
        return distName
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

        manifest.homepage_url = this.settings.brands[brandName].vendor.support.website
        manifest.version = PACKAGE.version
        return manifest
    }


    /**
    * Return a browserify function task used for multiple entrypoints.
    * @param {String} entryPoint - A Browserify entrypoint.
    * @param {String} bundleName - Name to identify the bundle with.
    * @param {Function} entries - Optional extra entries.
    * @returns {Promise} - Resolves when finished bundling.
    */
    jsEntry(entryPoint, bundleName, entries = []) {
        const brand = this.settings.brands[this.settings.BRAND_TARGET]
        return new Promise((resolve) => {
            if (!BUNDLERS[bundleName]) {
                BUNDLERS[bundleName] = browserify({
                    basedir: path.join(this.settings.BASE_DIR),
                    cache: {},
                    debug: !this.settings.PRODUCTION,
                    entries: entryPoint,
                    packageCache: {},
                    paths: [
                        path.join(this.settings.ROOT_DIR, '../'),
                    ],
                })
                if (this.settings.LIVERELOAD) BUNDLERS[bundleName].plugin(watchify)
                for (let entry of entries) BUNDLERS[bundleName].add(entry)
            }
            BUNDLERS[bundleName].ignore('buffer')
            BUNDLERS[bundleName].ignore('process')
            BUNDLERS[bundleName].ignore('rc')
            BUNDLERS[bundleName].ignore('module-alias/register')

            // Exclude the webextension polyfill from non-webextension builds.
            if (bundleName === 'webview') {
                BUNDLERS[bundleName].ignore('webextension-polyfill')
            }

            BUNDLERS[bundleName].transform({global: true}, this.browserifyTransform)

            BUNDLERS[bundleName].bundle()
                .on('error', notify.onError('Error: <%= error.message %>'))
                .on('end', () => {resolve()})
                .pipe(source(`${bundleName}.js`))
                .pipe(buffer())
                .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(this._jsEnvify(brand))
                .pipe(ifElse(this.settings.PRODUCTION, () => minifier()))
                .pipe(sourcemaps.write('./'))
                .pipe(size(_extend({title: `${bundleName}.js`}, this.settings.SIZE_OPTIONS)))
                .pipe(gulp.dest(path.join(this.settings.BUILD_DIR, 'js')))
        })
    }


    /**
    * Browserify custom modules from the Vialer config.
    * Source: https://github.com/garage11/garage11/
    * @param {Array} sectionModules - Vialer-js modules to build.
    * @param {String} appSection - The application type; 'bg' or 'fg'.
    * @returns {Promise} - Resolves when all modules are processed.
    */
    jsPlugins(sectionModules, appSection) {
        const brand = this.settings.brands[this.settings.BRAND_TARGET]
        return new Promise((resolve) => {
            let requires = []

            for (const moduleName of Object.keys(sectionModules)) {
                const sectionModule = sectionModules[moduleName]

                // Builtin modules use special markers.
                if (['bg', 'i18n'].includes(appSection)) {
                    if (sectionModule.adapter) {
                        gutil.log(`[${appSection}] adapter plugin ${moduleName} (${sectionModule.adapter})`)
                        requires.push(`${sectionModule.adapter}/src/js/${appSection}`)
                    } else if (sectionModule.providers) {
                        for (const provider of sectionModule.providers) {
                            gutil.log(`[${appSection}] provider plugin ${moduleName} (${provider})`)
                            requires.push(`${provider}/src/js/${appSection}`)
                        }
                    }
                }

                if (sectionModule.addons) {
                    for (const addon of sectionModule.addons[appSection]) {
                        gutil.log(`[${appSection}] addon plugin ${moduleName} (${addon})`)
                        requires.push(`${addon}/src/js/${appSection}`)
                    }
                } else if (sectionModule.name) {
                    gutil.log(`[${appSection}] custom plugin ${moduleName} (${sectionModule.name})`)
                    // A custom module is limited to a bg or fg section.
                    if (sectionModule.parts.includes(appSection)) {
                        requires.push(`${sectionModule.name}/src/js/${appSection}`)
                    }
                }
            }

            const b = browserify({
                basedir: this.settings.BASE_DIR,
                debug: true,
                detectGlobals: false,
                paths: [
                    // Allows Browserify to resolve vialer-js project root require.
                    path.join(this.settings.ROOT_DIR, '../'),
                ],
            })


            for (const _require of requires) b.require(_require)

            b.transform({global: true}, this.browserifyTransform)
            b.bundle()
                .on('error', notify.onError('Error: <%= error.message %>'))
                .on('end', () => {resolve()})
                .pipe(source(`app_${appSection}_plugins.js`))
                .pipe(buffer())
                .pipe(sourcemaps.init({loadMaps: true}))
                .pipe(this._jsEnvify(brand))
                .pipe(ifElse(this.settings.PRODUCTION, () => minifier()))
                .pipe(sourcemaps.write('./'))
                .pipe(size(_extend({title: `app_${appSection}_plugins.js`}, this.settings.SIZE_OPTIONS)))
                .pipe(gulp.dest(path.join(this.settings.BUILD_DIR, 'js')))
        })
    }


    /**
    * Generic SCSS parsing task for one or more entrypoints.
    * @param {String} entryPath - Name of the scss entrypoint.
    * @param {String} sourcemap - Generate sourcemaps.
    * @param {Array} entryExtra - Add extra entrypoints.
    * @returns {Function} - Sass function to use.
    */
    scssEntry(entryPath, sourcemap = false, entryExtra = []) {
        const brandColors = this.formatScssVars(this.settings.brands[this.settings.BRAND_TARGET].colors)
        let includePaths = [
            this.settings.NODE_PATH,
            // Use the root dir here, because we want to expose the
            // vialer-js directory for imports; also for the docs build.
            path.join(this.settings.ROOT_DIR, 'src', 'scss'),
        ]
        const name = path.basename(entryPath, '.scss')

        let sources = [entryPath]
        if (entryExtra.length) {
            sources = sources.concat(entryExtra)
        }

        return gulp.src(sources)
            .pipe(insert.prepend(brandColors))
            .pipe(ifElse(sourcemap, () => sourcemaps.init({loadMaps: true})))
            .pipe(sass({
                includePaths,
                sourceMap: false,
                sourceMapContents: false,
            }))
            .on('error', notify.onError('Error: <%= error.message %>'))
            .pipe(concat(`${name}.css`))
            .pipe(ifElse(this.settings.PRODUCTION, () => cleanCSS({advanced: true, level: 2})))
            .pipe(ifElse(sourcemap, () => sourcemaps.write('./')))
            .pipe(gulp.dest(path.join(this.settings.BUILD_DIR, 'css')))
            .pipe(size(_extend({title: `scss-${name}`}, this.settings.SIZE_OPTIONS)))
            .on('end', () => {
                if (this.settings.LIVERELOAD) livereload.changed(`${name}.css`)
            })
    }


    sentryManager(brandName, buildType) {
        let release
        // A release name is unique to the brand, the build target
        // and the deploy target.
        if (!this.settings.RELEASE) release = `${this.settings.VERSION}-${this.settings.DEPLOY_TARGET}-${brandName}-${buildType}`
        else release = this.settings.RELEASE

        const sentry = this.settings.brands[brandName].telemetry.sentry
        return createReleaseManager({
            apiKey: sentry.apiKey,
            host: sentry.host,
            org: sentry.org,
            project: sentry.project,
            sourceMapBasePath: '~/js/',
            version: release,
        })
    }


    /**
    * Start a development server that serves docs and the build directory.
    * @param {Number} [port] - Port to listen on for the HTTP server.
    * @param {Array} [extraMounts] - Extra mountpoints to add.
    */
    startDevService({extraMounts = [], mode = 'spa', port = 8999} = {}) {
        this.settings.LIVERELOAD = true
        const app = connect()
        livereload.listen({silent: false})

        if (mode === 'spa') {
            app.use(serveStatic(this.settings.BUILD_DIR))
            app.use((req, res, next) => {
                return fs.createReadStream(path.join(this.settings.BUILD_DIR, 'index.html')).pipe(res)
            })

        } else {
            app.use(mount('/', serveIndex(this.settings.BUILD_DIR, {icons: true})))
            app.use(mount('/', serveStatic(this.settings.BUILD_DIR)))
        }


        for (const mountpoint of extraMounts) {
            app.use(mount(mountpoint.mount, serveStatic(mountpoint.dir)))
            gutil.log(`Development service mounted ${mountpoint.dir} on ${mountpoint.mount} (index: ${mountpoint.index ? 'yes' : 'no'})`)
        }
        http.createServer(app).listen(port)
        gutil.log(`Development service listening on http://localhost:${port}`)
    }
}


module.exports = Helpers
