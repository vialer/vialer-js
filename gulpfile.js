const {_extend, promisify} = require('util')
const fs = require('fs')
const path = require('path')
const addsrc = require('gulp-add-src')
const argv = require('yargs').argv
const childExec = require('child_process').exec
const composer = require('gulp-uglify/composer')
const concat = require('gulp-concat')
const del = require('del')
const flatten = require('gulp-flatten')
const fuet = require('gulp-fuet')
const ghPages = require('gulp-gh-pages')
const gulp = require('gulp-help')(require('gulp'), {})
const gutil = require('gulp-util')
const Helpers = require('./gulp/helpers')
const livereload = require('gulp-livereload')
const ifElse = require('gulp-if-else')
const insert = require('gulp-insert')
const imagemin = require('gulp-imagemin')
const minifier = composer(require('uglify-es'), console)
const mkdirp = require('mkdirp')
const notify = require('gulp-notify')
const replace = require('gulp-replace')
const rc = require('rc')
const runSequence = require('run-sequence')
const size = require('gulp-size')
const zip = require('gulp-zip')

const writeFileAsync = promisify(fs.writeFile)
// The main settings object containing info
// from .vialer-jsrc and build flags.
let settings = {}

settings.BRAND_TARGET = argv.brand ? argv.brand : 'vialer'
settings.BUILD_DIR = process.env.BUILD_DIR || path.join(__dirname, 'build')
settings.BUILD_TARGET = argv.target ? argv.target : 'chrome'
settings.BUILD_TARGETS = ['chrome', 'electron', 'edge', 'firefox', 'webview']
// Exit when the build target is not in the allowed list.
if (!settings.BUILD_TARGETS.includes(settings.BUILD_TARGET)) {
    gutil.log(`Invalid build target: ${settings.BUILD_TARGET}`)
    process.exit(0)
}

settings.DEPLOY_TARGET = argv.deploy ? argv.deploy : 'beta'
// Exit when the deploy target is not in the allowed list.
if (!['production', 'beta'].includes(settings.DEPLOY_TARGET)) {
    gutil.log(`Invalid deployment target: '${settings.DEPLOY_TARGET}'`)
    process.exit(0)
}
settings.LIVERELOAD = false
settings.NODE_PATH = path.join(__dirname, 'node_modules') || process.env.NODE_PATH
settings.PACKAGE = require('./package')
settings.SRC_DIR = path.join(__dirname, 'src')
settings.SIZE_OPTIONS = {showFiles: true, showTotal: true}
settings.VERBOSE = argv.verbose ? true : false

// Force production mode when running certain tasks from
// the commandline or when using a deploy command.
if (argv._[0] && (['deploy', 'build-dist'].includes(argv._[0]) || argv._[0].includes('deploy'))) {
    settings.PRODUCTION = true
    // Force NODE_ENV to production for envify.
    process.env.NODE_ENV = 'production'
} else {
    // Production mode is on when NODE_ENV environmental var is set.
    settings.PRODUCTION = argv.production ? argv.production : (process.env.NODE_ENV === 'production')

    if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'
}

settings.NODE_ENV = process.env.NODE_ENV

// Loads the Vialer settings from ~/.vialer-jsrc into the
// existing settings object.
rc('vialer-js', settings)


// Simple brand validation checks.
if (!settings.brands[settings.BRAND_TARGET]) {
    gutil.log(`(!) Brand ${settings.BRAND_TARGET} does not exist. Check vialer-jsrc.`)
    process.exit(0)
}
for (let brand in settings.brands) {
    try {
        fs.statSync(`./src/brand/${brand}`)
    } catch (err) {
        gutil.log(`(!) Brand directory is missing for brand "${brand}"`)
        process.exit(0)
    }
}
// Initialize the helpers, which make this file less dense.
const helpers = new Helpers(settings)


const WATCHLINKED = argv.linked ? argv.linked : false
const WITHDOCS = argv.docs ? argv.docs : false

