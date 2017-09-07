const {_extend, promisify} = require('util')
const fs = require('fs')
const path = require('path')

const addsrc = require('gulp-add-src')
const argv = require('yargs').argv
const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const childExec = require('child_process').exec
const cleanCSS = require('gulp-clean-css')
const composer = require('gulp-uglify/composer')
const concat = require('gulp-concat')
const connect = require('connect')
const del = require('del')

const envify = require('gulp-envify')
const flatten = require('gulp-flatten')
const ghPages = require('gulp-gh-pages')
const gulp = require('gulp-help')(require('gulp'), {})
const gutil = require('gulp-util')
const http = require('http')
const livereload = require('gulp-livereload')
const ifElse = require('gulp-if-else')
const imagemin = require('gulp-imagemin')
const mkdirp = require('mkdirp')
const minifier = composer(require('uglify-es'), console)
const mount = require('connect-mount')

const notify = require('gulp-notify')
const rename = require('gulp-rename')
const replace = require('gulp-replace')
const rc = require('rc')
const runSequence = require('run-sequence')
const sass = require('gulp-sass')
const serveIndex = require('serve-index')
const serveStatic = require('serve-static')
const size = require('gulp-size')
const source = require('vinyl-source-stream')
const sourcemaps = require('gulp-sourcemaps')
const watchify = require('watchify')
const zip = require('gulp-zip')

const PACKAGE = require('./package')
const writeFileAsync = promisify(fs.writeFile)

const BUILD_DIR = process.env.BUILD_DIR || path.join(__dirname, 'build')
const BUILD_TARGET = argv.target ? argv.target : 'chrome'
const BUILD_TARGETS = ['chrome', 'firefox', 'electron']
const DISTRIBUTION_NAME = `${PACKAGE.name.toLowerCase()}-${PACKAGE.version}.zip`
const GULPACTION = argv._[0]
const NODE_ENV = process.env.NODE_ENV || 'development'
const NODE_PATH = path.join(__dirname, 'node_modules') || process.env.NODE_PATH
const WATCHLINKED = argv.linked ? argv.linked : false
const WITHDOCS = argv.docs ? argv.docs : false

// Loads the json API settings from ~/.click-to-dialrc.
let DEPLOY_SETTINGS = {}
rc('click-to-dial', DEPLOY_SETTINGS)
DEPLOY_SETTINGS.audience = argv.audience ? argv.audience : 'trustedTesters'
// Some additional variable processing.
// Verify that the build target is valid.
if (!BUILD_TARGETS.includes(BUILD_TARGET)) {
    gutil.log(`Invalid build target: ${BUILD_TARGET}`)
    // eslint-disable-next-line no-process-exit
    process.exit()
}
gutil.log(`Build target: ${BUILD_TARGET}`)

let PRODUCTION
// Possibility to force the production flag when running certain tasks from
// the commandline. Use this with care.
if (['deploy'].includes(GULPACTION)) PRODUCTION = true
else PRODUCTION = argv.production ? argv.production : (process.env.NODE_ENV === 'production')

// Notify developer about some essential build presets.
if (PRODUCTION) gutil.log('(!) Gulp optimized for production')

let bundlers = {
    bg: null,
    callstatus: null,
    popup: null,
    tab: null,
}
let isWatching
let sizeOptions = {
    showFiles: true,
    showTotal: true,
}


/**
* Generic browserify task used for multiple entrypoints.
* @param {String} name - Name of the javascript entrypoint.
* @returns {Function} - Browerserify bundle function to use.
*/
const jsEntry = (name) => {
    return (done) => {
        if (!bundlers[name]) {
            bundlers[name] = browserify({
                cache: {},
                debug: !PRODUCTION,
                entries: path.join(__dirname, 'src', 'js', `${name}.js`),
                packageCache: {},
            })
            if (isWatching) bundlers[name].plugin(watchify)
        }
        bundlers[name].bundle()
            .on('error', notify.onError('Error: <%= error.message %>'))
            .on('end', () => {
                done()
            })
            .pipe(source(`${name}.js`))
            .pipe(buffer())
            .pipe(ifElse(!PRODUCTION, () => sourcemaps.init({loadMaps: true})))
            .pipe(envify({NODE_ENV: NODE_ENV}))
            .pipe(ifElse(PRODUCTION, () => minifier()))

            .pipe(ifElse(!PRODUCTION, () => sourcemaps.write('./')))
            .pipe(gulp.dest(`./build/${BUILD_TARGET}/js`))
            .pipe(size(_extend({title: `${name}.js`}, sizeOptions)))
    }
}


