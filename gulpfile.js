const {_extend, promisify} = require('util')
const archiver = require('archiver')
const fs = require('fs')
const path = require('path')
const addsrc = require('gulp-add-src')
const argv = require('yargs').argv
const childExec = require('child_process').exec
const colorize = require('tap-colorize')
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
const mkdirp = promisify(require('mkdirp'))
const notify = require('gulp-notify')
const replace = require('gulp-replace')
const rc = require('rc')
const runSequence = require('run-sequence')
const size = require('gulp-size')
const svgo = require('gulp-svgo')
const tape = require('gulp-tape')
const test = require('tape')

const writeFileAsync = promisify(fs.writeFile)

// The main settings object containing info
// from .vialer-jsrc and build flags.
let settings = {}

settings.BUILD_ARCH = argv.arch ? argv.arch : 'x64' // all, or one or more of: ia32, x64, armv7l, arm64, mips64el
settings.BUILD_DIR = process.env.BUILD_DIR || path.join('./', 'build')
settings.BUILD_PLATFORM = argv.platform ? argv.platform : 'linux' // all, or one or more of: darwin, linux, mas, win32
settings.BRAND_TARGET = argv.brand ? argv.brand : 'vialer'
settings.BUILD_TARGET = argv.target ? argv.target : 'chrome'
settings.BUILD_TARGETS = ['chrome', 'electron', 'edge', 'firefox', 'node', 'webview']

// Exit when the build target is not in the allowed list.
if (!settings.BUILD_TARGETS.includes(settings.BUILD_TARGET)) {
    gutil.log(`Invalid build target: ${settings.BUILD_TARGET}`)
    process.exit(0)
}

// Default deploy target is `alpha` because it has the least impact.
settings.DEPLOY_TARGET = argv.deploy ? argv.deploy : 'alpha'
// Exit when the deploy target is not in the allowed list.
if (!['alpha', 'beta', 'production'].includes(settings.DEPLOY_TARGET)) {
    gutil.log(`Invalid deployment target: '${settings.DEPLOY_TARGET}'`)
    process.exit(0)
}
settings.LIVERELOAD = false
settings.NODE_PATH = path.join(__dirname, 'node_modules') || process.env.NODE_PATH
settings.PACKAGE = require('./package')
settings.SRC_DIR = path.join('./', 'src')
settings.SIZE_OPTIONS = {showFiles: true, showTotal: true}
settings.TEMP_DIR = path.join(settings.BUILD_DIR, '__tmp')
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
            'target=chrome': 'chrome|electron|firefox|node|webview',
        },
        brandOnly: {
            'brand=vialer': '',
        },
        browser: {
            'brand=vialer': '',
            'target=chrome': 'chrome|firefox',
        },
        targetOnly: {
            'target=chrome': 'chrome|electron|firefox|node|webview',
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
        .pipe(flatten({newPath: './fonts'}))
        .pipe(addsrc(`./src/brand/${settings.BRAND_TARGET}/img/{*.icns,*.png,*.jpg,*.gif}`, {base: `./src/brand/${settings.BRAND_TARGET}/`}))
        .pipe(addsrc(`./src/brand/${settings.BRAND_TARGET}/ringtones/*`, {base: `./src/brand/${settings.BRAND_TARGET}/`}))
        .pipe(ifElse(settings.PRODUCTION, imagemin))
        .pipe(ifElse(settings.BUILD_TARGET === 'electron', () => addsrc('./package.json')))
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
    if (settings.BUILD_TARGET === 'electron') targetTasks = ['js-electron']
    else if (settings.BUILD_TARGET === 'webview') targetTasks = ['js-vendor', 'js-app-bg', 'js-app-fg']
    else if (['chrome', 'firefox'].includes(settings.BUILD_TARGET)) targetTasks = ['js-vendor', 'js-app-bg', 'js-app-fg', 'js-app-observer', 'manifest']

    runSequence(['assets', 'templates', 'translations', 'html', 'scss', 'scss-vendor'].concat(targetTasks), done)
}, {options: taskOptions.all})


