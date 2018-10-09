/**
* The Gulp buildsystem takes care of executing all tasks like bundling
* JavaScript, automated deployment to stores, transpiling SCSS, minifying,
* concatting, copying assets, etc...
*/
const {_extend, promisify} = require('util')
const archiver = require('archiver')
const fs = require('fs')
const path = require('path')

const addsrc = require('gulp-add-src')
const argv = require('yargs').argv
const childExec = require('child_process').exec
const colorize = require('tap-colorize')

const del = require('del')
const flatten = require('gulp-flatten')
const gulp = require('gulp-help')(require('gulp'), {
    hideDepsMessage: true,
    hideEmpty: true,
})
const gutil = require('gulp-util')
const Helpers = require('./tools/helpers')
const livereload = require('gulp-livereload')
const ifElse = require('gulp-if-else')
const imagemin = require('gulp-imagemin')
const mkdirp = promisify(require('mkdirp'))
const runSequence = require('run-sequence')
const size = require('gulp-size')
const svgo = require('gulp-svgo')
const tape = require('gulp-tape')
const template = require('gulp-template')
const test = require('tape')
const eslint = require('gulp-eslint')
const guppy = require('git-guppy')(gulp)
const filter = require('gulp-filter')


const writeFileAsync = promisify(fs.writeFile)

// The main settings object containing info from .vialer-jsrc and build flags.
let settings = require('./tools/settings')(__dirname)
let WATCH_TASK = ''

// Initialize the helpers, which make this file less dense.
const helpers = new Helpers(settings)
const WATCHTEST = argv.verify ? true : false


gulp.task('assets', 'Copy <brand> assets to <target>.', () => {
    const robotoPath = path.join(settings.NODE_PATH, 'roboto-fontface', 'fonts', 'roboto')
    return gulp.src(path.join(robotoPath, '{Roboto-Light.woff2,Roboto-Regular.woff2,Roboto-Medium.woff2}'))
        .pipe(flatten({newPath: './fonts'}))
        .pipe(addsrc(`./src/brand/${settings.BRAND_TARGET}/img/{*.icns,*.png,*.jpg,*.gif}`, {base: `./src/brand/${settings.BRAND_TARGET}/`}))
        .pipe(addsrc(`./src/brand/${settings.BRAND_TARGET}/ringtones/*`, {base: `./src/brand/${settings.BRAND_TARGET}/`}))
        .pipe(ifElse(settings.PRODUCTION, imagemin))
        .pipe(ifElse(settings.BUILD_TARGET === 'electron', () => addsrc('./package.json')))
        .pipe(addsrc('./LICENSE'))
        .pipe(addsrc('./README.md'))
        .pipe(addsrc('./src/_locales/**', {base: './src/'}))
        .pipe(gulp.dest(path.join(settings.BUILD_DIR)))
        .pipe(size(_extend({title: 'assets'}, settings.SIZE_OPTIONS)))
        .pipe(ifElse(settings.LIVERELOAD, livereload))
})


gulp.task('build', 'Generate a <brand> build for <target>.', (done) => {
    // Refresh the brand content with each build.
    gutil.log(`Building with target "${settings.BUILD_TARGET}"`)
    if (settings.BUILD_TARGET === 'docs') {
        runSequence(['docs'], done)
        return
    }
    let mainTasks = [
        'assets', 'templates', 'html', 'scss', 'scss-vendor',
        'js-vendor-bg', 'js-vendor-fg', 'js-app-plugins',
    ]

    if (settings.BUILD_TARGET === 'electron') {
        runSequence(mainTasks.concat(['js-electron']), () => {done()})
    } else if (settings.BUILD_TARGET === 'webview') {
        runSequence(mainTasks, () => {done()})
    } else if (['chrome', 'firefox'].includes(settings.BUILD_TARGET)) {
        runSequence(mainTasks.concat(['js-app-observer', 'manifest']), () => {done()})
    }
})


gulp.task('build-clean', 'Remove the <brand> build of <target>.', (done) => {
    del([path.join(settings.BUILD_DIR, '**')], {force: true}).then(() => {
        mkdirp(settings.BUILD_DIR).then(() => {done()})
    })
})