/**
* Generic scss task used for multiple entrypoints.
* @param {String} name - Name of the scss entrypoint.
* @returns {Function} - Sass function to use.
*/
const scssEntry = (name) => {
    return () => {
        return gulp.src(`./src/scss/${name}.scss`)
            .pipe(sass({
                includePaths: NODE_PATH,
                sourceMap: !PRODUCTION,
                sourceMapContents: !PRODUCTION,
                sourceMapEmbed: !PRODUCTION,
            }))
            .on('error', notify.onError('Error: <%= error.message %>'))
            .pipe(concat(`${name}.css`))
            .pipe(ifElse(PRODUCTION, () => cleanCSS({advanced: true, level: 2})))
            .pipe(gulp.dest(`./build/${BUILD_TARGET}/css`))
            .pipe(size(_extend({title: `scss-${name}`}, sizeOptions)))
            .pipe(ifElse(isWatching, livereload))
    }
}


gulp.task('assets', 'Copy click-to-dial assets to the build directory.', ['fonts'], () => {
    return gulp.src('./src/img/{*.png,*.jpg}', {base: './src'})
        .pipe(ifElse(PRODUCTION, imagemin))
        .pipe(addsrc('./LICENSE'))
        .pipe(addsrc('./README.md'))
        .pipe(addsrc('./src/_locales/**', {base: './src/'}))
        .pipe(addsrc('./src/js/lib/thirdparty/**/*.js', {base: './src/'}))
        .pipe(gulp.dest(`./build/${BUILD_TARGET}`))
        .pipe(size(_extend({title: 'assets'}, sizeOptions)))
        .pipe(ifElse(isWatching, livereload))
})


gulp.task('build', 'Clean existing build and regenerate a new one.', (done) => {
    if (BUILD_TARGET !== 'electron') {
        runSequence('build-clean', [
            'assets',
            'html',
            'js-vendor',
            'js-webext',
            'scss',
        ], done)
    } else {
        runSequence('build-clean', [
            'assets',
            'html',
            'js-electron-main',
            'js-electron-webview',
            'js-vendor',
            'scss'], done)
    }
})


gulp.task('build-dist', 'Make a build and generate a web-extension zip file.', ['build'], (done) => {
    // Use the web-ext build method here, so the result will match
    // the deployable version as closely as possible.
    if (BUILD_TARGET === 'firefox') {
        // eslint-disable-next-line max-len
        let execCommand = `web-ext build --overwrite-dest --source-dir ./build/${BUILD_TARGET} --artifacts-dir ./dist/${BUILD_TARGET}/`
        let child = childExec(execCommand, undefined, (err, stdout, stderr) => {
            if (stderr) gutil.log(stderr)
            if (stdout) gutil.log(stdout)
            done()
        })

        child.stdout.on('data', (data) => {
            process.stdout.write(`${data.toString()}\r`)
        })
    } else {
        gulp.src([
            `./build/${BUILD_TARGET}/**`,
        ], {base: `./build/${BUILD_TARGET}`})
            .pipe(zip(DISTRIBUTION_NAME))
            .pipe(gulp.dest(`./dist/${BUILD_TARGET}/`))
            .on('end', done)
    }
})


gulp.task('build-clean', `Clean build directory ${path.join(BUILD_DIR, BUILD_TARGET)}`, (done) => {
    del([path.join(BUILD_DIR, BUILD_TARGET, '**')], {force: true}).then(() => {
        mkdirp(path.join(BUILD_DIR, BUILD_TARGET), done)
    })
})