gulp.task('build-targets', 'Build all targets.', (done) => {
    // Refresh the brand content with each build.
    let electronTargetTasks = ['assets', 'html', 'scss', 'js-electron-main', 'js-vendor']
    let pluginTargetTasks = ['assets', 'html', 'scss', 'js-vendor', 'js-app-bg', 'js-app-fg', 'manifest']
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
    await mkdirp(path.join(settings.BUILD_DIR, settings.BRAND_TARGET, settings.BUILD_TARGET))
}, {options: taskOptions.all})


gulp.task('build-dist', 'Make an optimized build suitable for distribution.', ['build'], (done) => {
    const buildDir = path.join(__dirname, 'build', settings.BRAND_TARGET, settings.BUILD_TARGET)
    const distDir = path.join(__dirname, 'dist', settings.BRAND_TARGET)
    mkdirp(distDir).then(() => {
        let distName = helpers.distributionName(settings.BRAND_TARGET)

        // Not using Gulp's Vinyl-based zip, because of a symlink issue that prevents
        // the MacOS build to be zipped properly. See https://github.com/gulpjs/gulp/issues/1427
        const output = fs.createWriteStream(path.join(distDir, distName))
        const archive = archiver('zip', {zlib: {level: 6}})

        output.on('close', function() {
            gutil.log(archive.pointer() + ' total bytes archived')
            done()
        })

        archive.pipe(output)

        if (['chrome', 'firefox'].includes(settings.BUILD_TARGET)) {
            archive.directory(buildDir, false)
            archive.finalize()
        } else if (settings.BUILD_TARGET === 'electron') {
            const iconParam = `--icon=${buildDir}/img/electron-icon.png`
            let buildParams = `--arch=${settings.BUILD_ARCH} --asar --overwrite --platform=${settings.BUILD_PLATFORM} --prune=true`
            // This is broken when used in combination with Wine due to rcedit.
            // See: https://github.com/electron-userland/electron-packager/issues/769
            if (settings.BUILD_PLATFORM !== 'win32') buildParams += iconParam
            const distBuildName = `${settings.BRAND_TARGET}-${settings.BUILD_PLATFORM}-${settings.BUILD_ARCH}`
            let execCommand = `electron-packager ${buildDir} ${settings.BRAND_TARGET} ${buildParams} --out=${distDir}`
            childExec(execCommand, undefined, (err, stdout, stderr) => {
                if (stderr) gutil.log(stderr)
                if (stdout) gutil.log(stdout)
                archive.directory(path.join(distDir, distBuildName), distBuildName)
                archive.finalize()
            })
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

    // Scripts are combined
    if (['electron', 'webview'].includes(settings.BUILD_TARGET)) {
        jsbottom = '<script src="js/app_bg.js"></script><script src="js/app_fg.js"></script>'
    } else {
        jsbottom = '<script src="js/app_fg.js"></script>'
    }

    // The index.html file is shared with the electron build target.
    // Appropriate scripts are inserted based on the build target.
    return gulp.src(path.join('src', 'index.html'))
        .pipe(replace('<!--JSBOTTOM-->', jsbottom))
        .pipe(flatten())
        .pipe(gulp.dest(`./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}`))
        .pipe(ifElse(settings.LIVERELOAD, livereload))
}, {options: taskOptions.all})


gulp.task('__tmp-icons', 'Copy default SVG icons and brand icons to a temp dir.', (done) => {
    return gulp.src('./src/svg/*.svg', {base: 'src'})
        .pipe(addsrc(`./src/brand/${settings.BRAND_TARGET}/svg/*.svg`, {base: `./src/brand/${settings.BRAND_TARGET}/`}))
        .pipe(gulp.dest(path.join(settings.TEMP_DIR, settings.BRAND_TARGET)))
        .pipe(svgo())
        .pipe(size(_extend({title: 'icons'}, settings.SIZE_OPTIONS)))
})


/**
* Process all images with Vue-svgicon into Javascript Vue components,
* which can be included as regular components.
* TODO: Integrate vue-svgicon with Gulp.
*/
gulp.task('icons', 'Build an SVG iconset.', ['__tmp-icons'], (done) => {
    const srcDir = path.join(settings.TEMP_DIR, settings.BRAND_TARGET, 'svg')
    // The icons JavaScript is added inside the source.
    const srcBuildDir = path.join(settings.SRC_DIR, 'brand', settings.BRAND_TARGET, 'icons')
    let execCommand = `node_modules/vue-svgicon/bin/svg.js -s ${srcDir} -t ${srcBuildDir}`
    childExec(execCommand, undefined, (_err, stdout, stderr) => {
        if (stderr) gutil.log(stderr)
        if (stdout) gutil.log(stdout)
        done()
    })

}, {options: taskOptions.all})


gulp.task('js-electron', 'Generate Electron application.', (done) => {
    const settingsFile = path.join(__dirname, 'build', settings.BRAND_TARGET, settings.BUILD_TARGET, 'settings.json')
    runSequence([
        'js-vendor',
        'js-app-bg',
        'js-app-fg',
        'js-electron-main',
    ], async() => {
        // Vendor-specific info for Electron's main.js file.
        let mainSettings = {
            name: settings.brands[settings.BRAND_TARGET].name[settings.DEPLOY_TARGET],
            vendor: settings.brands[settings.BRAND_TARGET].vendor,
        }
        await writeFileAsync(settingsFile, JSON.stringify(mainSettings))
        done()
    })
})


gulp.task('js-electron-main', 'Copy Electron main thread js to build.', ['js-app-bg', 'js-app-fg'], () => {
    return gulp.src('./src/js/main.js', {base: './src/js/'})
        .pipe(gulp.dest(`./build/${settings.BRAND_TARGET}/${settings.BUILD_TARGET}`))
        .pipe(size(_extend({title: 'electron-main'}, settings.SIZE_OPTIONS)))
        .pipe(ifElse(settings.LIVERELOAD, livereload))
})


gulp.task('js-vendor', 'Generate third-party vendor js.', ['icons'], (done) => {
    helpers.jsEntry(
        settings.BRAND_TARGET, settings.BUILD_TARGET, 'vendor', 'vendor',
        [`./src/brand/${settings.BRAND_TARGET}/icons/index.js`],
        () => {
            if (settings.LIVERELOAD) livereload.changed('web.js')
            done()
        }
    )
}, {options: taskOptions.all})


gulp.task('js-app-bg', 'Generate the extension background entry js.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'bg/index', 'app_bg', [], () => {
        if (settings.LIVERELOAD) livereload.changed('web.js')
        done()
    })
}, {options: taskOptions.browser})