gulp.task('build-dist', 'Generate an optimized build and pack it for distribution.', ['build'], (done) => {
    const buildDir = path.join(__dirname, 'build', settings.BRAND_TARGET, settings.BUILD_TARGET)
    const distDir = path.join(__dirname, 'dist', settings.BRAND_TARGET)
    mkdirp(distDir).then(() => {
        let distName = helpers.distributionName(settings.BRAND_TARGET)
        // Not using Gulp's Vinyl-based zip, because of a symlink issue that
        // prevents the MacOS build to be zipped properly.
        // See https://github.com/gulpjs/gulp/issues/1427 for more info.
        const output = fs.createWriteStream(path.join(distDir, distName))
        const archive = archiver('zip', {zlib: {level: 6}})

        output.on('close', function() {
            gutil.log(archive.pointer() + ' total bytes archived')
            done()
        })

        archive.pipe(output)

        if (['chrome', 'firefox'].includes(settings.BUILD_TARGET)) {
            // The `vendor-fg.js` output will be missing without
            // setting a timeout here.
            setTimeout(() => {
                archive.directory(buildDir, false)
                archive.finalize()
            }, 500)
        } else if (settings.BUILD_TARGET === 'electron') {
            const iconParam = `--icon=${buildDir}/img/electron-icon.png`
            let buildParams = `--arch=${settings.BUILD_ARCH} --asar --overwrite --platform=${settings.BUILD_PLATFORM} --prune=true`
            // This is broken when used in combination with Wine due to rcedit.
            // See: https://github.com/electron-userland/electron-packager/issues/769
            if (settings.BUILD_PLATFORM !== 'win32') buildParams += iconParam
            const distBuildName = `${settings.BRAND_TARGET}-${settings.BUILD_PLATFORM}-${settings.BUILD_ARCH}`
            const execCommand = `./node_modules/electron-packager/cli.js ${buildDir} ${settings.BRAND_TARGET} ${buildParams} --out=${distDir}`
            childExec(execCommand, undefined, (err, stdout, stderr) => {
                if (stderr) gutil.log(stderr)
                if (stdout) gutil.log(stdout)
                setTimeout(() => {
                    archive.directory(path.join(distDir, distBuildName), distBuildName)
                    archive.finalize()
                }, 500)
            })
        }
    })
})


gulp.task('build-run', 'Generate an unoptimized build and run it in the target environment.', (done) => {
    let command = `gulp build --target ${settings.BUILD_TARGET} --brand ${settings.BRAND_TARGET}`
    const buildDir = `./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}`
    if (settings.BUILD_TARGET === 'chrome') command = `${command};chromium --user-data-dir=/tmp/vialer-js --load-extension=${buildDir} --no-first-run`
    else if (settings.BUILD_TARGET === 'firefox') command = `${command};web-ext run --no-reload --source-dir ${buildDir}`
    else if (settings.BUILD_TARGET === 'electron') {
        const electronPath = './node_modules/electron/dist/electron'
        command = `${command};${electronPath} --js-flags='--harmony-async-await' ${buildDir}/main.js`
    } else if (settings.BUILD_TARGET === 'webview') {
        helpers.startDevService()
        const urlTarget = `http://localhost:8999/${settings.BRAND_TARGET}/webview/index.html`
        command = `${command};chromium --disable-web-security --new-window ${urlTarget}`
    }
    childExec(command, undefined, (err, stdout, stderr) => {
        if (err) gutil.log(err)
    })
})


gulp.task('deploy', 'Deploy <brand> to the <target> store.', (done) => {
    helpers.deploy(settings.BRAND_TARGET, settings.BUILD_TARGET, helpers.distributionName(settings.BRAND_TARGET))
        .then(() => {
            // Write release and source artifacts to sentry for more
            // precise stacktraces in Sentry.
            runSequence('sentry-release-publish', done)
        })
})


/**
* The index.html file is shared with the electron build target.
* Appropriate scripts are inserted based on the build target.
*/
gulp.task('html', 'Generate HTML index file.', () => {
    return gulp.src(path.join('src', 'index.html'))
        .pipe(template({settings}))
        .pipe(flatten())
        .pipe(gulp.dest(settings.BUILD_DIR))
        .pipe(ifElse(settings.LIVERELOAD, livereload))
})