gulp.task('deploy', (done) => {
    if (BUILD_TARGET === 'chrome') {
        runSequence('build-dist', async function() {
            const api = DEPLOY_SETTINGS.chrome
            const zipFile = fs.createReadStream(`./dist/${BUILD_TARGET}/${DISTRIBUTION_NAME}`)
            const webStore = require('chrome-webstore-upload')({
                clientId: api.clientId,
                clientSecret: api.clientSecret,
                extensionId: api.extensionId,
                refreshToken: api.refreshToken,
            })

            const token = await webStore.fetchToken()
            const res = await webStore.uploadExisting(zipFile, token)

            if (res.uploadState !== 'SUCCESS') {
                gutil.log(`An error occured during uploading: ${JSON.stringify(res, null, 4)}`)
            } else {
                gutil.log(`Uploaded extension version ${PACKAGE.version} to chrome store.`)
                // The default value is `trustedTesters`. Make it `default` to
                // publish to a broader audience.
                const _res = webStore.publish(DEPLOY_SETTINGS.audience, token)
                if (_res.status.includes('OK')) {
                    // eslint-disable-next-line max-len
                    gutil.log(`Succesfully published extension version ${PACKAGE.version} for ${DEPLOY_SETTINGS.audience}.`)
                    done()
                } else {
                    gutil.log(`An error occured during publishing: ${JSON.stringify(_res, null, 4)}`)
                }
            }
        })
    } else if (BUILD_TARGET === 'firefox') {
        runSequence('build', function() {
            // A firefox extension version number can only be signed and
            // uploaded once using web-ext. The second time will fail with an
            // unobvious reason.
            const api = DEPLOY_SETTINGS.firefox
            // eslint-disable-next-line max-len
            let _cmd = `web-ext sign --source-dir ./build/${BUILD_TARGET} --api-key ${api.apiKey} --api-secret ${api.apiSecret} --artifacts-dir ./build/${BUILD_TARGET}`
            let child = childExec(_cmd, undefined, (err, stdout, stderr) => {
                if (stderr) gutil.log(stderr)
                if (stdout) gutil.log(stdout)
                done()
            })

            child.stdout.on('data', (data) => {
                process.stdout.write(`${data.toString()}\r`)
            })
        })
    }
})


gulp.task('docs', 'Generate documentation.', (done) => {
    // eslint-disable-next-line max-len
    let execCommand = `node ${NODE_PATH}/jsdoc/jsdoc.js ./src/js -R ./README.md -c ./.jsdoc.json -d ${BUILD_DIR}/docs --package ./package.json`
    childExec(execCommand, undefined, (err, stdout, stderr) => {
        if (stderr) gutil.log(stderr)
        if (stdout) gutil.log(stdout)
        if (isWatching) livereload.changed('rtd.js')
        done()
    })
})


gulp.task('docs-deploy', 'Push the docs build directory to github pages.', ['docs'], () => {
    return gulp.src(`${BUILD_DIR}/docs/**/*`).pipe(ghPages())
})


gulp.task('fonts', 'Copy fonts to the build directory.', () => {
    const fontAwesomePath = path.join(NODE_PATH, 'font-awesome', 'fonts')
    const robotoBasePath = path.join(NODE_PATH, 'roboto-fontface', 'fonts', 'roboto')

    return gulp.src(path.join(fontAwesomePath, 'fontawesome-webfont.woff2'))
        .pipe(addsrc(path.join(robotoBasePath, 'Roboto-Light.woff2'), {base: robotoBasePath}))
        .pipe(addsrc(path.join(robotoBasePath, 'Roboto-Regular.woff2'), {base: robotoBasePath}))
        .pipe(addsrc(path.join(robotoBasePath, 'Roboto-Medium.woff2'), {base: robotoBasePath}))
        .pipe(flatten())
        .pipe(gulp.dest(`./build/${BUILD_TARGET}/fonts`))
        .pipe(size(_extend({title: 'fonts'}, sizeOptions)))
})