gulp.task('js-app-fg', 'Generate webextension fg/popout js.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'fg/index', 'app_fg', [], () => {
        if (settings.LIVERELOAD) livereload.changed('web.js')
        done()
    })
}, {options: taskOptions.browser})


gulp.task('js-app-observer', 'Generate WebExtension icon observer which runs in all tab frames.', (done) => {
    helpers.jsEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'observer/index', 'app_observer', [], () => {
        done()
    })
}, {options: taskOptions.browser})


gulp.task('manifest', 'Create a browser-specific manifest file.', async() => {
    let manifest = helpers.getManifest(settings.BRAND_TARGET, settings.BUILD_TARGET)
    const manifestTarget = path.join(__dirname, 'build', settings.BRAND_TARGET, settings.BUILD_TARGET, 'manifest.json')
    await mkdirp(path.join(settings.BUILD_DIR, settings.BRAND_TARGET, settings.BUILD_TARGET))
    await writeFileAsync(manifestTarget, JSON.stringify(manifest, null, 4))
}, {options: taskOptions.browser})


gulp.task('scss', 'Compile all css.', [], (done) => {
    runSequence([
        'scss-app',
        'scss-observer',
    ], () => {
        // Targetting webext.css for livereload changed only works in the
        // webview.
        if (settings.LIVERELOAD) livereload.changed('app.css')
        done()
    })
}, {options: taskOptions.all})