gulp.task('__tmp-icons', '', (done) => {
    return gulp.src('./src/svg/*.svg', {base: 'src'})
        .pipe(addsrc(`./src/brand/${settings.BRAND_TARGET}/svg/*.svg`, {base: `./src/brand/${settings.BRAND_TARGET}/`}))
        .pipe(svgo())
        .pipe(size(_extend({title: 'icons'}, settings.SIZE_OPTIONS)))
        .pipe(gulp.dest(path.join(settings.TEMP_DIR, settings.BRAND_TARGET)))
})


/**
* Process all SVG icons with Vue-svgicon, which converts them to Vue components.
* The icons JavaScript is added to `js-vendor-fg`.
*/
gulp.task('icons', 'Generate Vue icon components from SVG.', ['__tmp-icons'], (done) => {
    // Use relative paths or vsvg will choke.
    let srcDir = path.join('build', '__tmp', settings.BRAND_TARGET, 'svg')
    const srcBuildDir = path.join('src', 'brand', settings.BRAND_TARGET, 'icons')
    let execCommand = `node_modules/vue-svgicon/dist/lib/index.js -s ${srcDir} -t ${srcBuildDir}`
    childExec(execCommand, undefined, (_err, stdout, stderr) => {
        if (stderr) gutil.log(stderr)
        if (stdout) gutil.log(stdout)
        done()
    })
})


gulp.task('js-electron', 'Generate Electron application JavaScript.', (done) => {
    if (settings.BUILD_TARGET !== 'electron') {
        gutil.log(`Electron task doesn\'t make sense for build target ${settings.BUILD_TARGET}`)
        return
    }
    runSequence(['js-vendor-bg', 'js-vendor-fg', 'js-app-bg', 'js-app-fg'], () => {
        // Vendor-specific info for Electron's main.js file.
        fs.createReadStream('./src/js/main.js').pipe(
            fs.createWriteStream(`./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}/main.js`)
        )

        const electronBrandSettings = settings.brands[settings.BRAND_TARGET].vendor
        const settingsFile = `./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}/settings.json`
        writeFileAsync(settingsFile, JSON.stringify(electronBrandSettings)).then(() => {done()})
    })
})


gulp.task('js-vendor-bg', 'Generate vendor JavaScript for the background app section.', [], (done) => {
    helpers.jsEntry('./src/js/bg/vendor.js', 'vendor_bg', []).then(() => {done()})
})


gulp.task('js-vendor-fg', 'Generate vendor JavaScript for the foreground app section.', ['icons'], (done) => {
    helpers.jsEntry('./src/js/fg/vendor.js', 'vendor_fg',
        [`./src/brand/${settings.BRAND_TARGET}/icons/index.js`])
        .then(() => {
            done()
        })
})


gulp.task('js-app-bg', 'Generate background app section JavaScript.', (done) => {
    helpers.jsEntry('./src/js/bg/index.js', 'app_bg', []).then(() => {
        if (WATCH_TASK === 'js-app-bg' && settings.LIVERELOAD) livereload.changed('app_bg.js')
        if (WATCHTEST) runSequence(['test-unit'], done)
        else done()
    })
})


gulp.task('js-app-fg', 'Generate foreground app section JavaScript.', (done) => {
    helpers.jsEntry('./src/js/fg/index.js', 'app_fg', []).then(() => {
        if (WATCH_TASK === 'js-app-fg' && settings.LIVERELOAD) livereload.changed('app_fg.js')
        if (WATCHTEST) runSequence(['test-unit'], done)
        else done()
    })
})


gulp.task('js-app-i18n', 'Generate i18n translations.', (done) => {
    const builtin = settings.brands[settings.BRAND_TARGET].plugins.builtin
    const custom = settings.brands[settings.BRAND_TARGET].plugins.custom
    Promise.all([
        helpers.jsPlugins(Object.assign(builtin, custom), 'i18n'),
        helpers.jsEntry('./src/js/i18n/index.js', 'app_i18n', []),
    ]).then(() => {
        if (WATCH_TASK === 'js-app-i18n' && settings.LIVERELOAD) livereload.changed('app_i18n.js')
        done()
    })
})