gulp.task('html', 'Add html to the build directory.', () => {
    let jsbottom, jshead, target

    if (BUILD_TARGET === 'electron') {
        target = 'electron'
        jshead = '<script src="js/lib/thirdparty/SIPml-api.js"></script>'
        jsbottom = '<script src="js/electron_webview.js"></script>'

    } else {
        target = 'webext'
        jshead = ''
        jsbottom = '<script src="js/webext_popup.js"></script>'
    }

    // The webext_popup.html file is shared with the electron build target.
    // Appropriate scripts are inserted based on the build target.
    return gulp.src(path.join('src', 'html', 'webext_popup.html'))
        .pipe(replace('<!--JSBOTTOM-->', jsbottom))
        .pipe(replace('<!--JSHEAD-->', jshead))
        .pipe(flatten())
        .pipe(ifElse((target === 'electron'), () => rename('electron_webview.html')))
        .pipe(ifElse((target === 'webext'), () => addsrc(path.join('src', 'html', 'webext_{options,callstatus}.html'))))
        .pipe(gulp.dest(`./build/${BUILD_TARGET}`))
        .pipe(ifElse(isWatching, livereload))
})


gulp.task('js-electron', [
    'js-electron-main',
    'js-electron-webview',
    'js-vendor',
], (done) => {
    if (isWatching) livereload.changed('web.js')
    done()
})
gulp.task('js-electron-main', 'Generate electron main thread js.', ['js-electron-webview'], () => {
    return gulp.src('./src/js/electron_main.js', {base: './src/js/'})
        .pipe(gulp.dest(`./build/${BUILD_TARGET}`))
        .pipe(size(_extend({title: 'electron-main'}, sizeOptions)))
        .pipe(ifElse(isWatching, livereload))
})
gulp.task('js-electron-webview', 'Generate electron webview js.', jsEntry('electron_webview'))


gulp.task('js-vendor', 'Generate third-party vendor js.', jsEntry('vendor'))


gulp.task('js-webext', 'Generate webextension js.', [
    'js-webext-bg',
    'js-webext-callstatus',
    'js-webext-observer',
    'js-webext-options',
    'js-webext-popup',
    'js-webext-tab',
    `manifest-webext-${BUILD_TARGET}`,
], (done) => {
    if (isWatching) livereload.changed('web.js')
    done()
})
gulp.task('js-webext-bg', 'Generate the extension background entry js.', jsEntry('webext_bg'))
gulp.task('js-webext-callstatus', 'Generate the callstatus entry js.', jsEntry('webext_callstatus'))
// eslint-disable-next-line max-len
gulp.task('js-webext-observer', 'Generate webextension observer js that runs in all tab frames.', jsEntry('webext_observer'))
gulp.task('js-webext-options', 'Generate webextension options js.', jsEntry('webext_options'))
gulp.task('js-webext-popup', 'Generate webextension popup/popout js.', jsEntry('webext_popup'))
gulp.task('js-webext-tab', 'Generate webextension tab js.', jsEntry('webext_tab'))


gulp.task('manifest-webext-chrome', 'Generate a web-extension manifest for Chrome.', (done) => {
    const manifestTarget = path.join(__dirname, 'build', BUILD_TARGET, 'manifest.json')
    let manifest = require('./src/manifest.json')
    manifest.options_ui.chrome_style = true
    // Reuse the version from the package.json description.
    manifest.version = PACKAGE.version
    writeFileAsync(manifestTarget, JSON.stringify(manifest, null, 4)).then(done)
})


gulp.task('manifest-webext-firefox', 'Generate a web-extension manifest for Firefox.', (done) => {
    const manifestTarget = path.join(__dirname, 'build', BUILD_TARGET, 'manifest.json')
    let manifest = require('./src/manifest.json')
    manifest.options_ui.browser_style = true
    manifest.applications = {
        gecko: {
            id: 'click-to-dial@web-extensions',
        },
    }
    // Reuse the version from the package.json description.
    manifest.version = PACKAGE.version
    writeFileAsync(manifestTarget, JSON.stringify(manifest, null, 4)).then(done)
})


