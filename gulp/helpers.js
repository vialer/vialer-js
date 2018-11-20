const archy = require('archy')
const c = require('ansi-colors')
const gulp = require('gulp')
const getTask = require('gulp-cli/lib/versioned/^4.0.0/log/get-task')
const logger = require('gulplog')
const logTasks = require('gulp-cli/lib/shared/log/tasks')


module.exports = function(settings) {

    const helpers = {}

    /**
     * Format console output for Gulp help.
     */
    helpers.format = {
        context: () => {
            return `${settings.BRAND_TARGET} ${settings.BUILD_TARGET}`
        },
        selected: (options, selected) => {
            let styledOptions = options.map((option) => {
                if (option === selected) return c.bold.green(option)
                else return c.grey(option)
            })
            return `${c.grey('[')}${styledOptions.join(c.grey('|'))}${c.grey(']')}`
        },
    }


    /**
     * Share common descriptions between project and docs tasks.
     */
    helpers.desc = {
        assets: `bundle html, icons, templates and static assets for ${helpers.format.context()}`,
        build: `build ${helpers.format.context()} application`,
        code: `bundle application javascript code for ${helpers.format.context()}`,
        default: 'show this task list',
        develop: `start developing on ${helpers.format.context()}`,
        naWebExtensionOnly: c.bold.red(`<not available> ${helpers.format.selected(settings.BUILD_WEBEXTENSION)}`),
        styles: `bundle app scss styling for ${helpers.format.context()}`,
    }



    /**
     * Add Gulp task description and flags to the docs
     * gulpfile's registered tasks.
     */
    helpers.helpDocs = function() {
        const tasks = gulp.registry()._tasks
        tasks.assets.description = helpers.desc.assets
        tasks.build.description = helpers.desc.build
        tasks.code.description = helpers.desc.code
        tasks.default.description = helpers.desc.default

        tasks.pages.description = `build topics json for ${helpers.format.context()}`
        tasks.styles.description = helpers.desc.styles
        tasks.screens.description = `build screenshots for ${helpers.format.context()}`
        tasks.develop.description = helpers.desc.develop
    }


    /**
     * Add Gulp task description and flags to the project
     * gulpfile's registered tasks.
     */
    helpers.helpProject = function() {
        const tasks = gulp.registry()._tasks

        tasks.assets.description = helpers.desc.assets
        tasks.build.description = helpers.desc.build
        tasks.build.flags = {
            '--verbose': `extra verbose logger <${settings.BUILD_VERBOSE ? c.bold.red('yes') : c.bold.red('no')}>`,
        }

        tasks.clean.description = `clean build directory for ${helpers.format.context()}`
        tasks.code.description = helpers.desc.code

        tasks.default.description = helpers.desc.default
        tasks.develop.description = helpers.desc.develop

        tasks['sentry-release'].description = `create sentry release for ${helpers.format.context()}`
        tasks['sentry-remove'].description = `remove sentry release for ${helpers.format.context()}`
        tasks['sentry-remove'].flags = {
            '--release': `using version <${c.bold.green(settings.SENTRY_RELEASE)}>`,
        }

        if (settings.BUILD_WEBEXTENSION.includes(settings.BUILD_TARGET)) {
            tasks.publish.description = `publish ${helpers.format.context()} version ${c.bold.red(settings.PACKAGE.version)}`
            tasks.manifest.description = `build ${helpers.format.context()} webextension manifest.json`
        } else {
            tasks.publish.description = helpers.desc.naWebExtensionOnly
            tasks.manifest.description = helpers.desc.naWebExtensionOnly
        }

        tasks.package.description = `package distribution-ready build for ${helpers.format.context()}`
        if (settings.BUILD_TARGET === 'electron') {
            tasks.package.flags = {
                '--arch': `using architecture ${helpers.format.selected(settings.ELECTRON_ARCHES, settings.ELECTRON_ARCH)}`,
                '--platform': `on platform ${helpers.format.selected(settings.ELECTRON_PLATFORMS, settings.ELECTRON_PLATFORM)}`,
            }
        }

        tasks['test-browser'].description = `run functional tests on a forced webview for ${settings.BRAND_TARGET} `
        if (settings.BUILD_TARGET === 'webview') {
            tasks.package.description = helpers.desc.naWebExtensionOnly
        }

        tasks.styles.description = helpers.desc.styles
        tasks['test-lint'].description = 'lint project consistency and styleguides'
        tasks['test-unit'].description = `run unit tests for ${settings.BRAND_TARGET}`
    }


    /**
     * Show a summary of all related build variables
     * and directories.
     */
    helpers.showBuildConfig = function() {
        logger.info('')
        archy(settings.tree).split('\n').forEach((line) => logger.info(line))
    }


    /**
     * Gulp default task overview and build configuration.
     */
    helpers.taskDefault = async function() {
        logger.info('')
        let tree = gulp.tree({deep: true})
        // Filter out the default task.
        tree.nodes = tree.nodes.filter((node) => node.label !== 'default')
        // Produce a flat overview of tasks.
        for (const node of tree.nodes) {
            if (node.nodes.length) {
                node.nodes = []
            }
        }
        logTasks(tree, {}, getTask(gulp))
        logger.info('')
        // build flags are formatted the same way as gulp tasks.
        archy(settings.tree).split('\n').forEach((line) => logger.info(line))
    }

    return helpers
}