gulp.task('js-app-plugins', 'Generate app sections plugin JavaScript.', ['js-app-i18n', 'js-app-bg', 'js-app-fg'], (done) => {
    const builtin = settings.brands[settings.BRAND_TARGET].plugins.builtin
    const custom = settings.brands[settings.BRAND_TARGET].plugins.custom

    Promise.all([
        helpers.jsPlugins(Object.assign(builtin, custom), 'bg'),
        helpers.jsPlugins(Object.assign(builtin, custom), 'fg'),
    ]).then(() => {
        if (WATCH_TASK === 'js-app-plugins' && settings.LIVERELOAD) livereload.changed('app_plugins_bg.js')
        done()
    })
})


gulp.task('js-app-observer', 'Generate tab app section Javascript.', (done) => {
    helpers.jsEntry('./src/js/observer/index.js', 'app_observer', []).then(() => {
        if (WATCHTEST) runSequence(['test-unit'], done)
        else done()
    })
})


gulp.task('manifest', 'Generate a browser-specific manifest file.', (done) => {
    let manifest = helpers.getManifest(settings.BRAND_TARGET, settings.BUILD_TARGET)
    const manifestTarget = path.join(settings.BUILD_DIR, 'manifest.json')
    mkdirp(settings.BUILD_DIR).then(() => {
        writeFileAsync(manifestTarget, JSON.stringify(manifest, null, 4)).then(() => {
            done()
        })
    })
})


gulp.task('scss', 'Generate all CSS files.', [], (done) => {
    runSequence(['scss-app', 'scss-observer'], () => {
        if (settings.LIVERELOAD) livereload.changed('app.css')
        done()
    })
})


gulp.task('scss-app', 'Generate application CSS.', () => {
    let sources = [path.join(settings.SRC_DIR, 'components', '**', '*.scss')]
    const builtin = settings.brands[settings.BRAND_TARGET].plugins.builtin
    const custom = settings.brands[settings.BRAND_TARGET].plugins.custom

    const sectionModules = Object.assign(builtin, custom)
    for (const moduleName of Object.keys(sectionModules)) {
        const sectionModule = sectionModules[moduleName]
        if (sectionModule.addons && sectionModule.addons.fg.length) {
            for (const addon of sectionModule.addons.fg) {
                const dirName = addon.split('/')[0]
                gutil.log(`[fg] addon styles for ${moduleName} (${addon})`)
                sources.push(path.join(settings.NODE_PATH, dirName, 'src', 'components', '**', '*.scss'))
            }
        } else if (sectionModule.parts && sectionModule.parts.includes('fg')) {
            gutil.log(`[fg] addon styles for ${moduleName} (${sectionModule.name})`)
            // The module may include a path to the source file.
            sources.push(path.join(settings.NODE_PATH, sectionModule.name, 'src', 'components', '**', '*.scss'))
        }
    }
    return helpers.scssEntry('./src/scss/vialer-js/app.scss', !settings.PRODUCTION, sources)
})


gulp.task('scss-observer', 'Generate observer CSS.', () => {
    return helpers.scssEntry('./src/scss/vialer-js/observer.scss', !settings.PRODUCTION)
})


gulp.task('scss-vendor', 'Generate vendor CSS.', () => {
    return helpers.scssEntry('./src/scss/vialer-js/vendor.scss', false)
})


/**
* This requires at least Sentry 8.17.0.
* See https://github.com/getsentry/sentry/issues/5459 for more details.
*/
gulp.task('sentry-release-publish', 'Publish release sourcemap artifacts to Sentry for better stacktraces.', () => {
    const sentryManager = helpers.sentryManager(settings.BRAND_TARGET, settings.BUILD_TARGET)
    sentryManager.create(() => {
        const base = path.join(settings.BUILD_DIR, 'js')
        gulp.src(path.join(base, '{*.js,*.map}'), {base})
            .pipe(addsrc(path.join(settings.SRC_DIR, 'js', '**', '*.js'), {base: path.join('./')}))
            .pipe(sentryManager.upload())
    })
})