let taskOptions = {}
if (settings.VERBOSE) {
    taskOptions = {
        all: {
            'brand=vialer': '',
            'target=chrome': 'chrome|firefox|electron|webview',
        },
        brandOnly: {
            'brand=vialer': '',
        },
        browser: {
            'brand=vialer': '',
            'target=chrome': 'chrome|firefox',
        },
        targetOnly: {
            'target=chrome': 'chrome|firefox|electron|webview',
        },
        webview: {
            'brand=vialer': '',
            'target=chrome': 'electron|webview',
        },
    }
}

// Notify developer about some essential build flag values.
gutil.log('BUILD FLAGS:')
gutil.log(`- BRAND: ${settings.BRAND_TARGET}`)
gutil.log(`- DEPLOY: ${settings.DEPLOY_TARGET}`)
gutil.log(`- PRODUCTION: ${settings.PRODUCTION}`)
gutil.log(`- TARGET: ${settings.BUILD_TARGET}`)
gutil.log(`- VERBOSE: ${settings.VERBOSE}`)


gulp.task('assets', 'Copy (branded) assets to the build directory.', () => {
    const robotoPath = path.join(settings.NODE_PATH, 'roboto-fontface', 'fonts', 'roboto')
    return gulp.src(path.join(robotoPath, '{Roboto-Light.woff2,Roboto-Regular.woff2,Roboto-Medium.woff2}'))
        .pipe(addsrc(path.join(settings.SRC_DIR, 'fonts', '*'), {base: settings.SRC_DIR}))
        .pipe(addsrc(path.join(settings.NODE_PATH, 'font-awesome', 'fonts', 'fontawesome-webfont.woff2')))
        .pipe(flatten({newPath: './fonts'}))
        .pipe(addsrc(`./src/brand/${settings.BRAND_TARGET}/img/{*.png,*.jpg}`, {base: `./src/brand/${settings.BRAND_TARGET}/`}))
        .pipe(addsrc(`./src/brand/${settings.BRAND_TARGET}/ringtones/*`, {base: `./src/brand/${settings.BRAND_TARGET}/`}))
        .pipe(ifElse(settings.PRODUCTION, imagemin))
        .pipe(addsrc('./LICENSE'))
        .pipe(addsrc('./README.md'))
        .pipe(addsrc('./src/_locales/**', {base: './src/'}))
        .pipe(gulp.dest(`./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}`))
        .pipe(size(_extend({title: 'assets'}, settings.SIZE_OPTIONS)))
        .pipe(ifElse(settings.LIVERELOAD, livereload))
}, {options: taskOptions.all})


gulp.task('build', 'Make a branded unoptimized development build.', (done) => {
    // Refresh the brand content with each build.
    let targetTasks
    if (settings.BUILD_TARGET === 'electron') targetTasks = ['js-electron-main', 'js-webview', 'js-vendor']
    else if (settings.BUILD_TARGET === 'webview') targetTasks = ['js-webview', 'js-vendor']
    else targetTasks = ['js-vendor', 'js-webext']

    runSequence(['assets', 'templates', 'translations', 'html', 'scss', 'scss-vendor'].concat(targetTasks), done)
}, {options: taskOptions.all})


gulp.task('build-targets', 'Build all targets.', (done) => {
    // Refresh the brand content with each build.
    let electronTargetTasks = ['assets', 'html', 'scss', 'js-electron-main', 'js-webview', 'js-vendor']
    let pluginTargetTasks = ['assets', 'html', 'scss', 'js-vendor', 'js-webext']
    settings.BUILD_TARGET = 'chrome'
    runSequence(pluginTargetTasks, () => {
        settings.BUILD_TARGET = 'firefox'
        runSequence(pluginTargetTasks, () => {
            settings.BUILD_TARGET = 'edge'
            runSequence(pluginTargetTasks, () => {
                settings.BUILD_TARGET = 'electron'
                runSequence(electronTargetTasks, () => {
                    done()
                })
            })
        })
    })
})


gulp.task('build-clean', 'Clear the build directory', async() => {
    await del([path.join(settings.BUILD_DIR, settings.BRAND_TARGET, settings.BUILD_TARGET, '**')], {force: true})
    mkdirp(path.join(settings.BUILD_DIR, settings.BRAND_TARGET, settings.BUILD_TARGET))
}, {options: taskOptions.all})


