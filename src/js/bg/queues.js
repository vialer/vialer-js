/**
* @module Queues
*/
class QueuesModule {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.hasUI = true
        this.app.modules.queues = this

        this.addListeners()
    }


    async getApiData() {
        const res = await this.app.api.client.get('api/queuecallgroup/')
        let queues = res.data.objects

        for (const queue of queues) {
            // The queue size from the API is a string.
            queue.queue_size = parseInt(queue.queue_size, 10)
            // Queue size is not available.
            if (isNaN(queue.queue_size)) queue.queue_size = '?'

            // Update icon for toolbarbutton if this queuecallgroup
            // was selected earlier.
            if (this.app.env.isExtension) {
                if (queue.id === this.app.state.queues.selected.queues.selected.id) {
                    browser.browserAction.setIcon({path: this.getIconForSize(queue.queue_size)})
                }
            }
        }

        this.app.emit('queues:update_size', {queues: queues})
        // Pass the queues to the popup and update the queues ui list.
        this.app.emit('queues:fill', {
            queues: queues,
            //selectedQueue: this.app.store.get('widgets').queues.selected,
        })

        let widgetState = this.app.store.get('widgets')
        // Save queues, sizes and ids in storage.
        widgetState.queues.list = queues
        widgetState.queues.sizes = this.sizes
        widgetState.queues.unauthorized = false
        this.app.store.set('widgets', widgetState)
    }


    addListeners() {
        // User indicated that it wants to watch a queue.
        this.app.on('queues:queue.select', (data) => {
            let id = data.id
            let widgetState = this.app.store.get('widgets')

            if (id) {
                let size = NaN
                if (this.sizes && this.sizes.hasOwnProperty(id)) {
                    size = this.sizes[id]
                }

                if (this.app.env.isExtension) {
                    browser.browserAction.setIcon({path: this.getIconForSize(size)})
                }
            } else {
                // Restore availability icon.
                if (widgetState.availability) {
                    if (this.app.env.isExtension) {
                        this.app.logger.info(`${this}set availability icon`)
                        browser.browserAction.setIcon({
                            path: this.app.store.get('widgets').availability.icon,
                        })
                    }
                }
            }

            // Save selected queue id in storage.
            widgetState.queues.selected = id
            this.app.store.set('widgets', widgetState)
            this.app.timer.update('queue.size')
        })
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
                // TODO: FIX THIS
                // if (this.app.store.get('widgets').queues.selected) timeout = 20000

                // Check more regularly when the popup is open and the
                // queues widget is open.
                if (this.app.store.get('isMainPanelOpen') && this.app.state.queues.widget.active) timeout = 5000
                this.app.logger.info(`${this}set queue timer timeout to ${timeout}`)
            }

            return timeout
        }, true)

        this.app.timer.startTimer('queue.size')
    }


    toString() {
        return `${this.app}[queues] `
    }
}

module.exports = QueuesModule