gulp.task('scss', 'Compile all css.', [
    'scss-webext',
    'scss-webext-callstatus',
    'scss-webext-options',
    'scss-webext-print',
])

gulp.task('scss-webext', 'Generate popover webextension css.', scssEntry('webext'))
gulp.task('scss-webext-callstatus', 'Generate webextension callstatus dialog css.', scssEntry('webext_callstatus'))
gulp.task('scss-webext-options', 'Generate webextension options css.', scssEntry('webext_options'))
gulp.task('scss-webext-print', 'Generate webextension print css.', scssEntry('webext_print'))


gulp.task('watch', 'Start development server and watch for changes.', () => {
    const app = connect()
    isWatching = true
    livereload.listen({silent: false})
    app.use(serveStatic(path.join(__dirname, 'build')))
    app.use('/', serveIndex(path.join(__dirname, 'build'), {icons: false}))
    app.use(mount('/docs', serveStatic(path.join(__dirname, 'docs', 'build'))))
    http.createServer(app).listen(8999)
    gulp.watch([
        path.join(__dirname, 'src', 'js', '**', '*.js'),
        `!${path.join(__dirname, 'src', 'js', 'lib', 'thirdparty', '**', '*.js')}`,
        `!${path.join(__dirname, 'src', 'js', 'vendor.js')}`,
        `!${path.join(__dirname, 'src', 'js', 'electron_main.js')}`,
        `!${path.join(__dirname, 'src', 'js', 'electron_webview.js')}`,
    ], () => {
        if (BUILD_TARGET === 'electron') gulp.start('js-electron')
        else gulp.start('js-webext')

        if (WITHDOCS) gulp.start('docs')
    })

    if (WITHDOCS) {
        gutil.log('Watching documentation')
        gulp.watch([
            path.join(__dirname, '.jsdoc.json'),
            path.join(__dirname, 'README.md'),
            path.join(__dirname, 'docs', 'manuals', '**'),
        ], () => {
            gulp.start('docs')
        })
    }

    if (WATCHLINKED) {
        gutil.log('Watching linked development packages')
        gulp.watch([
            path.join(NODE_PATH, 'jsdoc-rtd', 'static', 'styles', '*.css'),
            path.join(NODE_PATH, 'jsdoc-rtd', 'static', 'js', '*.js'),
            path.join(NODE_PATH, 'jsdoc-rtd', 'publish.js'),
            path.join(NODE_PATH, 'jsdoc-rtd', 'tmpl', '**', '*.tmpl'),
        ], ['docs'])
    }

    gulp.watch([
        path.join(__dirname, 'src', '_locales', '**', '*.json'),
        path.join(__dirname, 'src', 'js', 'lib', 'thirdparty', '**', '*.js'),
    ], ['assets'])

    gulp.watch(path.join(__dirname, 'src', 'html', '**', '*.html'), ['html'])

    if (BUILD_TARGET === 'electron') {
        gulp.watch([
            path.join(__dirname, 'src', 'js', 'electron_main.js'),
            path.join(__dirname, 'src', 'js', 'electron_webview.js'),
        ], ['js-electron-main', 'js-electron-webview'])
    } else {
        gulp.watch(path.join(__dirname, 'src', 'manifest.json'), [`manifest-webext-${BUILD_TARGET}`])
        gulp.watch(path.join(__dirname, 'src', 'scss', 'webext_callstatus.scss'), ['scss-webext-callstatus'])
        gulp.watch(path.join(__dirname, 'src', 'scss', 'webext_options.scss'), ['scss-webext-options'])
        gulp.watch([path.join(__dirname, 'src', 'scss', 'webext_print.scss')], ['scss-webext-print'])
    }

    gulp.watch(path.join(__dirname, 'src', 'js', 'vendor.js'), ['js-vendor'])

    gulp.watch([
        path.join(__dirname, 'src', 'scss', 'webext.scss'),
        path.join(__dirname, 'src', 'scss', 'base', '*.scss'),
        path.join(__dirname, 'src', 'scss', 'components', '*.scss'),
    ], ['scss-webext'])
})
