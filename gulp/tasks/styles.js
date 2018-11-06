const {_extend} = require('util')
const path = require('path')

const cleanCSS = require('gulp-clean-css')
const concat = require('gulp-concat')
const gulp = require('gulp')
const ifElse = require('gulp-if-else')
const insert = require('gulp-insert')
const logger = require('gulplog')
const notify = require('gulp-notify')
const sass = require('gulp-sass')
const size = require('gulp-size')
const sourcemaps = require('gulp-sourcemaps')

let helpers = {}
let tasks = {}


module.exports = function(settings) {
    /**
    * Generic SCSS parsing helper for one or more entrypoints.
    * @param {Object} options Options to pass.
    * @param {Array} [options.addons] Add extra entrypoints.
    * @param {String} [options.entry] Name of the scss entrypoint.
    * @param {Boolean} options.debug] Generate sourcemaps.
    * @returns {Function} Gulp stream.
    */
    helpers.compile = function({addons = [], debug = false, entry}) {
        const brandColors = this.toScss(settings.brands[settings.BRAND_TARGET].colors)
        let includePaths = [
            settings.NODE_DIR,
            // Use a directory up to the project directory,
            // because we want to expose vialer-js as an import
            // prefix in project-related SCSS files.
            path.join(settings.ROOT_DIR, 'src', 'scss'),
        ]
        const name = path.basename(entry, '.scss')

        let sources = [entry]
        if (addons.length) sources = sources.concat(addons)

        return gulp.src(sources)
            .pipe(insert.prepend(brandColors))
            .pipe(ifElse(debug, () => sourcemaps.init({loadMaps: true})))
            .pipe(sass({
                includePaths,
                sourceMap: false,
                sourceMapContents: false,
            }))
            .on('error', notify.onError('Error: <%= error.message %>'))
            .pipe(concat(`${name}.css`))
            .pipe(ifElse(settings.BUILD_OPTIMIZED, () => cleanCSS({advanced: true, level: 2})))
            .pipe(ifElse(debug, () => sourcemaps.write('./')))
            .pipe(gulp.dest(path.join(settings.BUILD_DIR, 'css')))
            .pipe(size(_extend({title: `scss-${name}`}, settings.SIZE_OPTIONS)))
    }


    /**
    * Convert key/value object to SCSS variables string.
    * @param {Object} properties Object with depth 1.
    * @returns {String} Scss-formatted variables string.
    */
    helpers.toScss = function(properties) {
        return Object.keys(properties).map((name) => '$' + name + ': ' + properties[name] + ';').join('\n')
    }


    tasks.app = function stylesApp() {
        let addons = [path.join(settings.SRC_DIR, 'components', '**', '*.scss')]
        const builtin = settings.brands[settings.BRAND_TARGET].plugins.builtin
        const custom = settings.brands[settings.BRAND_TARGET].plugins.custom

        const sectionModules = Object.assign(builtin, custom)
        for (const moduleName of Object.keys(sectionModules)) {
            const sectionModule = sectionModules[moduleName]
            if (sectionModule.addons && sectionModule.addons.fg.length) {
                for (const addon of sectionModule.addons.fg) {
                    const dirName = addon.split('/')[0]
                    logger.info(`[fg] addon styles for ${moduleName} (${addon})`)
                    addons.push(path.join(settings.NODE_DIR, dirName, 'src', 'components', '**', '*.scss'))
                }
            } else if (sectionModule.parts && sectionModule.parts.includes('fg')) {
                logger.info(`[fg] addon styles for ${moduleName} (${sectionModule.name})`)
                // The module may include a path to the source file.
                addons.push(path.join(settings.NODE_DIR, sectionModule.name, 'src', 'components', '**', '*.scss'))
            }
        }
        return helpers.compile({
            addons,
            debug: !settings.BUILD_OPTIMIZED,
            entry: './src/scss/vialer-js/app.scss',
        })
    }


    tasks.observer = function stylesObserver() {
        return helpers.compile({
            debug: !settings.BUILD_OPTIMIZED,
            entry: './src/scss/vialer-js/observer.scss',
        })
    }


    tasks.vendor = function stylesVendor() {
        return helpers.compile({
            debug: false,
            entry: './src/scss/vialer-js/vendor.scss',
        })
    }

    return {helpers, tasks}
}
