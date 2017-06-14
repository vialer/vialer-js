'use strict';

const extend = require('util')._extend
const path = require('path')

const addsrc = require('gulp-add-src')
const argv = require('yargs').argv
const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const cleanCSS = require('gulp-clean-css')
const composer = require('gulp-uglify/composer')
const concat = require('gulp-concat')
const connect = require('connect')
const del = require('del')

const envify = require('gulp-envify')
const ghPages = require('gulp-gh-pages')
const gulp = require('gulp-help')(require('gulp'), {})
const gutil = require('gulp-util')
const http = require('http')
const livereload = require('gulp-livereload')
const ifElse = require('gulp-if-else')
const jsdoc = require('gulp-jsdoc3')
const mount = require('connect-mount')

const notify = require('gulp-notify')
const runSequence = require('run-sequence')
const sass = require('gulp-sass')
const serveStatic = require('serve-static')
const size = require('gulp-size')
const source = require('vinyl-source-stream')
const sourcemaps = require('gulp-sourcemaps')
const uglifyEs = require('uglify-es')
const watchify = require('watchify')
const zip = require('gulp-zip')

const BUILD_DIR = process.env.BUILD_DIR || path.join(__dirname, 'build')
const NODE_ENV = process.env.NODE_ENV || 'development'
const NODE_PATH = process.env.NODE_PATH || path.join(__dirname, 'node_modules')
const PRODUCTION = argv.production ? argv.production : (process.env.NODE_ENV === 'production')
const WITHDOCS = argv.docs ? argv.docs : false

const deployMode = argv.production ? argv.production : (process.env.NODE_ENV === 'production')
const minifier = composer(uglifyEs, console)

let bundlers = {bg: null, popup: null, tab: null, callstatus: null}
let isWatching
let sizeOptions = {showTotal: true, showFiles: true}

if (PRODUCTION) gutil.log('(!) Gulp optimized for production')


/**
 * Copies all required assets to the build directory.
 */
gulp.task('assets', 'Move assets to the build directory.', () => {
    return gulp.src('./src/img/**', {base: './src'})
    .pipe(addsrc('./src/fonts/**', {base: './src/'}))
    .pipe(addsrc('./src/js/lib/thirdparty/**/*.js', {base: './src/'}))
    .pipe(addsrc('./src/html/*.html', {base: './src/html'}))
    .pipe(addsrc('./src/js/lib/frame.js', {base: './src/'}))
    .pipe(gulp.dest('./build/'))
    .pipe(size(extend({title: 'assets'}, sizeOptions)))
    .pipe(ifElse(isWatching, livereload))
})


gulp.task('build', 'Metatask that runs all tasks.', (done) => {
    runSequence(
        'build-clean',
        ['js-click-to-dial-bg', 'js-click-to-dial-popup', 'js-click-to-dial-tab',
         'js-click-to-dial-callstatus', 'scss', 'scss-print', 'docs', 'assets']
    , done)
})


gulp.task('build-clean', `Delete build directory '${BUILD_DIR}'`, (done) => {
    del([path.join(BUILD_DIR, '**')], {
        force: true,
    }).then(() => done())
})


gulp.task('docs', 'Generate documentation.', (done) => {
    let completed = () => {
        if (isWatching) {
            livereload.changed('headless.js')
        }
    }

    let config = require('./.jsdoc.json')
    return gulp.src([
        'README.md',
        '!./src/js/lib/thirdparty/**/*.js',
        './src/js/**/*.js',
    ], {read: false})
    .pipe(jsdoc(config, completed))
})


/**
 * Update the hosted github pages from the current docs build directory.
 */
gulp.task('docs-deploy', function() {
    return gulp.src('./docs/build/**/*').pipe(ghPages())
})


gulp.task('js', 'Metatask that builds all JavaScript tasks.', [
    'js-click-to-dial-bg',
    'js-click-to-dial-popup',
    'js-click-to-dial-tab',
    'js-click-to-dial-callstatus',
])


/**
 * This is the main application. It runs in the background, but also
 * in the contentscript. Functionality of the main application is
 * determined with a `global.contentscript` flag.
 */
