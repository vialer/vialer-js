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
        this.app.modules.queues = this
        this.sizes = {}
        this.queuecallgroups = []

        this.actions = new QueuesActions(app, this)
    }


    _load() {
        if (this.app.env.extension && !this.app.env.extension.background) return

        this.app.api.client.get('api/queuecallgroup').then((res) => {
            this.app.emit('ui:widget.reset', {name: 'queues'})

            if (this.app.api.OK_STATUS.includes(res.status)) {
                // Find the id's for queuecallgroups.
                let queues = res.data.objects
                this.queuecallgroups = []

                if (!queues.length) {
                    this.app.emit('queues:empty')
                } else {
                    queues.forEach((queue) => {
                        this.queuecallgroups.push(queue.id)
                    })

                    this.app.emit('queues:reset')
                    this.app.emit('queues:fill', {
                        queues: queues,
                        selectedQueue: this.app.store.get('widgets').queues.selected,
                    })

                    // Reset storage.
                    this.sizes = {}
                    queues.forEach((queue) => {
                        this.sizes[queue.id] = queue.queue_size
                    })
                }

                let widgetState = this.app.store.get('widgets')
                // Save queues, sizes and ids in storage.
                widgetState.queues.list = queues
                widgetState.queues.queuecallgroups = this.queuecallgroups
                widgetState.queues.sizes = this.sizes
                widgetState.queues.unauthorized = false
                this.app.store.set('widgets', widgetState)
                this.setQueueSizesTimer()
            } else if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.logger.info(`${this}ui:widget.unauthorized: queues`)
                // update authorization status
                let widgetState = this.app.store.get('widgets')
                widgetState.queues.unauthorized = true
                this.app.store.set('widgets', widgetState)

                // display an icon explaining the user lacks permissions to use
                // this feature of the plugin
                this.app.emit('ui:widget.unauthorized', {name: 'queues'})
            }
        })
    }


    _reset() {
        this.app.emit('queues:reset')
    }


    _restore() {
        this.app.logger.info(`${this}reloading widget queues`)

        // Check if unauthorized.
        let widgetState = this.app.store.get('widgets')
        if (widgetState.queues.unauthorized) {
            this.app.emit('ui:widget.unauthorized', {name: 'queues'})
        } else {
            // Restore ids and sizes.
            this.queuecallgroups = widgetState.queues.queuecallgroups
            this.sizes = widgetState.queues.sizes

            // Restore queues list.
            let queues = widgetState.queues.list
            if (queues && queues.length) {
                this.app.emit('queues:reset')
                this.app.emit('queues:fill', {
                    queues: queues,
                    selectedQueue: widgetState.queues.selected,
                })
            } else {
                this.app.emit('queues:empty')
            }

            this.setQueueSizesTimer()
        }
    }


    getIconForSize(size) {
        let icon = '/img/queue.png'
        if (!isNaN(size)) {
            if (size < 10) {
                icon = `/img/queue${size}.png`
            } else {
                icon = '/img/queue10.png'
            }
        }
        return icon
    }


    setQueueSizesTimer() {
        this.app.timer.registerTimer('queue.size', this.timerFunction.bind(this))
        this.app.timer.setTimeout('queue.size', this.timerTimeout.bind(this), true)
        this.app.timer.startTimer('queue.size')
    }


    timerFunction() {
        if (!this.queuecallgroups.length) {
            this.app.logger.warn(`${this}no queue callgroup found`)
            return
        }

        Promise.all(this.queuecallgroups.map((id) => this.app.api.client.get(`api/queuecallgroup/${id}/`)))
        .then((results) => {
            for (const res of results) {
                if (this.app.api.OK_STATUS.includes(res.status)) {
                    let queue = res.data
                    // This may result in an empty queue when logging out.
                    if (!queue) return

                    queue.queue_size = parseInt(res.data.queue_size, 10)
                    // Queue size is not available.
                    if (isNaN(queue.queue_size)) queue.queue_size = '?'

                    // Update icon for toolbarbutton if this queuecallgroup was selected earlier.
                    if (this.app.env.extension) {
                        if (queue.id === this.app.store.get('widgets').queues.selected) {
                            this.app.browser.browserAction.setIcon({path: this.getIconForSize(queue.queue_size)})
                        }
                    }

                    this.sizes[queue.id] = queue.queue_size
                    this.app.emit('queues:queue.size', {id: queue.id, size: queue.queue_size})

                    // Save sizes in storage.
                    let widgetState = this.app.store.get('widgets')
                    widgetState.queues.sizes = this.sizes
                    this.app.store.set('widgets', widgetState)
                } else if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                    this.app.logger.debug(`${this}unauthorized queues request`)
                    // Update authorization status.
                    let widgetState = this.app.store.get('widgets')
                    widgetState.queues.unauthorized = true
                    this.app.store.set('widgets', widgetState)
                    // Display an icon explaining the user lacks permissions
                    // to use this feature of the plugin.
                    this.app.emit('ui:widget.unauthorized', {name: 'queues'})
                }
            }
        })
    }


    /**
     * Check for queue sizes on a variable timeout.
     */
    timerTimeout() {
        let timeout = 0
        // Only when authenticated.
        if (this.app.store.get('user')) {
            // at least every 20s when a queue is selected
            if (this.app.store.get('widgets').queues.selected) {
                timeout = 20000
            }

            // quicker if the panel is visible and the queues widget is open
            if (this.app.store.get('isMainPanelOpen')) {
                if (this.app.store.get('widgets').isOpen.queues) {
                    timeout = 5000
                }
            }
        }

        return timeout
    }


    toString() {
        return `${this.app}[queues] `
    }
}

module.exports = QueuesModule