gulp.task('build-dist', 'Make an optimized build and generate a WebExtension zip file from it.', (done) => {
    const buildDir = `./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}`
    runSequence('build', async function() {
        // Use the web-ext build method here, so the result will match
        // the deployable version as closely as possible.
        if (settings.BUILD_TARGET === 'firefox') {
            const source = `--source-dir ${buildDir}`
            const artifacts = `--artifacts-dir ./dist/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}/`
            let execCommand = `web-ext build --overwrite-dest ${source} ${artifacts}`
            let child = childExec(execCommand, undefined, (err, stdout, stderr) => {
                if (stderr) gutil.log(stderr)
                if (stdout) gutil.log(stdout)
                done()
            })

            child.stdout.on('data', (data) => {
                process.stdout.write(`${data.toString()}\r`)
            })
        } else {
            gulp.src([`${buildDir}/**`], {base: buildDir})
                .pipe(zip(`${helpers.distributionName(settings.BRAND_TARGET)}.zip`))
                .pipe(gulp.dest(`./dist/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}/`))
                .on('end', done)
        }
    })
}, {options: taskOptions.all})


gulp.task('build-run', 'Make a development build and run it in the target environment.', () => {
    let command = `gulp build --target ${settings.BUILD_TARGET} --brand ${settings.BRAND_TARGET}`
    const buildDir = `./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}`
    if (settings.BUILD_TARGET === 'chrome') command = `${command};chromium --user-data-dir=/tmp/vialer-js --load-extension=${buildDir} --no-first-run`
    else if (settings.BUILD_TARGET === 'firefox') command = `${command};web-ext run --no-reload --source-dir ${buildDir}`
    else if (settings.BUILD_TARGET === 'electron') {
        command = `${command};electron --js-flags='--harmony-async-await' ${buildDir}/main.js`
    } else if (settings.BUILD_TARGET === 'webview') {
        helpers.startDevServer()
        const urlTarget = `http://localhost:8999/${settings.BRAND_TARGET}/webview/index.html`
        command = `${command};chromium --disable-web-security --new-window ${urlTarget}`
    }
    childExec(command, undefined, (err, stdout, stderr) => {
        if (err) gutil.log(err)
    })
}, {options: taskOptions.all})


gulp.task('deploy', 'Deploy <BRAND_TARGET> to the <BUILD_TARGET> store.', async() => {
    await helpers.deploy(settings.BRAND_TARGET, settings.BUILD_TARGET, helpers.distributionName(settings.BRAND_TARGET))
}, {options: taskOptions.browser})


gulp.task('deploy-brand', 'Deploy <BRAND_TARGET> to all supported target stores.', async() => {
    const targets = ['chrome', 'firefox']
    for (const target of targets) {
        await helpers.deploy(settings.BRAND_TARGET, target, helpers.distributionName(settings.BRAND_TARGET))
    }
}, {options: taskOptions.brandOnly})


gulp.task('deploy-brands', 'Deploy all brands to <BUILD_TARGET> store.', async() => {
    // Can't do this async, since settings are modified during deploy to work
    // around gulp tasks not accepting parameters.
    for (const brand of Object.keys(settings.brands)) {
        await helpers.deploy(brand, settings.BUILD_TARGET, helpers.distributionName(brand))
    }
}, {options: taskOptions.targetOnly})


gulp.task('deploy-brands-targets', 'Deploy all brands to all supported target stores.', async() => {
    const targets = ['chrome', 'firefox']
    for (const target of targets) {
        for (const brand of Object.keys(settings.brands)) {
            await helpers.deploy(brand, target, helpers.distributionName(brand))
        }
    }
})


gulp.task('docs', 'Generate docs.', (done) => {
    let execCommand = `node ${settings.NODE_PATH}/jsdoc/jsdoc.js ./src/js -R ./README.md -c ./.jsdoc.json -d ${settings.BUILD_DIR}/docs --package ./package.json`
    childExec(execCommand, undefined, (err, stdout, stderr) => {
        if (stderr) gutil.log(stderr)
        if (stdout) gutil.log(stdout)
        if (settings.LIVERELOAD) livereload.changed('rtd.js')
        done()
    })
})


gulp.task('docs-deploy', 'Publish docs on github pages.', ['docs'], () => {
    return gulp.src(`${settings.BRAND_TARGET}/${settings.BUILD_DIR}/docs/**/*`).pipe(ghPages())
})


