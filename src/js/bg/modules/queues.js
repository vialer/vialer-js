/**
* VoIPGRID-platform specific functionality. This is especially useful
* to manage call queues/callgroups. It shows the available queues
* and how many callers are in the queue.
* @module ModuleQueues
*/
const Module = require('../lib/module')


/**
* Main entrypoint for Queues.
* @memberof AppBackground.modules
*/
class ModuleQueues extends Module {
    /**
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)

        this.app.timer.registerTimer('bg:queues:size', () => {this._platformData(false)})
        this.app.on('bg:queues:selected', ({queue}) => {
            this.app.setState({queues: {selected: {id: queue ? queue.id : null}}}, {persist: true})

            if (this.app.env.isExtension) {
                if (queue) this.app.setState({ui: {menubar: {default: this.queueMenubarIcon(queue.queue_size)}}})
                else this.app.setState({ui: {menubar: {default: 'active'}}})
            }
            this.setQueueSizesTimer()
        })
    }


    /**
    * Initializes the module's store.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return {
            queues: [],
            selected: {id: null},
            state: null,
        }
    }


    /**
    * Adjust the queue-size timer when the WebExtension
    * popup opens or closes.
    * @param {String} type - Whether the popup is set to `close` or `open`.`
    */
    _onPopupAction(type) {
        this.setQueueSizesTimer()
    }


    /**
    * Load information about queue callgroups from the
    * VoIPGRID platform.
    * @param {Boolean} empty - Whether to empty the queues list and set the state to `loading`.
    */
    async _platformData(empty = true) {
        // API retrieval possibility check is already performed at
        // the application level, but is also required here because
        // of the repeated timer function.
        if (!this.app.state.user.authenticated || !this.app.state.app.online) return
        if (empty) this.app.setState({queues: {queues: [], state: 'loading'}})

        const res = await this.app.api.client.get('api/queuecallgroup/')
        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            this.app.logger.warn(`${this}platform data request failed (${res.status})`)
            return
        }

        let queues = res.data.objects

        for (const queue of queues) {
            // The queue size from the API is a string.
            queue.queue_size = parseInt(queue.queue_size, 10)
            // Queue size is not available.
            if (isNaN(queue.queue_size)) queue.queue_size = '?'
            // Update icon for toolbarbutton if this queuecallgroup
            // was selected earlier.
            if (queue.id === this.app.state.queues.selected.id) {
                this.app.setState({ui: {menubar: {default: this.queueMenubarIcon(queue.queue_size)}}})
            }
        }

        this.app.setState({queues: {queues: queues, state: null}}, {persist: true})
        this.setQueueSizesTimer()
    }


    /**
    * Converts a queue size to a menubar icon state.
    * @param {String|Number} queueSize - The queue size as returned from the VoIPGRID API.
    * @returns {String} - The menubar state, which is linked to a .png filename.
    */
    queueMenubarIcon(queueSize) {
        let queueState = 'queue'
        if (!isNaN(queueSize)) {
            if (queueSize < 10) queueState = `queue-${queueSize}`
            else queueState = 'queue-10'
        }
        return queueState
    }


    /**
    * Register the queus update timer function and
    * the dynamic interval check.
    */
    setQueueSizesTimer() {
        // Set a dynamic timer interval.
        this.app.timer.setTimeout('bg:queues:size', () => {
            let timeout = 0
            // Only when authenticated.
            if (this.app.state.user.authenticated) {
                // Check every 20s when a queue is selected, no matter
                // if the popup is opened or closed.
                if (this.app.state.queues.selected.id) {
                    timeout = 20000
                    // Check more regularly when the popup is open and the
                    // queues widget is open.
                    if (this.app.state.ui.visible) timeout = 5000
                }
            }
            this.app.logger.debug(`${this}set queue timer to ${timeout} ms`)
            return timeout
        }, true)

        this.app.timer.startTimer('bg:queues:size')
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[queues] `
    }
}

module.exports = ModuleQueues
