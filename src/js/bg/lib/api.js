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
        this.app.logger.debug(`${this}setup axios api client`)
        this.client.interceptors.response.use(function(response) {
            return response
        }, (err) => {
            // Catch Network Errors.
            if (err.message === 'Network Error') {
                this.app.logger.error('[bg] [api] network error')
                return Promise.reject({status: 'Network Error'})
            }
            // Reject all timeouts.
            if (!err.response) {
                this.app.logger.error('[bg] [api] timeout')
                return Promise.reject(err)
            }
            // Reject all status codes from 500 and up.
            if (!err.response || err.response.status >= 500) {
                this.app.logger.error(`[bg] [api] error: ${err.response.status}`)
                return Promise.reject(err)
            }

            this.app.logger.warn(`[bg] [api] non-ok status: ${err.response.status}`)
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
