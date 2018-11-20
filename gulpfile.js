const c = require('ansi-colors')
const gulp = require('gulp')
const inquirer = require('inquirer')
const logger = require('gulplog')

const settings = require('./gulp/settings')(__dirname)
const helpers = require('./gulp/helpers')(settings)

// Load Gulp task modules.
const assets = require('./gulp/tasks/assets')(settings)
const code = require('./gulp/tasks/code')(settings)
const publish = require('./gulp/tasks/publish')(settings)
const misc = require('./gulp/tasks/misc')(settings)
const styles = require('./gulp/tasks/styles')(settings)
const test = require('./gulp/tasks/test')(settings)


const build = gulp.series(misc.tasks.buildClean, function build(done) {
    helpers.showBuildConfig()
    const tasks = ['assets', 'code', 'styles']
    if (['chrome', 'firefox'].includes(settings.BUILD_TARGET)) {
        tasks.push(misc.tasks.manifest)
    }

    return gulp.parallel(tasks)(done)
})


// The `assets-icons` task is a dependency of `code.tasks.vendorFg`,
// because the icons JavaScript is included in the fg vendor file.
gulp.task('assets', gulp.parallel(assets.tasks.files, assets.tasks.html, assets.tasks.templates))
gulp.task('build', build)
gulp.task('clean', misc.tasks.buildClean)

gulp.task('code', (done) => {
    let runTasks = [
        code.tasks.appBg,
        code.tasks.appFg,
        code.tasks.appI18n,
        code.tasks.vendorBg,
        gulp.series(assets.tasks.icons, code.tasks.vendorFg),
        code.tasks.plugins,
    ]
    if (settings.BUILD_TARGET === 'electron') {
        runTasks.push(code.tasks.electron)
    } else if (['chrome', 'firefox'].includes(settings.BUILD_TARGET)) {
        runTasks.push(code.tasks.appObserver)
    }
    return gulp.parallel(runTasks)(done)
})

gulp.task('default', helpers.taskDefault)
gulp.task('develop', gulp.series(build, misc.tasks.watch))
gulp.task('manifest', misc.tasks.manifest)
gulp.task('package', gulp.series(build, publish.tasks.package))


/**
 * Publish a linted, tested and optimized build to
 * the appropriate store.
 */
gulp.task('publish', async(done) => {
    if (!settings.PUBLISH_TARGETS.includes(settings.BUILD_TARGET)) {
        logger.error(`Invalid publishing platform: ${settings.BUILD_TARGET} ${helpers.format.selected(settings.PUBLISH_TARGETS)}`)
        return
    }

    settings.BUILD_OPTIMIZED = true
    settings.NODE_ENV = 'production'
    process.env.NODE_ENV = 'production'

    helpers.showBuildConfig()
    const storeTarget = c.bold.red(`${settings.BRAND_TARGET} ${settings.PUBLISH_CHANNEL}`)
    const answers = await inquirer.prompt([{
        default: false,
        message: `Publish ${storeTarget} version ${c.bold.red(settings.PACKAGE.version)} to ${settings.BUILD_TARGET} store?`,
        name: 'start',
        type: 'confirm',
    }])

    if (!answers.start) {
        logger.info('Publishing aborted')
        done(); return
    }

    gulp.series(
        gulp.parallel(test.tasks.lint, test.tasks.unit),
        'test-browser',
        build,
        publish.tasks.package,
        function toStore(finished) {
            if (settings.BUILD_TARGET === 'chrome') publish.tasks.googleStore(finished)
            return finished()
        },
        publish.tasks.sentryRelease,
    )(done)
})

gulp.task('sentry-release', publish.tasks.sentryRelease)
gulp.task('sentry-remove', publish.tasks.sentryRemove)
gulp.task('styles', (done) => {
    let runTasks = [styles.tasks.app, styles.tasks.vendor]
    if (settings.BUILD_WEBEXTENSION.includes(settings.BUILD_TARGET)) {
        runTasks.push(styles.tasks.observer)
    }
    return gulp.parallel(runTasks)(done)
})


gulp.task('test-browser', function testBrowser(done) {
    process.env.BRAND = settings.BRAND_TARGET
    const BUILD_TARGET = settings.BUILD_TARGET
    // Browser testing requires a webview build; the
    // previous build target is restored afterwards.
    settings.BUILD_TARGET = 'webview'

    return gulp.series(
        build,
        test.tasks.browser,
        async function restoreSettings() {
            settings.BUILD_TARGET = BUILD_TARGET
        }
    )(done)
})
gulp.task('test-lint', test.tasks.lint)
gulp.task('test-publish', gulp.series(
    test.tasks.lint,
    test.tasks.unit,
    'test-browser',
))

gulp.task('test-unit', test.tasks.unit)


// Add instructions to gulp tasks.
helpers.helpProject()