gulp.task('js-click-to-dial-bg', 'Process the main application Javascript.', (done) => {
    if (!bundlers.bg) {
        bundlers.bg = browserify({
            cache: {},
            debug: !PRODUCTION,
            entries: path.join(__dirname, 'src', 'js', 'click-to-dial-bg.js'),
            packageCache: {},
        })
        if (isWatching) bundlers.bg.plugin(watchify)
    }
    bundlers.bg.bundle()
    .on('error', notify.onError('Error: <%= error.message %>'))
    .on('end', () => {
        if (isWatching) livereload.changed('click-to-dial.js')
        done()
    })
    .pipe(source('click-to-dial-bg.js'))
    .pipe(buffer())
    .pipe(ifElse(!PRODUCTION, () => sourcemaps.init({loadMaps: true})))
    .pipe(envify({NODE_ENV: NODE_ENV}))
    .pipe(ifElse(PRODUCTION, () => minifier()))

    .pipe(ifElse(!PRODUCTION, () => sourcemaps.write('./')))
    .pipe(gulp.dest('./build/js/'))
    .pipe(size(extend({title: 'js-click-to-dial-bg'}, sizeOptions)))
})


/**
 * The contentscript is the part that's specific for the click-to-dial popup
 * in the extension. It sets some flags for the main application as well.
 */
gulp.task('js-click-to-dial-popup', 'Process contentscript-specific application Javascript.', (done) => {
    if (!bundlers.popup) {
        bundlers.popup = browserify({
            cache: {},
            debug: !PRODUCTION,
            entries: path.join(__dirname, 'src', 'js', 'click-to-dial-popup.js'),
            packageCache: {},
        })
        if (isWatching) bundlers.popup.plugin(watchify)
    }
    bundlers.popup.bundle()
    .on('error', notify.onError('Error: <%= error.message %>'))
    .on('end', () => {
        if (isWatching) livereload.changed('click-to-dial-popup.js')
        done()
    })
    .pipe(source('click-to-dial-popup.js'))
    .pipe(buffer())
    .pipe(ifElse(!PRODUCTION, () => sourcemaps.init({loadMaps: true})))
    .pipe(envify({NODE_ENV: NODE_ENV}))
    .pipe(ifElse(PRODUCTION, () => minifier()))
    .pipe(ifElse(!PRODUCTION, () => sourcemaps.write('./')))
    .pipe(gulp.dest('./build/js/'))
    .pipe(size(extend({title: 'js-click-to-dial-popup'}, sizeOptions)))
})


/**
 * This part runs in each browser tab.
 */
gulp.task('js-click-to-dial-tab', 'Process the click-to-dial icons in pages Javascript.', (done) => {
    if (!bundlers.tab) {
        bundlers.tab = browserify({
            cache: {},
            debug: !PRODUCTION,
            entries: path.join(__dirname, 'src', 'js', 'click-to-dial-tab.js'),
            packageCache: {},
        })
        if (isWatching) bundlers.tab.plugin(watchify)
    }
    bundlers.tab.bundle()
    .on('error', notify.onError('Error: <%= error.message %>'))
    .on('end', () => {
        if (isWatching) livereload.changed('click-to-dial-tab.js')
        done()
    })
    .pipe(source('click-to-dial-tab.js'))
    .pipe(buffer())
    .pipe(ifElse(!PRODUCTION, () => sourcemaps.init({loadMaps: true})))
    .pipe(envify({NODE_ENV: NODE_ENV}))
    .pipe(ifElse(PRODUCTION, () => minifier()))
    .pipe(ifElse(!PRODUCTION, () => sourcemaps.write('./')))
    .pipe(gulp.dest('./build/js/'))
    .pipe(size(extend({title: 'js-click-to-dial-tab'}, sizeOptions)))
})


/**
 * This part runs in each browser tab.
 */
