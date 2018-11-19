const path = require('path')
const argv = require('yargs').argv
const c = require('ansi-colors')
const rc = require('rc')
const tildify = require('tildify')


const format = {
    selected: (options, selected) => {
        let styledOptions = options.map((option) => {
            if (option === selected) return c.bold.green(option)
            else return c.grey(option)
        })
        return `${c.grey('[')}${styledOptions.join(c.grey('|'))}${c.grey(']')}`
    },
}


module.exports = function config(projectDir, {overrides = {}} = {}) {
    // Define all static or simple condition settings here.
    let settings = {
        BASE_DIR: path.join(projectDir, './'),
        BUILD_OPTIMIZED: argv.optimized ? true : (process.env.NODE_ENV === 'production'),
        BUILD_TARGET: argv.target ? argv.target : 'webview',
        BUILD_TARGETS: ['chrome', 'electron', 'edge', 'firefox', 'node', 'webview', 'pwa'],
        BUILD_VERBOSE: argv.verbose ? true : false,
        BUILD_WEBEXTENSION: ['chrome', 'edge', 'firefox'],
        DEBUG_MODE: process.env.DEBUG === '1' ? true : false,
        ELECTRON_ARCH: argv.arch ? argv.arch : 'x64',
        ELECTRON_ARCHES: ['all', 'ia32', 'x64', 'armv7l', 'arm64', 'mips64el'],
        ELECTRON_PLATFORM: argv.platform ? argv.platform : 'linux',
        ELECTRON_PLATFORMS: ['all', 'darwin', 'linux', 'mas', 'win32'],
        // Default loglevel is info.
        LOG_LEVEL: (argv.L && argv.L.length <= 4) ? argv.L.length : 3,
        LOG_LEVELS: ['error', 'warning', 'info', 'debug'],
        NODE_ENVS: ['development', 'production'],
        // Safest default deploy target is `alpha`.
        PUBLISH_CHANNEL: argv.channel ? argv.channel : 'alpha',
        PUBLISH_CHANNELS: ['alpha', 'beta', 'production'],
        PUBLISH_TARGETS: ['chrome'],
        ROOT_DIR: path.join(__dirname, '../'),
        // Generate screenshots during browser tests?
        SIZE_OPTIONS: {showFiles: true, showTotal: true},
        SRC_DIR: path.join(projectDir, 'src'),
    }

    // Mix Vialer-js config file(~/.vialer-jsrc)
    // in settings and apply overrides.
    rc('vialer-js', settings)
    Object.assign(settings, overrides)

    // Setup directory config.
    settings.BRAND_TARGET = argv.brand ? argv.brand : process.env.BRAND ? process.env.BRAND : 'bologna'
    settings.BRAND_TARGETS = Object.keys(settings.brands)
    settings.BUILD_ROOT_DIR = path.join(settings.BASE_DIR, 'build')

    settings.PACKAGE = require(`${settings.ROOT_DIR}/package`)

    // BRAND_TARGET and BUILD_TARGET can be modified during runtime.
    Object.defineProperty(settings, 'BRAND', {get: () => settings.brands[settings.BRAND_TARGET]})
    Object.defineProperty(settings, 'BUILD_DIR', {
        get: function() {
            return path.join(settings.BUILD_ROOT_DIR, settings.BRAND_TARGET, settings.BUILD_TARGET)
        },
    })

    // Override the release name when manually
    // removing a release and artifacts from Sentry.
    Object.defineProperty(settings, 'SENTRY_RELEASE', {
        get: function() {
            if (argv.release) return argv.release
            else return `${settings.PACKAGE.version}-${settings.PUBLISH_CHANNEL}-${settings.BRAND_TARGET}-${settings.BUILD_TARGET}`
        },
    })

    settings.SCREENS_DIR = path.join(settings.ROOT_DIR, 'docs', 'build', settings.BRAND_TARGET, 'docs', 'screens')
    settings.DIST_DIR = path.join(settings.ROOT_DIR, 'dist')
    settings.NODE_DIR = path.join(settings.ROOT_DIR, 'node_modules') || process.env.NODE_DIR
    settings.TEMP_DIR = path.join(settings.BUILD_ROOT_DIR, '.tmp')
    settings.THEME_DIR = path.join(settings.NODE_DIR, settings.BRAND.theme, 'src')

    // Setup environment config.
    if (process.env.HEADLESS) settings.HEADLESS = process.env.HEADLESS === '1' ? true : false
    else settings.HEADLESS = settings.BRAND.tests.headless
    settings.NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'
    settings.SCREENS = process.env.SCREENS === '1' ? true : false

    // Validate some parameters.
    if (!settings.BUILD_TARGETS.includes(settings.BUILD_TARGET)) {
        console.log(`Invalid BUILD_TARGET: ${settings.BUILD_TARGET} ${format.selected(settings.BUILD_TARGETS)}`)
        process.exit(1)
    }
    if (!settings.PUBLISH_CHANNELS.includes(settings.PUBLISH_CHANNEL)) {
        console.log(`Invalid PUBLISH_CHANNEL: ${settings.PUBLISH_CHANNEL} ${format.selected(settings.PUBLISH_CHANNELS)}`)
        process.exit(1)
    }
    if (!settings.NODE_ENVS.includes(settings.NODE_ENV)) {
        console.log(`Invalid NODE_ENV: ${settings.NODE_ENV} ${format.selected(settings.NODE_ENVS)}`)
        process.exit(1)
    }

    // Build information overview.
    Object.defineProperty(settings, 'tree', {
        get: function() {
            return {
                label: 'Config',
                nodes: [
                    {
                        label: 'Dirs',
                        nodes: [
                            {label: `ROOT_DIR             ${tildify(settings.ROOT_DIR)}`},
                            {label: `BASE_DIR             ${tildify(settings.BASE_DIR)}`},
                            {label: `SRC_DIR              ${tildify(settings.SRC_DIR)}`},
                            {label: `BUILD_ROOT_DIR       ${tildify(settings.BUILD_ROOT_DIR)}`},
                            {label: `DIST_DIR             ${tildify(settings.DIST_DIR)}`},
                            {label: `BUILD_DIR            ${tildify(settings.BUILD_DIR)}`},
                            {label: `THEME_DIR            ${tildify(settings.THEME_DIR)}`},
                            {label: `SCREENS_DIR          ${tildify(settings.SCREENS_DIR)}`},
                            {label: `TEMP_DIR             ${tildify(settings.TEMP_DIR)}`},
                        ],
                    },
                    {
                        label: 'Flags',
                        nodes: [
                            {label: `BRAND_TARGET         --brand ${format.selected(settings.BRAND_TARGETS, settings.BRAND_TARGET)}`},
                            {label: `BUILD_TARGET         --target ${format.selected(settings.BUILD_TARGETS, settings.BUILD_TARGET)}`},
                            {label: `BUILD_OPTIMIZED      --optimized <${settings.BUILD_OPTIMIZED ? c.bold.red('yes') : c.bold.red('no')}>`},
                            {label: `BUILD_VERBOSE        --verbose <${settings.BUILD_VERBOSE ? c.bold.red('yes') : c.bold.red('no')}`},
                            {label: `PUBLISH_CHANNEL      --channel ${format.selected(settings.PUBLISH_CHANNELS, settings.PUBLISH_CHANNEL)}`},
                            {label: `ELECTRON_ARCH        --arch ${format.selected(settings.ELECTRON_ARCHES, settings.ELECTRON_ARCH)}`},
                            {label: `ELECTRON_PLATFORM    --platform ${format.selected(settings.ELECTRON_PLATFORMS, settings.ELECTRON_PLATFORM)}`},
                            {label: `SENTRY_RELEASE       --release <${c.bold.green(settings.SENTRY_RELEASE)}>`},
                            {label: `LOG_LEVEL            -${c.bold.green('L'.repeat(settings.LOG_LEVEL))} <${c.bold.red(settings.LOG_LEVELS[settings.LOG_LEVEL - 1])}>`},

                        ],
                    },
                    {
                        label: 'Environment',
                        nodes: [
                            {label: `DEBUG_MODE           DEBUG=${settings.DEBUG_MODE ? c.bold.green('1') : c.bold.grey('0')}`},
                            {label: `HEADLESS             HEADLESS=${settings.HEADLESS ? c.bold.green('1') : c.bold.grey('0')}`},
                            {label: `NODE_ENV             NODE_ENV=${format.selected(settings.NODE_ENVS, settings.NODE_ENV)}`},
                            {label: `SCREENS              SCREENS=${settings.SCREENS ? c.bold.green('1') : c.bold.grey('0')}`},
                        ],
                    },
                ],
            }
        },
    })


    return settings
}