gulp.task('html', 'Preprocess and build application HTML.', () => {
    let jsbottom

    if (['electron', 'webview'].includes(settings.BUILD_TARGET)) {
        jsbottom = '<script src="js/webview.js"></script>'

    } else {
        jsbottom = '<script src="js/webext_fg.js"></script>'
    }

    // The index.html file is shared with the electron build target.
    // Appropriate scripts are inserted based on the build target.
    return gulp.src(path.join('src', 'index.html'))
        .pipe(replace('<!--JSBOTTOM-->', jsbottom))
        .pipe(flatten())
        .pipe(gulp.dest(`./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}`))
        .pipe(ifElse(settings.LIVERELOAD, livereload))
}, {options: taskOptions.all})


gulp.task('js-electron', 'Generate electron js.', (done) => {
    runSequence([
        'js-electron-main',
        'js-webview',
        'js-vendor',
    ], done)
})


gulp.task('js-electron-main', 'Generate electron main thread js.', ['js-webview'], () => {
    return gulp.src('./src/js/main.js', {base: './src/js/'})
        .pipe(gulp.dest(`./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}`))
        .pipe(size(_extend({title: 'electron-main'}, settings.SIZE_OPTIONS)))
        .pipe(ifElse(settings.LIVERELOAD, livereload))
})


gulp.task('js-webview', 'Generate webview js.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'webview/index', 'webview', () => {
        if (settings.LIVERELOAD) livereload.changed('web.js')
        done()
    })
})

gulp.task('js-vendor', 'Generate third-party vendor js.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'vendor', 'vendor', () => {
        if (settings.LIVERELOAD) livereload.changed('web.js')
        done()
    })
}, {options: taskOptions.all})

gulp.task('js-webext', 'Generate WebExtension js.', [], (done) => {
    runSequence([
        'js-webext-bg',
        'js-webext-fg',
        'js-webext-observer',
        'js-webext-tab',
    ], 'manifest-webext', () => {
        if (settings.LIVERELOAD) livereload.changed('web.js')
        done()
    })
}, {options: taskOptions.browser})

gulp.task('js-webext-bg', 'Generate the extension background entry js.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'bg/index', 'webext_bg', done)
}, {options: taskOptions.browser})

gulp.task('js-webext-fg', 'Generate webextension fg/popout js.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'fg/index', 'webext_fg', done)
}, {options: taskOptions.browser})

gulp.task('js-webext-observer', 'Generate WebExtension observer js that runs in all tab frames.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'observer/index', 'webext_observer', done)
}, {options: taskOptions.browser})

gulp.task('js-webext-tab', 'Generate webextension tab js.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'tab/index', 'webext_tab', done)
}, {options: taskOptions.browser})



gulp.task('manifest-webext', 'Generate a manifest for a browser WebExtension.', async() => {
    let manifest = helpers.getManifest(settings.BRAND_TARGET, settings.BUILD_TARGET)
    const manifestTarget = path.join(__dirname, 'build', settings.BRAND_TARGET, settings.BUILD_TARGET, 'manifest.json')
    await writeFileAsync(manifestTarget, JSON.stringify(manifest, null, 4))
}, {options: taskOptions.browser})


gulp.task('scss', 'Compile all css.', [], (done) => {
    runSequence([
        'scss-main',
        'scss-print',
    ], () => {
        // Targetting webext.css for livereload changed only works in the
        // webview. In the callstatus html, it will trigger a page reload.
        if (settings.LIVERELOAD) livereload.changed('main.css')
        done()
    })
}, {options: taskOptions.all})


gulp.task('scss-main', 'Generate main application css.', () => {
    return helpers.scssEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'main')
}, {options: taskOptions.all})

gulp.task('scss-print', 'Generate print css.', () => {
    return helpers.scssEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'print')
}, {options: taskOptions.all})

gulp.task('scss-vendor', 'Generate vendor css.', () => {
    return helpers.scssEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'vendor')
}, {options: taskOptions.all})


