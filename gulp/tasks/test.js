const path = require('path')

const eslint = require('gulp-eslint')
const filter = require('gulp-filter')
const gulp = require('gulp')
const stylelint = require('gulp-stylelint')
const tape = require('gulp-tape')
const tapSpec = require('tap-spec')
const through = require('through2')
const PluginError = require('plugin-error')

const map = require('map-stream')

let helpers = {}
let tasks = {}


module.exports = function(settings) {
    /**
     * Scans JSON files for secrets that should not be committed.
     * @returns {Function} - Function to put in a gulp `pipe`.
     */
    helpers.protectSecrets = function() {
        const protectedKeys = [
            'apiKey',
            'apiSecret',
            'clientSecret',
            'refreshToken',
            'username',
            'password',
        ]

        function scanForProtectedKeys(file, obj, attrPath) {
            let count = 0
            Object.entries(obj).forEach(([key, value]) => {
                if (protectedKeys.includes(key) && value) {
                    const attr = [...attrPath, key].join('.')
                    console.log(`Secret leaking: ${file.path} in attr ${attr}`)
                    count++
                } else if (Array.isArray(value)) {
                    value.map(([index, subvalue]) => {
                        count += scanForProtectedKeys(file, subvalue, [...attrPath, key, index])
                    })
                } else if (value !== null && (typeof value) === 'object') {
                    count += scanForProtectedKeys(file, value, [...attrPath, key])
                }
            })

            return count
        }

        return map(function(file, done) {
            let obj = JSON.parse(file.contents.toString())
            if (scanForProtectedKeys(file, obj, [])) {
                throw new PluginError({
                    message: 'Secrets are leaking.',
                    plugin: 'protect-secrets',
                })
            }

            done(null, file)
        })
    }


    /**
     * Run several functional tests using Puppeteer.
     * @param {Function} done Gulp task callback.
     * @returns {Stream} A Gulp stream.
     */
    tasks.browser = function testBrowser(done) {
        // Force the build target.
        const misc = require('./misc')(settings)
        misc.helpers.serveHttp({reload: false})

        const reporter = through.obj()
        reporter.pipe(tapSpec()).pipe(process.stdout)
        return gulp.src('test/browser/**/index.js')
            .pipe(tape({bail: true, outputStream: reporter}))
            .on('error', () => {process.exit(1)})
            .on('end', () => {
                misc.helpers.server.close()
                done()
            })
    }


    /**
     * Lints for code consistency using .eslintrc,
     * styling consistency using .stylelintrc and
     * protects against leaking secrets.
     * @param {Function} done Gulp task callback.
     * @returns {Stream} A Gulp stream.
     */
    tasks.lint = function testLint(done) {
        const jsFilter = filter('**/*.js', {restore: true})
        const scssFilter = filter('**/*.scss', {restore: true})
        const secretsFilter = filter('**/.vialer-jsrc*', {restore: true})

        return gulp.src([
            'gulpfile.js',
            'src/**/*.js',
            'test/**/*.js',
            'tools/**/*.js',
            path.join(settings.SRC_DIR, '**', '*.scss'),
            '.vialer-jsrc*',
        ])
            .pipe(jsFilter)
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.failAfterError())
            .pipe(jsFilter.restore)

            .pipe(scssFilter)
            .pipe(stylelint({
                reporters: [{
                    console: true,
                    formatter: 'string',
                }],
            }))
            .pipe(scssFilter.restore)

            .pipe(secretsFilter)
            .pipe(helpers.protectSecrets())
            .pipe(secretsFilter.restore)
    }


    tasks.unit = function testUnit(done) {
        const misc = require('./misc')(settings)
        const reporter = through.obj()
        reporter.pipe(tapSpec()).pipe(process.stdout)

        return gulp.src('test/bg/**/*.js')
            .pipe(tape({bail: false, outputStream: reporter}))
            .on('error', () => {
                if (!settings.LIVERELOAD) process.exit(1)
            })
            .on('end', () => {
                if (!settings.LIVERELOAD) {
                    if (misc.helpers.server) misc.helpers.server.close()
                    done()
                }
            })
    }

    return {helpers, tasks}
}