gulp.task('js-click-to-dial-callstatus', 'Process the click-to-dial callstatus javascript.', (done) => {
    if (!bundlers.callstatus) {
        bundlers.callstatus = browserify({
            cache: {},
            debug: !PRODUCTION,
            entries: path.join(__dirname, 'src', 'js', 'click-to-dial-callstatus.js'),
            packageCache: {},
        })
        if (isWatching) bundlers.callstatus.plugin(watchify)
    }
    bundlers.callstatus.bundle()
    .on('error', notify.onError('Error: <%= error.message %>'))
    .on('end', () => {
        if (isWatching) livereload.changed('click-to-dial-callstatus.js')
        done()
    })
    .pipe(source('click-to-dial-callstatus.js'))
    .pipe(buffer())
    .pipe(ifElse(!PRODUCTION, () => sourcemaps.init({loadMaps: true})))
    .pipe(envify({NODE_ENV: NODE_ENV}))
    .pipe(ifElse(PRODUCTION, () => minifier()))
    .pipe(ifElse(!PRODUCTION, () => sourcemaps.write('./')))
    .pipe(gulp.dest('./build/js/'))
    .pipe(size(extend({title: 'js-click-to-dial-callstatus'}, sizeOptions)))
})



/**
 * Generate one css file out of all app styles.scss files and it's imports.
 */
gulp.task('scss', 'Find all scss files from the apps directory, concat them and save as one css file.', () => {
    return gulp.src('./src/scss/styles.scss')
    .pipe(sass({
        includePaths: NODE_PATH,
        sourceMap: !PRODUCTION,
        sourceMapContents: !PRODUCTION,
        sourceMapEmbed: !PRODUCTION,
    }))
    .on('error', notify.onError('Error: <%= error.message %>'))
    .pipe(concat('styles.css'))
    .pipe(ifElse(PRODUCTION, () => cleanCSS({advanced: true, level: 0})))
    .pipe(gulp.dest('./build/css'))
    .pipe(size(extend({title: 'scss'}, sizeOptions)))
    .pipe(ifElse(isWatching, livereload))
})


/**
 * Generate one css file out of all app styles.scss files and it's imports.
 */
gulp.task('scss-print', 'Compiles print sass to css.', () => {
    return gulp.src('./src/scss/print.scss')
    .pipe(sass({
        includePaths: NODE_PATH,
        sourceMap: !PRODUCTION,
        sourceMapContents: !PRODUCTION,
        sourceMapEmbed: !PRODUCTION,
    }))
    .on('error', notify.onError('Error: <%= error.message %>'))
    .pipe(concat('print.css'))
    .pipe(ifElse(deployMode, () => cleanCSS({
        advanced: true,
    })))
    .pipe(gulp.dest('./build/css'))
    .pipe(size(extend({title: 'scss-print'}, sizeOptions)))
    .pipe(ifElse(isWatching, livereload))
})



//build ditributable and sourcemaps after other tasks completed
gulp.task('zip', ['build'], function() {
    const manifest = require('./manifest')
    const distFileName = `${manifest.name.toLowerCase()}-v${manifest.version}.zip`
    // Build distributable extension.
    return gulp.src([
        'LICENSE',
        'README.md',
        './build/**',
        './chrome/**',
        './_locales/**',
    ], {base: './'})
    .pipe(addsrc('./manifest.json'))
    .pipe(zip(distFileName))
    .pipe(gulp.dest('./'))
});


gulp.task('watch', 'Start a development server and watch for changes.', () => {
    isWatching = true
    livereload.listen({silent: false})
    const app = connect()
    app.use(serveStatic(path.join(__dirname, 'build')))
    app.use(mount('/docs', serveStatic(path.join(__dirname, 'docs', 'build'))))
    http.createServer(app).listen(8999)

    gulp.watch(path.join(__dirname, 'src', 'js', '**', '*.js'), () => {
        gulp.start('js-click-to-dial-bg')
        gulp.start('js-click-to-dial-popup')
        gulp.start('js-click-to-dial-tab')
        gulp.start('js-click-to-dial-callstatus')
        if (WITHDOCS) gulp.start('docs')
    })

    if (WITHDOCS) {
        gutil.log('Watching documentation')
        gutil.log('Watching documentation')
        gulp.watch([
            path.join(__dirname, '.jsdoc.json'),
            path.join(__dirname, 'README.md'),
            path.join(__dirname, 'docs', 'manuals', '**', '*.md'),
        ], () => {
            gulp.start('docs')
        })
    }

    gulp.watch(path.join(__dirname, 'src', 'html', '**', '*.html'), ['assets'])
    gulp.watch(path.join(__dirname, 'src', 'scss', '**', '*.scss'), ['scss', 'scss-print'])
})
