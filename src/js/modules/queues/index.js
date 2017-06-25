'use strict'

const QueuesActions = require('./actions')


/**
 * The Queue widget.
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
            this.app.emit('widget.indicator.stop', {name: 'queues'})

            if (this.app.api.OK_STATUS.includes(res.status)) {
                // Find the id's for queuecallgroups.
                let queues = res.data.objects
                let widgetsData = this.app.store.get('widgets')
                this.queuecallgroups = []

                if (!queues.length) {
                    this.app.emit('queues.empty')
                } else {
                    queues.forEach((queue) => {
                        this.queuecallgroups.push(queue.id)
                    })

                    this.app.emit('queues.reset')
                    this.app.emit('queues.fill', {
                        queues: queues,
                        selectedQueue: this.app.store.get('widgets').queues.selected,
                    })

                    // Reset storage.
                    this.sizes = {}
                    queues.forEach((queue) => {
                        this.sizes[queue.id] = queue.queue_size
                    })
                }

                // Save queues, sizes and ids in storage.
                widgetsData.queues.list = queues
                widgetsData.queues.queuecallgroups = this.queuecallgroups
                widgetsData.queues.sizes = this.sizes
                widgetsData.queues.unauthorized = false
                this.app.store.set('widgets', widgetsData)
                this.setQueueSizesTimer()
            } else if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.logger.info(`${this}widget.unauthorized: queues`)
                // update authorization status
                let widgetsData = this.app.store.get('widgets')
                widgetsData.queues.unauthorized = true
                this.app.store.set('widgets', widgetsData)

                // display an icon explaining the user lacks permissions to use
                // this feature of the plugin
                this.app.emit('widget.unauthorized', {name: 'queues'})
            }
        })
    }


    _reset() {
        this.app.emit('queues.reset')
    }


    _restore() {
        this.app.logger.info(`${this}reloading widget queues`)

        // Check if unauthorized.
        let widgetsData = this.app.store.get('widgets')
        if (widgetsData.queues.unauthorized) {
            this.app.emit('widget.unauthorized', {name: 'queues'})
        } else {
            // Restore ids and sizes.
            this.queuecallgroups = widgetsData.queues.queuecallgroups
            this.sizes = widgetsData.queues.sizes

            // Restore queues list.
            let queues = widgetsData.queues.list
            if (queues && queues.length) {
                this.app.emit('queues.reset')
                this.app.emit('queues.fill', {
                    queues: queues,
                    selectedQueue: widgetsData.queues.selected,
                })
            } else {
                this.app.emit('queues.empty')
            }

            this.setQueueSizesTimer()
        }
    }


    getIconForSize(size) {
        let icon = '/img/queue.png'
        if (!isNaN(size)) {
            if (size < 10) {
                icon = '/img/queue' + size + '.png'
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
        if (!this.queuecallgroups.length) return

        Promise.all(this.queuecallgroups.map((id) => this.app.api.client.get(`api/queuecallgroup/${id}/`)))
        .then((results) => {
            this.app.logger.group('callgroup status update')
            for (const res of results) {
                if (this.app.api.OK_STATUS.includes(res.status)) {
                    let queue = res.data
                    // This may result in an empty queue when logging out.
                    if (!queue) return
                    this.app.logger.debug(`${this}updating queue callgroup status for group ${queue.id}`)

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
                    this.app.emit('queue.size', {id: queue.id, size: queue.queue_size})

                    // Save sizes in storage.
                    let widgetsData = this.app.store.get('widgets')
                    widgetsData.queues.sizes = this.sizes
                    this.app.store.set('widgets', widgetsData)
                } else if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                    this.app.logger.debug(`${this}unauthorized queues request`)
                    // Update authorization status.
                    let widgetsData = this.app.store.get('widgets')
                    widgetsData.queues.unauthorized = true
                    this.app.store.set('widgets', widgetsData)
                    // Display an icon explaining the user lacks permissions
                    // to use this feature of the plugin.
                    this.app.emit('widget.unauthorized', {name: 'queues'})
                }
            }
            this.app.logger.groupEnd()
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
                this.app.logger.info(`${this} main panel open; using smaller timeout for queues update`)
                if (this.app.store.get('widgets').isOpen.queues) {
                    timeout = 5000
                }
            }
        }

        this.app.logger.debug(`${this}timeout for queue.size event: ${timeout}`)
        return timeout
    }


    toString() {
        return `${this.app} [Queues]             `
    }
}

module.exports = QueuesModule
