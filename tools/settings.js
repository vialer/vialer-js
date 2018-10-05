const fs = require('fs')
const path = require('path')

const argv = require('yargs').argv
const gutil = require('gulp-util')
const rc = require('rc')


// The main settings object containing info from .vialer-jsrc and build flags.
module.exports = function(baseDir, overrides) {
    // Define all static or simple condition settings here.
    let settings = {
        BASE_DIR: baseDir,
        // `all`, or one or more of: `ia32`, `x64`, `armv7l`, `arm64`, `mips64el`
        BUILD_ARCH: argv.arch ? argv.arch : 'x64',
        // `all`, or one or more of: `darwin`, `linux`, `mas`, `win32`
        BUILD_PLATFORM: argv.platform ? argv.platform : 'linux',
        BUILD_TARGET: argv.target ? argv.target : 'chrome',
        BUILD_TARGETS: ['chrome', 'docs', 'electron', 'edge', 'firefox', 'node', 'webview'],
        // Default deploy target is `alpha` because it has the least impact.
        DEPLOY_TARGET: argv.deploy ? argv.deploy : 'alpha',
        LIVERELOAD: false,
        // Root of the Vialer-js project.
        ROOT_DIR: path.join(__dirname, '../'),
        SIZE_OPTIONS: {showFiles: true, showTotal: true},
        SRC_DIR: path.join(baseDir, 'src'),
        VERBOSE: argv.verbose ? true : false,
    }

    Object.assign(settings, overrides)

    settings.BRAND_TARGET = argv.brand ? argv.brand : process.env.BRAND ? process.env.BRAND : 'bologna'
    settings.NODE_PATH = path.join(settings.ROOT_DIR, 'node_modules') || process.env.NODE_PATH
    settings.PACKAGE = require(`${settings.ROOT_DIR}/package`)
    settings.VERSION = argv.version ? argv.version : settings.PACKAGE.version

    settings.BUILD_ROOT = path.join(settings.ROOT_DIR, 'build')


    // We may change BUILD_TARGET at runtime. Therefor BUILD_DIR has to be dynamic.
    Object.defineProperty(settings, 'BUILD_DIR', {
        get: function() {
            return path.join(settings.BUILD_ROOT, settings.BRAND_TARGET, settings.BUILD_TARGET)
        },
    })

    settings.SCREENS_DIR = path.join(settings.BUILD_ROOT, settings.BRAND_TARGET, 'docs', 'screens')
    settings.TEMP_DIR = path.join(settings.BUILD_ROOT, '__tmp')

    // Exit when the build target is not in the allowed list.
    if (!settings.BUILD_TARGETS.includes(settings.BUILD_TARGET)) {
        gutil.log(`Invalid build target: ${settings.BUILD_TARGET}`)
        process.exit(0)
    } else {
        // Simple brand file verification.
        for (let brand in settings.brands) {
            try {
                fs.statSync(`./src/brand/${brand}`)
            } catch (err) {
                gutil.log(`(!) Brand directory is missing for brand "${brand}"`)
                process.exit(0)
            }
        }
        // Force the build target to webview, since that is what
        // Puppeteer needs atm.
        if (argv._[0] === 'test-browser') {
            settings.BUILD_TARGET = 'webview'
            // Make this variable accessible by tests.
            process.env.BRAND = settings.BRAND_TARGET
        }
    }

    // Exit when the deploy target is not in the allowed list.
    if (!['alpha', 'beta', 'production'].includes(settings.DEPLOY_TARGET)) {
        gutil.log(`Invalid deployment target: '${settings.DEPLOY_TARGET}'`)
        process.exit(0)
    }

    // Override the pre-defined release name structure to specifically target
    // release names in Sentry.
    if (argv.release) settings.RELEASE = argv.release

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
    // Load the Vialer settings from ~/.vialer-jsrc into the existing settings.
    rc('vialer-js', settings)

    // Notify developer about some essential build flag values.
    gutil.log('BUILD FLAGS:')
    gutil.log(`- BRAND: ${settings.BRAND_TARGET}`)
    gutil.log(`- DEPLOY: ${settings.DEPLOY_TARGET}`)
    gutil.log(`- PRODUCTION: ${settings.PRODUCTION}`)
    gutil.log(`- TARGET: ${settings.BUILD_TARGET}`)
    gutil.log(`- VERBOSE: ${settings.VERBOSE}`)
    gutil.log(`- LIVERELOAD: ${settings.LIVERELOAD}`)

    return settings
}