gulp.task('sentry-release-remove', 'Remove release and its artifacts from Sentry.', (done) => {
    const sentryManager = helpers.sentryManager(settings.BRAND_TARGET, settings.BUILD_TARGET)
    sentryManager.remove(() => done)
})


gulp.task('templates', 'Generate builtin and plugin Vue component templates.', () => {
    let sources = ['./src/components/**/*.vue']
    const builtin = settings.brands[settings.BRAND_TARGET].plugins.builtin
    const custom = settings.brands[settings.BRAND_TARGET].plugins.custom

    const sectionPlugins = Object.assign(builtin, custom)
    for (const moduleName of Object.keys(sectionPlugins)) {
        const sectionPlugin = sectionPlugins[moduleName]

        if (sectionPlugin.addons && sectionPlugin.addons.fg.length) {
            for (const addon of sectionPlugin.addons.fg) {
                const dirName = addon.split('/')[0]
                gutil.log(`[fg] addon templates for ${moduleName} (${addon})`)
                sources.push(path.join(settings.NODE_PATH, dirName, 'src', 'components', '**', '*.vue'))
            }
        } else if (sectionPlugin.parts && sectionPlugin.parts.includes('fg')) {
            gutil.log(`[fg] custom templates for ${moduleName} (${sectionPlugin.name})`)
            // The module may include a path to the source file.
            sources.push(path.join(settings.NODE_PATH, sectionPlugin.name, 'src', 'components', '**', '*.vue'))
        }
    }

    helpers.compileTemplates(sources)
})


gulp.task('test-unit', 'Run unit and integation tests.', () => {
    return gulp.src('test/bg/**/*.js')
        .pipe(tape({
            bail: true,
            outputStream: test.createStream().pipe(colorize()).pipe(process.stdout),
        }))
})