gulp.task('templates', 'Build Vue component templates', () => {
    gulp.src('./src/components/**/*.vue')
        .pipe(fuet({
            commonjs: false,
            namespace: 'global.templates',
            pathfilter: ['src', 'components'],
        }))
        .on('error', notify.onError('Error: <%= error.message %>'))
        .pipe(ifElse(settings.PRODUCTION, () => minifier()))
        .on('end', () => {
            if (settings.LIVERELOAD) livereload.changed('templates.js')
        })
        .pipe(concat('templates.js'))
        .pipe(insert.prepend('global.templates={};'))
        .pipe(gulp.dest(path.join(settings.BUILD_DIR, settings.BRAND_TARGET, settings.BUILD_TARGET, 'js')))
        .pipe(size(_extend({title: 'templates'}, settings.SIZE_OPTIONS)))
})


gulp.task('translations', 'Generate translations', (done) => {
    return gulp.src('./src/js/i18n/*.js', {base: './src/js/'})
        .pipe(concat('translations.js'))
        .pipe(ifElse(settings.PRODUCTION, () => minifier()))
        .pipe(gulp.dest(path.join(settings.BUILD_DIR, settings.BRAND_TARGET, settings.BUILD_TARGET, 'js')))
        .pipe(size(_extend({title: 'js-translations'}, settings.SIZE_OPTIONS)))
        .pipe(ifElse(settings.LIVERELOAD, livereload))
})


gulp.task('watch', 'Start development server and watch for changes.', () => {
    settings.LIVERELOAD = true
    helpers.startDevServer()

    // Watch files related to working on the documentation.
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

    // Watch files related to working on the webextension.
    gulp.watch([
        path.join(__dirname, 'src', 'js', '**', '*.js'),
        path.join(__dirname, 'src', 'components', '**', '*.js'),
        `!${path.join(__dirname, 'src', 'js', 'vendor.js')}`,
        `!${path.join(__dirname, 'src', 'js', 'main.js')}`,
        `!${path.join(__dirname, 'src', 'js', 'webview.js')}`,
        `!${path.join(__dirname, 'src', 'js', 'i18n', '*.js')}`,
    ], () => {
        if (settings.BUILD_TARGET === 'electron') {
            gulp.start('js-electron')
        } else if (settings.BUILD_TARGET === 'webview') {
            gulp.start('js-webview')
        } else {
            gulp.start('js-webext')
        }

        if (WITHDOCS) gulp.start('docs')
    })

    gulp.watch(path.join(__dirname, 'src', 'js', 'vendor.js'), ['js-vendor'])

    if (!['electron', 'webview'].includes(settings.BUILD_TARGET)) {
        gulp.watch(path.join(__dirname, 'src', 'manifest.json'), ['manifest-webext'])
        gulp.watch(path.join(__dirname, 'src', 'brand.json'), ['build'])
    }

    // Watch files related to working on assets.
    gulp.watch([
        path.join(__dirname, 'src', '_locales', '**', '*.json'),
        path.join(__dirname, 'src', 'js', 'lib', 'thirdparty', '**', '*.js'),
    ], ['assets'])

    // Watch files related to working on the html and css.
    gulp.watch(path.join(__dirname, 'src', 'index.html'), ['html'])
    gulp.watch([
        path.join(__dirname, 'src', 'scss', '**', '*.scss'),
        path.join(__dirname, 'src', 'components', '**', '*.scss'),
    ], ['scss'])

    gulp.watch(path.join(__dirname, 'src', 'scss', 'vendor.scss'), ['scss-vendor'])

    gulp.watch(path.join(__dirname, 'src', 'components', '**', '*.vue'), ['templates'])
    gulp.watch(path.join(__dirname, 'src', 'js', 'i18n', '**', '*.js'), ['translations'])


    // Add linked packages here that are used during development.
    if (WATCHLINKED) {
        gutil.log('Watching linked development packages')
        gulp.watch([
            path.join(settings.NODE_PATH, 'jsdoc-rtd', 'static', 'styles', '*.css'),
            path.join(settings.NODE_PATH, 'jsdoc-rtd', 'static', 'js', '*.js'),
            path.join(settings.NODE_PATH, 'jsdoc-rtd', 'publish.js'),
            path.join(settings.NODE_PATH, 'jsdoc-rtd', 'tmpl', '**', '*.tmpl'),
        ], ['docs'])
    }
})
