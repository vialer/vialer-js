module.exports = (app) => {

    const components = {
        TextField: require('./components/text'),
        TextAreaField: require('./components/textarea'),
        PasswordField: require('./components/password'),
        CheckboxField: require('./components/checkbox'),
        SelectField: require('./components/select'),
        SelectSearchField: require('./components/select_search'),
    }

    Object.keys(components).map(function(name) {
        app.components[name] = Vue.component(name, components[name](app))
    });

}
