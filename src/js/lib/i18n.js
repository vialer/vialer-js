/**
* Process all translations from Vialer-js and its modules.
* The i18n parts of the modules are already included in
* `app_i18n_plugins.js`. All this class does is to use
* the browserify included `require` to lookup the modules
* and include the translations to the main file.
*/
class I18n {

    constructor(app) {
        this.app = app
        this.translations = {}
    }


    /**
    * Load translations from a set of plugins. The translations
    * are expected to be packaged in `app_i18n_plugins.js`.
    * @param {Object} plugins - References plugins to load i18n data for.
    */
    loadPluginsI18n(plugins) {
        for (const builtinPlugin of plugins.builtin) {
            if (builtinPlugin.i18n) {
                builtinPlugin.i18n.forEach((i) => {
                    this.app.__mergeDeep(this.translations, require(`${i}/src/js/i18n`))
                })
            }

            if (builtinPlugin.addons && builtinPlugin.addons.i18n) {
                builtinPlugin.addons.i18n.forEach((i) => {
                    this.app.__mergeDeep(this.translations, require(`${i}/src/js/i18n`))
                })
            }
        }

        for (const name of Object.keys(plugins.custom)) {
            if (plugins.custom[name].parts.includes('i18n')) {
                this.app.__mergeDeep(this.translations, require(`${plugins.custom[name].name}/src/js/i18n`))
            }
        }
    }
}

module.exports = I18n