gulp.task('lint', () => {
    return gulp.src(['src/**/*.js', 'test/**/*.js', 'gulpfile.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
})


gulp.task('pre-commit-lint', () => {
    return guppy.stream('pre-commit')
        .pipe(filter(['*.js']))
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
})


gulp.task('protect-secrets', () => {
    return gulp.src(['.vialer-jsrc', '.vialer-jsrc.example'])
        .pipe(helpers.protectSecrets())
})


gulp.task('pre-commit-protect-secrets', () => {
    return guppy.stream('pre-commit')
        .pipe(filter(['.vialer-jsrc', '.vialer-jsrc.example']))
        .pipe(helpers.protectSecrets())
})


gulp.task('pre-commit', [
    'pre-commit-lint',
    'pre-commit-protect-secrets',
    'test-unit',
])


/**
* Defined as extra task which makes it easier to respond
* when the tests are finished, due to gulp-task not being
* able to deal with `end` events.
*/
gulp.task('__test-browser', '', function() {
    return gulp.src('test/browser/**/index.js').pipe(tape({bail: true}))
})

gulp.task('test-browser', 'Run browser tests on a served webview.', function(done) {
    // Force the build target.
    helpers.startDevService()
    settings.BUILD_TARGET = 'webview'
    runSequence(['build'], ['__test-browser'], () => {
        process.exit(0)
        done()
    })
})


gulp.task('watch', 'Run developer watch modus.', () => {
    helpers.startDevService()

    if (settings.BUILD_TARGET === 'electron') {
        gulp.watch([path.join(settings.SRC_DIR, 'js', 'main.js')], ['js-electron'])
    } else if (settings.BUILD_TARGET === 'node') {
        gulp.watch([path.join(settings.SRC_DIR, 'js', '**', '*.js')], ['test-unit'])
        // Node development doesn't require transpilation.
        // No other watchers are required at this moment.
        return
    } else if (!['electron', 'webview'].includes(settings.BUILD_TARGET)) {
        gulp.watch(path.join(settings.SRC_DIR, 'manifest.json'), ['manifest'])
        gulp.watch(path.join(settings.SRC_DIR, 'brand.json'), ['build'])
    }

    gulp.watch([
        path.join(settings.SRC_DIR, '_locales', '**', '*.json'),
        path.join(settings.SRC_DIR, 'js', 'lib', 'thirdparty', '**', '*.js'),
    ], ['assets'])


    gulp.watch([
        path.join(settings.SRC_DIR, 'js', 'i18n', '*.js'),
        path.join(settings.NODE_PATH, 'vjs-adapter-*', 'src', 'js', 'i18n', '*.js'),
        path.join(settings.NODE_PATH, 'vjs-addon-*', 'src', 'js', 'i18n', '*.js'),
        path.join(settings.NODE_PATH, 'vjs-mod-*', 'src', 'js', 'i18n', '*.js'),
        path.join(settings.NODE_PATH, 'vjs-provider-*', 'src', 'js', 'i18n', '*.js'),
    ], function() {
        WATCH_TASK = 'js-app-i18n'
        runSequence('js-app-i18n')
    })

    gulp.watch(path.join(settings.SRC_DIR, 'index.html'), ['html'])

    gulp.watch([
        path.join(settings.SRC_DIR, 'js', 'bg', '**', '*.js'),
        path.join(settings.SRC_DIR, 'js', 'lib', '**', '*.js'),
    ], function() {
        WATCH_TASK = 'js-app-bg'
        runSequence('js-app-bg')
    })

    gulp.watch([
        path.join(settings.SRC_DIR, 'components', '**', '*.js'),
        path.join(settings.SRC_DIR, 'js', 'lib', '**', '*.js'),
        path.join(settings.SRC_DIR, 'js', 'fg', '**', '*.js'),
    ], function() {
        WATCH_TASK = 'js-app-fg'
        runSequence('js-app-fg')
    })

    gulp.watch([
        // Glob for addons and custom modules includes both component and module js.
        path.join(settings.NODE_PATH, 'vjs-adapter-*', 'src', '**', '*.js'),
        path.join(settings.NODE_PATH, 'vjs-addon-*', 'src', '**', '*.js'),
        path.join(settings.NODE_PATH, 'vjs-mod-*', 'src', '**', '*.js'),
        path.join(settings.NODE_PATH, 'vjs-provider-*', 'src', '**', '*.js'),
    ], function() {
        WATCH_TASK = 'js-app-plugins'
        runSequence('js-app-plugins')
    })

    gulp.watch([
        path.join(settings.SRC_DIR, 'js', 'observer', '**', '*.js'),
        path.join(settings.SRC_DIR, 'js', 'lib', '**', '*.js'),
    ], ['js-app-observer'])

    gulp.watch(path.join(settings.SRC_DIR, 'js', 'bg', 'vendor.js'), ['js-vendor-bg'])
    gulp.watch(path.join(settings.SRC_DIR, 'js', 'fg', 'vendor.js'), ['js-vendor-fg'])

    gulp.watch([
        path.join(settings.SRC_DIR, 'scss', '**', '*.scss'),
        path.join(settings.SRC_DIR, 'components', '**', '*.scss'),
        path.join(settings.NODE_PATH, 'vjs-addon-*', 'src', 'components', '**', '*.scss'),
        path.join(settings.NODE_PATH, 'vjs-mod-*', 'src', 'components', '**', '*.scss'),
        `!${path.join(settings.SRC_DIR, 'scss', 'vialer-js', 'observer.scss')}`,
    ], ['scss-app'])

    gulp.watch(path.join(settings.SRC_DIR, 'scss', 'vialer-js', 'observer.scss'), ['scss-observer'])
    gulp.watch(path.join(settings.SRC_DIR, 'scss', 'vialer-js', 'vendor.scss'), ['scss-vendor'])

    gulp.watch([
        path.join(settings.SRC_DIR, 'components', '**', '*.vue'),
        path.join(settings.NODE_PATH, 'vjs-addon-*', 'src', 'components', '**', '*.vue'),
        path.join(settings.NODE_PATH, 'vjs-mod-*', 'src', 'components', '**', '*.vue'),
    ], ['templates'])

    gulp.watch([path.join(settings.ROOT_DIR, 'test', 'bg', '**', '*.js')], ['test-unit'])
})
