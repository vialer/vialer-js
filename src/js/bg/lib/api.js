const axios = require('axios')


/**
* Responsible for setting up the [Axios](https://github.com/axios/axios)
* client for the API calls to the vendor backend.
*/
class Api {
    /**
    * @param {AppBackground} app - The background application object.
    */
    constructor(app) {
        this.app = app
        this.OK_STATUS = [200, 201, 202, 204]
        this.NOTOK_STATUS = [400, 401, 403, 404, 'Network Error']
        this.UNAUTHORIZED_STATUS = [401]
    }

    /**
    * Set a http client with or without basic authentication.
    * @param {String} email - User identifier to login with.
    * @param {String} token - The API token to login with.
    */
    setupClient(email, token) {
        let options = {
            baseURL: this.app.state.settings.platform.url,
            timeout: 15000,
        }

        if (email && token) {
            options.headers = {authorization: `Token ${email}:${token}`}
        }

        this.client = axios.create(options)
        this.app.logger.info(`${this}setup axios api client`)
        this.client.interceptors.response.use(function(response) {
            return response
        }, (err) => {
            // Catch Network Errors.
            if (err.message === 'Network Error') {
                return Promise.resolve({status: 'Network Error'})
            }
            // Reject all status codes from 500 and timeouts.
            if (!err.response || err.response.status >= 500) {
                return Promise.reject(err)
            }
            // All other error codes are part of the normal application flow.
            return Promise.resolve(err.response)
        })
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[api] `
    }
}

module.exports = Api
