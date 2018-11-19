const {promisify} = require('util')
const http = require('http')
const fs = require('fs')
const path = require('path')

const connect = require('connect')
const del = require('del')
const gulp = require('gulp')
const mkdirp = promisify(require('mkdirp'))
const livereload = require('gulp-livereload')
const logger = require('gulplog')
const mount = require('connect-mount')
const serveStatic = require('serve-static')

const PACKAGE = require('../../package')
const writeFileAsync = promisify(fs.writeFile)

let helpers = {}
let tasks = {}


module.exports = function(settings) {

    helpers.reload = function(filename) {
        return function reloadBrowser(done) {
            livereload.changed(filename)
            done()
        }
    }


    helpers.serveHttp = function({reload = true, mounts = [], port = 8999} = {}) {
        const app = connect()
        app.use(serveStatic(settings.BUILD_DIR))
        app.use((req, res, next) => {
            return fs.createReadStream(path.join(settings.BUILD_DIR, 'index.html')).pipe(res)
        })

        if (reload) {
            livereload.listen({silent: false})
            // Flag that activates browserify's watchify bundle caching.
            settings.LIVERELOAD = true
        }

        for (const mountpoint of mounts) {
            app.use(mount(mountpoint.mount, serveStatic(mountpoint.dir)))
            logger.info(`Mounted ${mountpoint.dir} on ${mountpoint.mount} (index: ${mountpoint.index ? 'yes' : 'no'})`)
        }

        helpers.server = http.createServer(app).listen(port)
        logger.info(`HTTP service listening on http://localhost:${port}`)
    }


    tasks.buildClean = function miscBuildClean(done) {
        del([path.join(settings.BUILD_DIR, '**')], {force: true}).then(() => {
            mkdirp(settings.BUILD_DIR).then(() => {done()})
        })
    }


    /**
    * Read the manifest file base and augment it from
    * the Vialer-js build configuration.
    */
    tasks.manifest = async function miscManifest() {
        const brand = settings.brands[settings.BRAND_TARGET]
        let target = path.join(settings.BUILD_DIR, 'manifest.json')

        let manifest
        // WebExtension manifest.
        if (settings.BUILD_WEBEXTENSION.includes(settings.BUILD_TARGET)) {
            manifest = require(path.join(settings.SRC_DIR, 'manifest-webextension.json'))
            // Distinguish between the test-version and production name.
            manifest.name = brand.name[settings.PUBLISH_CHANNEL]

            if (settings.BUILD_TARGET === 'edge') {
                manifest.background.persistent = true
                manifest.browser_specific_settings = {
                    edge: {
                        browser_action_next_to_addressbar: true,
                    },
                }
            } else if (settings.BUILD_TARGET === 'firefox') {
                manifest.applications = {
                    gecko: {
                        // (!) Deploys to production, alpha or beta environment.
                        id: brand.store.firefox.gecko[`id_${settings.PUBLISH_CHANNEL}`],
                        strict_min_version: brand.store.firefox.gecko.strict_min_version,
                    },
                }
            }

            manifest.browser_action.default_title = manifest.name
            // Make sure this permission is not pushed multiple times to the same manifest.
            if (!manifest.permissions.includes(brand.permissions)) {
                manifest.permissions.push(brand.permissions)
            }

            manifest.homepage_url = brand.vendor.support.website
            manifest.version = PACKAGE.version


        } else if (settings.BUILD_TARGET === 'pwa') {
            manifest = require(path.join(settings.SRC_DIR, 'manifest-pwa.json'))
        }


        await mkdirp(settings.BUILD_DIR)
        await writeFileAsync(target, JSON.stringify(manifest, null, 4))
    }


    /**
     * Watches files and execute tasks on changes.
     * Modules starting with `vjs-*` are watched when
     * they are on the same directory level as vialer-js.
     * This is due to a Chokidar issue that prevents
     * watching symlinked directories.
     */
    tasks.watch = function miscWatch() {
        const assets = require('./assets')(settings)
        const code = require('./code')(settings)
        const misc = require('./misc')(settings)
        const styles = require('./styles')(settings)
        const test = require('./test')(settings)

        helpers.serveHttp()

        if (settings.BUILD_TARGET === 'node') {
            // Node development doesn't have transpilation.
            // No other watchers are needed.
            gulp.watch([
                path.join(settings.SRC_DIR, 'js', '**', '*.js'),
            ], gulp.series(test.tasks.unit))
            return
        }

        if (settings.BUILD_TARGET === 'electron') {
            gulp.watch([
                path.join(settings.SRC_DIR, 'js', 'main.js'),
            ], gulp.series(code.tasks.electron))
        } else if (settings.BUILD_WEBEXTENSION.includes(settings.BUILD_TARGET)) {
            gulp.watch([
                path.join(settings.SRC_DIR, 'manifest.json'),
            ], gulp.series(misc.tasks.manifest, helpers.reload('app_fg.js')))
        }

        if (settings.BUILD_TARGET === 'pwa') {
            gulp.watch([
                path.join(settings.SRC_DIR, 'js', 'sw.js'),
            ], gulp.series(code.tasks.serviceWorker))
        }


        gulp.watch([
            path.join(settings.SRC_DIR, 'js', 'i18n', '*.js'),
            path.join(settings.ROOT_DIR, '../', 'vjs-*', 'src', 'js', 'i18n', '*.js'),
        ], gulp.series(code.tasks.appI18n, helpers.reload('app_i18n.js')))


        gulp.watch([
            path.join(settings.SRC_DIR, 'index.html'),
        ], gulp.series(assets.tasks.html, helpers.reload('app_fg.js')))


        gulp.watch([
            path.join(settings.SRC_DIR, 'js', 'bg', '**', '*.js'),
            path.join(settings.SRC_DIR, 'js', 'lib', '**', '*.js'),
        ], gulp.series(code.tasks.appBg, helpers.reload('app_bg.js')))


        gulp.watch([
            path.join(settings.SRC_DIR, 'components', '**', '*.js'),
            path.join(settings.SRC_DIR, 'js', 'lib', '**', '*.js'),
            path.join(settings.SRC_DIR, 'js', 'fg', '**', '*.js'),
        ], gulp.series(code.tasks.appFg, helpers.reload('app_fg.js')))

        gulp.watch([
            path.join(settings.ROOT_DIR, '../', 'vjs-*', 'src', '**', '*.js'),
        ], gulp.series(
            gulp.parallel(code.tasks.appI18n, code.tasks.appBg, code.tasks.appFg),
            code.tasks.plugins,
            helpers.reload('app_fg_plugins.js'),
        ))

        if (settings.BUILD_WEBEXTENSION.includes(settings.BUILD_TARGET)) {
            gulp.watch([
                path.join(settings.SRC_DIR, 'js', 'observer', '**', '*.js'),
                path.join(settings.SRC_DIR, 'js', 'lib', '**', '*.js'),
            ], gulp.series(code.tasks.appObserver, helpers.reload('app_observer.js')))
        }

        gulp.watch([
            path.join(settings.SRC_DIR, 'js', 'bg', 'vendor.js'),
        ], gulp.series(code.tasks.vendorBg, helpers.reload('vendor_bg.js')))


        gulp.watch([
            path.join(settings.SRC_DIR, 'js', 'fg', 'vendor.js'),
        ], gulp.series(code.tasks.vendorFg, helpers.reload('vendor_fg.js')))


        gulp.watch([
            path.join(settings.SRC_DIR, 'scss', '**', '*.scss'),
            path.join(settings.SRC_DIR, 'components', '**', '*.scss'),
            path.join(settings.ROOT_DIR, '../', 'vjs-*', 'src', 'components', '**', '*.scss'),
            `!${path.join(settings.SRC_DIR, 'scss', 'vialer-js', 'observer.scss')}`,
            `!${path.join(settings.SRC_DIR, 'scss', 'vialer-js', 'vendor.scss')}`,
        ], {followSymlinks: true}, gulp.series(styles.tasks.app, helpers.reload('app.css')))


        gulp.watch([
            path.join(settings.SRC_DIR, 'scss', 'vialer-js', 'observer.scss'),
        ], gulp.series(styles.tasks.observer, helpers.reload('observer.css')))


        gulp.watch([
            path.join(settings.SRC_DIR, 'scss', 'vialer-js', 'vendor.scss'),
        ], gulp.series(styles.tasks.vendor, helpers.reload('vendor.css')))


        gulp.watch([
            path.join(settings.SRC_DIR, 'components', '**', '*.vue'),
            path.join(settings.ROOT_DIR, '../', 'vjs-*', 'src', 'components', '**', '*.vue'),
        ], gulp.series(assets.tasks.templates, helpers.reload('templates.js')))


        gulp.watch([
            path.join(settings.BASE_DIR, 'test', 'bg', '**', '*.js'),
        ], gulp.series(test.tasks.unit))
    }

    return {helpers, tasks}
}
