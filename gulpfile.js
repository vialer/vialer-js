'use strict'

const extend = require('util')._extend
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
const ghPages = require('gulp-gh-pages')
const gulp = require('gulp-help')(require('gulp'), {})
const gutil = require('gulp-util')
const http = require('http')
const livereload = require('gulp-livereload')
const ifElse = require('gulp-if-else')
const mount = require('connect-mount')

const notify = require('gulp-notify')
const runSequence = require('run-sequence')
const sass = require('gulp-sass')
const serveIndex = require('serve-index')
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

const minifier = composer(uglifyEs, console)

let bundlers = {bg: null, popup: null, tab: null, callstatus: null}
let isWatching
let sizeOptions = {showTotal: true, showFiles: true}

if (PRODUCTION) gutil.log('(!) Gulp optimized for production')

/**
 * Generic browserify task used for multiple entrypoints.
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
        .pipe(gulp.dest('./build/js/'))
        .pipe(size(extend({title: `${name}.js`}, sizeOptions)))
    }
}

/**
 * Generic scss task used for multiple entrypoints.
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
        .pipe(ifElse(PRODUCTION, () => cleanCSS({advanced: true, level: 0})))
        .pipe(gulp.dest('./build/css'))
        .pipe(size(extend({title: `scss-${name}`}, sizeOptions)))
        .pipe(ifElse(isWatching, livereload))
    }
}


gulp.task('assets', 'Copy extension assets to the build directory.', () => {
    return gulp.src('./src/img/**', {base: './src'})
    .pipe(addsrc('./manifest.json'))
    .pipe(addsrc('./LICENSE'))
    .pipe(addsrc('./README.md'))
    .pipe(addsrc('./src/_locales/**', {base: './src/'}))
    .pipe(addsrc(path.join(NODE_PATH, 'font-awesome', 'fonts', '**'), {base: path.join(NODE_PATH, 'font-awesome')}))
    .pipe(addsrc(path.join(NODE_PATH, 'npm-font-open-sans', 'fonts', '**'), {base: path.join(NODE_PATH, 'npm-font-open-sans')}))
    .pipe(addsrc('./src/js/lib/thirdparty/**/*.js', {base: './src/'}))
    .pipe(addsrc('./src/html/*.html', {base: './src/html'}))
    .pipe(gulp.dest('./build/'))
    .pipe(size(extend({title: 'assets'}, sizeOptions)))
    .pipe(ifElse(isWatching, livereload))
})


gulp.task('build', 'Clears existing build and regenerate a new one.', (done) => {
    runSequence('build-clean', ['assets', 'docs', 'js-app', 'js-vendor', 'scss'], done)
})


gulp.task('build-clean', `Destroy build directory (${BUILD_DIR}).`, (done) => {
    del([path.join(BUILD_DIR, '**')], {
        force: true,
    }).then(() => done())
})


gulp.task('desktop', 'Copy desktop js to the root build dir.', () => {
    return gulp.src('./src/js/desktop.js', {base: './src/js/'})
    .pipe(gulp.dest('./build/'))
    .pipe(size(extend({title: 'desktop'}, sizeOptions)))
    .pipe(ifElse(isWatching, livereload))
})


gulp.task('docs', 'Generate documentation.', (done) => {
    let execCommand = `node ${NODE_PATH}/jsdoc/jsdoc.js ./src/js -R ./README.md -c ./.jsdoc.json -d ${BUILD_DIR}/docs`
    childExec(execCommand, undefined, (err, stdout, stderr) => {
        if (stderr) gutil.log(stderr)
        if (stdout) gutil.log(stdout)
        if (isWatching) livereload.changed()
        done()
    })
})


gulp.task('docs-deploy', 'Push the docs build directory to github pages.', function() {
    return gulp.src('./docs/build/**/*').pipe(ghPages())
})


