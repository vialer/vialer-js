module.exports = {
    /**
    * Make an object from location.search.
    * @param {String} query -Querystring, generally `location.search`.
    * @returns {Object} - Key/value of the parsed search string.
    * @example
    * location.search
    * // ?page=1
    * parseSearch(location.search)
    * // {page: "1"}
    */
    parseSearch(query) {
        let e, k, v
        let re = /([^&=]+)=?([^&]*)/g
        let decode = function(str) {
            return decodeURIComponent(str.replace(/\+/g, ' '))
        }
        let params = {}


        if (query) {
            if (query.substr(0, 1) === '?') {
                query = query.substr(1)
            }

            while ((e = re.exec(query))) {
                k = decode(e[1])
                v = decode(e[2])
                if (params[k] !== undefined) {
                    if (!$.isArray(params[k])) {
                        params[k] = [params[k]]
                    }
                    params[k].push(v)
                } else {
                    params[k] = v
                }
            }
        }
        return params
    },


    /**
    * Process number to return a callable phone number.
    * @param {String} number - Number to clean.
    * @returns {String} - The cleaned number.
    */
    sanitizeNumber(number) {
        // Force possible int to string.
        number = '' + number
        // Remove white space characters.
        number = number.replace(/ /g, '')

        // Make numbers like +31(0) work.
        let digitsOnly = number.replace(/[^\d]/g, '')
        if (digitsOnly.substring(0, 3) === '310') {
            if (number.substring(3, 6) === '(0)') {
                number = number.replace(/^\+31\(0\)/, '+31')
            }
        }

        return number
    },

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
    },
}
