/**
* @module Queues
*/
const QueuesActions = require('./actions')


/**
* The Queues module.
*/
class QueuesModule {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.hasUI = true
        this.app.modules.queues = this
        this.sizes = {}

        this.actions = new QueuesActions(app, this)
    }


    getIconForSize(size) {
        let icon = '/img/icon-queue.png'
        if (!isNaN(size)) {
            if (size < 10) {
                icon = `/img/icon-queue-${size}.png`
            } else {
                icon = '/img/icon-queue-10.png'
            }
        }
        return icon
    }


    /**
    * Register the queus update timer function and
    * the dynamic interval check.
    */
    setQueueSizesTimer() {
        // Register the timer function.
        this.app.timer.registerTimer('queue.size', this.updateQueues.bind(this))

        // Set a dynamic timer interval.
        this.app.timer.setTimeout('queue.size', () => {
            let timeout = 0

            // Only when authenticated.
            if (this.app.store.get('user')) {
                // Check every 20s when a queue is selected, no matter
                // if the popup is opened or closed.
                if (this.app.store.get('widgets').queues.selected) timeout = 20000

                // Check more regularly when the popup is open and the
                // queues widget is open.
                if (this.app.store.get('isMainPanelOpen') && this.app.store.get('widgets').isOpen.queues) timeout = 5000
                this.app.logger.info(`${this}set queue timer timeout to ${timeout}`)
            }

            return timeout
        }, true)

        this.app.timer.startTimer('queue.size')
    }


    toString() {
        return `${this.app}[queues] `
    }


    /**
    * Retrieve fresh queue statistics from the API.
    */
    async updateQueues() {
        // A user may have been logged out, while this function may
        // still be running on the background.
        if (!this.app.store.get('user')) return

        this.app.logger.info(`${this}updating queue info from api`)
        // Suppress a timeout exception to keep the interval check alive
        // after a timeout.
        let res
        try {
            res = await this.app.api.client.get('api/queuecallgroup/')
        } catch (e) {
            return
        }

        if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
            this.app.logger.debug(`${this}unauthorized queues request`)
            // Update authorization status.
            let widgetState = this.app.store.get('widgets')
            widgetState.queues.unauthorized = true
            this.app.store.set('widgets', widgetState)
            // Display an icon explaining the user lacks permissions
            // to use this feature of the plugin.
            this.app.emit('ui:widget.unauthorized', {name: 'queues'})
        }

        let queues = res.data.objects
        if (!queues.length) this.app.emit('queues:empty')

        for (const queue of queues) {
            // The queue size from the API is a string.
            queue.queue_size = parseInt(queue.queue_size, 10)
            // Queue size is not available.
            if (isNaN(queue.queue_size)) queue.queue_size = '?'

            // Update icon for toolbarbutton if this queuecallgroup
            // was selected earlier.
            if (this.app.env.extension) {
                if (queue.id === this.app.store.get('widgets').queues.selected) {
                    this.app.browser.browserAction.setIcon({path: this.getIconForSize(queue.queue_size)})
                }
            }

            this.sizes[queue.id] = queue.queue_size
            // Save sizes in storage.
            let widgetState = this.app.store.get('widgets')
            widgetState.queues.sizes = this.sizes
            this.app.store.set('widgets', widgetState)
        }

        this.app.emit('queues:update_size', {queues: queues})
        // Pass the queues to the popup and update the queues ui list.
        this.app.emit('queues:fill', {
            queues: queues,
            selectedQueue: this.app.store.get('widgets').queues.selected,
        })

        let widgetState = this.app.store.get('widgets')
        // Save queues, sizes and ids in storage.
        widgetState.queues.list = queues
        widgetState.queues.sizes = this.sizes
        widgetState.queues.unauthorized = false
        this.app.store.set('widgets', widgetState)
    }


    _load() {
        if (this.app.env.extension && !this.app.env.extension.background) return
        this.app.emit('ui:widget.reset', {name: 'queues'})
        // Start with showing an empty queue list.
        this.app.emit('queues:empty')
        this.updateQueues()
        this.setQueueSizesTimer()
    }


    _reset() {
        this.app.emit('queues:reset')
    }


    _restore() {
        this.app.logger.info(`${this}reloading widget queues`)
        // Restore the queue from localstorage.
        let widgetState = this.app.store.get('widgets')
        this.sizes = {}

        if (!Object.keys(widgetState.queues).length) {
            // No widget state. Empty the list.
            this.app.emit('queues:empty')
        } else if (widgetState.queues.unauthorized) {
            this.app.emit('ui:widget.unauthorized', {name: 'queues'})
        } else {
            // Start with a queue state from localstorage.
            this.sizes = widgetState.queues.sizes

            let queues = widgetState.queues.list
            if (queues && queues.length) {
                this.app.emit('queues:fill', {
                    queues: queues,
                    selectedQueue: widgetState.queues.selected,
                })
            } else {
                // No queues in localstore. Empty the list.
                this.app.emit('queues:empty')
            }
        }

        this.setQueueSizesTimer()
    }
}

module.exports = QueuesModule