gulp.task('scss-app', 'Generate application css.', () => {
    return helpers.scssEntry(
        settings.BRAND_TARGET,
        settings.BUILD_TARGET,
        'app',
        !settings.PRODUCTION,
        // Mixin the component scss.
        path.join(settings.SRC_DIR, 'components', '**', '*.scss'))
}, {options: taskOptions.all})


gulp.task('scss-observer', 'Generate observer css.', () => {
    return helpers.scssEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'observer', !settings.PRODUCTION)
}, {options: taskOptions.all})


gulp.task('scss-vendor', 'Generate vendor css.', () => {
    return helpers.scssEntry(settings.BRAND_TARGET, settings.BUILD_TARGET, 'vendor', false)
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


gulp.task('test', function() {
    return gulp.src('test/**/*.js')
        .pipe(tape({
            outputStream: test.createStream().pipe(colorize()).pipe(process.stdout),
        }))
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


    if (settings.BUILD_TARGET === 'node') {
        // Node development doesn't require transpilation.
        gulp.watch([path.join(__dirname, 'src', 'js', '**', '*.js')], ['test'])
    } else {

        gulp.watch([
            path.join(__dirname, 'src', 'components', '**', '*.js'),
            path.join(__dirname, 'src', 'js', 'lib', '**', '*.js'),
            path.join(__dirname, 'src', 'js', 'fg', '**', '*.js'),
        ], WITHDOCS ? ['js-app-fg', 'docs'] : ['js-app-fg'])

        gulp.watch([
            path.join(__dirname, 'src', 'js', 'bg', '**', '*.js'),
            path.join(__dirname, 'src', 'js', 'lib', '**', '*.js'),
        ], WITHDOCS ? ['js-app-bg', 'docs'] : ['js-app-bg'])

        if (settings.BUILD_TARGET === 'electron') {
            gulp.watch([path.join(__dirname, 'src', 'js', 'main.js')], ['js-electron'])
        }
    }

    gulp.watch(path.join(__dirname, 'src', 'js', 'vendor.js'), ['js-vendor'])

    if (!['electron', 'webview'].includes(settings.BUILD_TARGET)) {
        gulp.watch(path.join(__dirname, 'src', 'manifest.json'), ['manifest'])
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
        `!${path.join(__dirname, 'src', 'scss', 'observer.scss')}`,
        path.join(__dirname, 'src', 'components', '**', '*.scss'),
    ], ['scss-app'])

    gulp.watch(path.join(__dirname, 'src', 'scss', 'observer.scss'), ['scss-observer'])
    gulp.watch(path.join(__dirname, 'src', 'scss', 'vendor.scss'), ['scss-vendor'])

    gulp.watch(path.join(__dirname, 'src', 'components', '**', '*.vue'), ['templates'])
    gulp.watch(path.join(__dirname, 'src', 'js', 'i18n', '**', '*.js'), ['translations'])
    gulp.watch(path.join(__dirname, 'test', '**', '*.js'), ['test'])


    // Add linked packages here that are used during development.
    if (WATCHLINKED) {
        gutil.log('Watching linked development packages')
        gulp.watch([
            path.join(settings.NODE_PATH, 'jsdoc-rtd', 'static', 'styles', '*.css'),
            path.join(settings.NODE_PATH, 'jsdoc-rtd', 'static', 'js', '*.js'),
            path.join(settings.NODE_PATH, 'jsdoc-rtd', 'publish.js'),
            path.join(settings.NODE_PATH, 'jsdoc-rtd', 'tmpl', '**', '*.tmpl'),
        ], ['docs'])

        gulp.watch([
            path.join(settings.NODE_PATH, 'fuet-notify', 'src', 'js', '*.js'),
        ], ['js-vendor'])
    }
})