gulp.task('js-app', 'Metatask that builds all JavaScript tasks.', [
    'js-bg',
    'js-callstatus',
    'js-observer',
    'js-options',
    'js-popup',
    'js-tab',
    'js-web',
], (done) => {
    if (isWatching) livereload.changed('web.js')
    done()
})

gulp.task('js-bg', 'Generate the extension background entry js.', jsEntry('bg'))
gulp.task('js-callstatus', 'Generate the callstatus entry js.', jsEntry('callstatus'))
gulp.task('js-observer', 'Generate the observer js.', jsEntry('observer'))
gulp.task('js-options', 'Generate the options js.', jsEntry('options'))
gulp.task('js-popup', 'Generate the popup/popout entry js.', jsEntry('popup'))
gulp.task('js-tab', 'Generate the tab contentscript entry js.', jsEntry('tab'))
gulp.task('js-vendor', 'Build vendor javascript.', jsEntry('vendor'))
gulp.task('js-web', 'Generate the web version entry js.', jsEntry('web'))

gulp.task('scss', 'Metatask that builds all scss.', [
    'scss-main',
    'scss-options',
    'scss-print',
])

gulp.task('scss-main', 'Compiles UI sass to css.', scssEntry('styles'))
gulp.task('scss-options', 'Compiles extension options sass to css.', scssEntry('options'))
gulp.task('scss-print', 'Compiles print sass to css.', scssEntry('print'))


gulp.task('watch', 'Start a development server and watch for changes.', () => {
    isWatching = true
    livereload.listen({silent: false})
    const app = connect()
    app.use(serveStatic(path.join(__dirname, 'build')))
    app.use('/', serveIndex('build/', {'icons': false}))
    app.use(mount('/docs', serveStatic(path.join(__dirname, 'docs', 'build'))))
    http.createServer(app).listen(8999)
    gulp.watch([
        path.join(__dirname, 'src', 'js', '**', '*.js'),
        `!${path.join(__dirname, 'src', 'js', 'lib', 'thirdparty', '**', '*.js')}`,
        `!${path.join(__dirname, 'src', 'js', 'desktop.js')}`,
        `!${path.join(__dirname, 'src', 'js', 'vendor.js')}`,
    ], () => {
        gulp.start('js-app')
        if (WITHDOCS) gulp.start('docs')
    })

    if (WITHDOCS) {
        gutil.log('Watching documentation')
        gulp.watch([
            path.join(__dirname, '.jsdoc.json'),
            path.join(__dirname, 'README.md'),
            path.join(__dirname, 'docs', 'manuals', '**', '*.md'),
        ], () => {
            gulp.start('docs')
        })
    }

    gulp.watch([
        path.join(__dirname, 'manifest.json'),
        path.join(__dirname, 'src', '_locales', '**', '*.json'),
        path.join(__dirname, 'src', 'html', '**', '*.html'),
        path.join(__dirname, 'src', 'js', 'lib', 'thirdparty', '**', '*.js'),
    ], ['assets'])

    gulp.watch(path.join(__dirname, 'src', 'js', 'desktop.js'), ['desktop'])
    gulp.watch(path.join(__dirname, 'src', 'js', 'vendor.js'), ['js-vendor'])

    gulp.watch([
        `!${path.join(__dirname, 'src', 'scss', 'options.scss')}`,
        path.join(__dirname, 'src', 'scss', '**', '*.scss'),
    ], ['scss-main', 'scss-print'])

    gulp.watch(path.join(__dirname, 'src', 'scss', 'options.scss'), ['scss-options'])
})


gulp.task('zip', 'Generate a ditributable extension zip file.', ['build'], function() {
    const manifest = require('./manifest')
    const distFileName = `${manifest.name.toLowerCase()}-v${manifest.version}.zip`
    // Build distributable extension.
    return gulp.src([
        './build/**',
    ], {base: './build'})
    .pipe(zip(distFileName))
    .pipe(gulp.dest('./'))
})
