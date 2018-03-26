/**
* Generic util methods for the App namespace.
* @memberof App
*/
class Utils {
    /**
    * Clear a phonenumber from special characters like `+`, `*` and `*`.
    * @param {String} number - Number to clean.
    * @returns {String} - The cleaned number.
    */
    sanitizeNumber(number) {
        number = String(number).replace('+', '00')
        number = number.replace(/[^\d|!*|!#]/g, '')
        return number
    }

    /**
    * Convert a simple key/value object to a querystring.
    * @param {Object} params - Key/value object to convert.
    * @returns {String} - The querystring.
    * @example
    * stringifySearch({page: "1"})
    * // page=1
    */
    stringifySearch(params) {
        return Object
            .keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&')
    }
}


module.exports = Utils
