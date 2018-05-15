function filters(app) {
    Vue.filter('fuzzydate', function(value) {
        var delta = Math.round((+new Date() - value) / 1000)
        let minute = 60
        let hour = minute * 60
        let day = hour * 24

        let fuzzy

        if (delta < 30) {
            fuzzy = app.$t('just then')
        } else if (delta < minute) {
            fuzzy = `${delta} ${app.$t('seconds ago')}`
        } else if (delta < 2 * minute) {
            fuzzy = app.$t('a minute ago')
        } else if (delta < hour) {
            fuzzy = `${Math.floor(delta / minute)} ${app.$t('minutes ago')}`
        } else if (Math.floor(delta / hour) === 1) {
            fuzzy = app.$t('an hour ago')
        } else if (delta < day) {
            fuzzy = `${Math.floor(delta / hour)} ${app.$t('hours ago')}`
        } else if (delta < day * 2) {
            fuzzy = app.$t('yesterday')
        }
        if (!fuzzy) return new Date(value).toLocaleString()
        else return fuzzy.capitalize()
    })
}

module.exports = filters
