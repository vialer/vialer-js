const {_extend} = require('util')
const fs = require('fs')
const path = require('path')

const addsrc = require('gulp-add-src')
const childExec = require('child_process').exec
const composer = require('gulp-uglify/composer')
const concat = require('gulp-concat')
const flatten = require('gulp-flatten')
const gulp = require('gulp')
const ifElse = require('gulp-if-else')
const insert = require('gulp-insert')
const imagemin = require('gulp-imagemin')
const logger = require('gulplog')
const minifier = composer(require('uglify-es'), console)
const notify = require('gulp-notify')
const size = require('gulp-size')
const svgo = require('gulp-svgo')
const template = require('gulp-template')
const vueCompiler = require('@vialer/vue-compiler-gulp')

let tasks = {}


module.exports = function(settings) {

    // Check if the brand theme directory exists.
    if (!fs.existsSync(settings.THEME_DIR)) {
        throw new Error(`Cannot find ${settings.BRAND_TARGET} theme (${settings.THEME_DIR}`)
    }

    tasks.files = function assetsFiles() {
        const robotoPath = path.join(settings.NODE_DIR, 'roboto-fontface', 'fonts', 'roboto')
        return gulp.src(path.join(robotoPath, '{Roboto-Light.woff2,Roboto-Regular.woff2,Roboto-Medium.woff2}'))
            .pipe(flatten({newPath: './fonts'}))
            .pipe(addsrc(path.join(settings.THEME_DIR, 'img', '{*.icns,*.png,*.jpg,*.gif}'), {base: settings.THEME_DIR}))
            .pipe(addsrc(path.join(settings.THEME_DIR, 'ringtones', '*'), {base: settings.THEME_DIR}))
            .pipe(ifElse(settings.BUILD_OPTIMIZED, imagemin))
            .pipe(ifElse(settings.BUILD_TARGET === 'electron', () => {
                return addsrc(path.join(settings.ROOT_DIR, 'package.json'))
            }))
            .pipe(addsrc(path.join(settings.ROOT_DIR, 'LICENSE')))
            .pipe(addsrc(path.join(settings.ROOT_DIR, 'README.md')))
            .pipe(addsrc(path.join(settings.SRC_DIR, '_locales', '**'), {base: './src/'}))
            .pipe(gulp.dest(path.join(settings.BUILD_DIR)))
            .pipe(size(_extend({title: 'assets'}, settings.SIZE_OPTIONS)))
    }


    tasks.html = function assetsHtml() {
        return gulp.src(path.join(settings.SRC_DIR, 'index.html'))
            .pipe(template({settings}))
            .pipe(flatten())
            .pipe(gulp.dest(settings.BUILD_DIR))
    }


    tasks.icons = function assetsIcons(done) {
        // Use relative paths or vsvg will choke.
        gulp.src(path.join(settings.SRC_DIR, 'svg', '*.svg'), {base: settings.SRC_DIR})
            .pipe(addsrc(path.join(settings.THEME_DIR, 'svg', '*.svg'), {base: settings.THEME_DIR}))
            .pipe(svgo())
            .pipe(size(_extend({title: 'icons'}, settings.SIZE_OPTIONS)))
            .pipe(gulp.dest(path.join(settings.TEMP_DIR, settings.BRAND_TARGET)))
            .on('end', () => {
                const iconSrc = path.join(settings.TEMP_DIR, settings.BRAND_TARGET, 'svg')
                const iconBuildDir = path.join(settings.TEMP_DIR, settings.BRAND_TARGET, 'build')
                const execCommand = `node_modules/vue-svgicon/dist/lib/index.js -s ${iconSrc} -t ${iconBuildDir}`
                childExec(execCommand, undefined, (_err, stdout, stderr) => {
                    if (stderr) logger.debug(stderr)
                    if (stdout) logger.debug(stdout)
                    done()
                })
            })
    }


    tasks.templates = function assetsTemplates() {
        let sources = ['./src/components/**/*.vue']
        const builtin = settings.brands[settings.BRAND_TARGET].plugins.builtin
        const custom = settings.brands[settings.BRAND_TARGET].plugins.custom

        const sectionPlugins = Object.assign(builtin, custom)
        for (const moduleName of Object.keys(sectionPlugins)) {
            const sectionPlugin = sectionPlugins[moduleName]

            if (sectionPlugin.addons && sectionPlugin.addons.fg.length) {
                for (const addon of sectionPlugin.addons.fg) {
                    logger.info(`[fg] addon templates for ${moduleName} (${addon})`)
                    sources.push(path.join(settings.NODE_DIR, addon, 'src', 'components', '**', '*.vue'))
                }
            } else if (sectionPlugin.parts && sectionPlugin.parts.includes('fg')) {
                logger.info(`[fg] custom templates for ${moduleName} (${sectionPlugin.name})`)
                // The module may include a path to the source file.
                sources.push(path.join(settings.NODE_DIR, sectionPlugin.name, 'src', 'components', '**', '*.vue'))
            }
        }

        return gulp.src(sources)
            .pipe(vueCompiler({
                commonjs: false,
                namespace: 'global.templates',
                pathfilter: ['src', 'components', 'node_modules'],
            }))
            .on('error', notify.onError('Error: <%= error.message %>'))
            .pipe(ifElse(settings.BUILD_OPTIMIZED, () => minifier()))
            .pipe(concat('templates.js'))
            .pipe(insert.prepend('global.templates={};'))
            .pipe(gulp.dest(path.join(settings.BUILD_DIR, 'js')))
            .pipe(size(_extend({title: 'templates'}, settings.SIZE_OPTIONS)))
    }

    return {tasks}
}
