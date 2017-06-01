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

        // Keep track of selected queue.
        this.app.on('queue.select', (data) => {
            let widgetsData = this.app.store.get('widgets')
            let id = data.id
            if (id) {
                let size = NaN
                if (this.sizes && this.sizes.hasOwnProperty(id)) {
                    size = this.sizes[id]
                }
                this.app.browser.browserAction.setIcon({path: this.getIconForSize(size)})
            } else {
                // Restore availability icon.
                if (widgetsData.availability) {
                    this.app.logger.info(`${this}set availability icon`)
                    this.app.browser.browserAction.setIcon({path: this.app.store.get('widgets').availability.icon})
                }
            }

            // Save selected queue id in storage.
            widgetsData.queues.selected = id
            this.app.store.set('widgets', widgetsData)
            this.app.timer.update('queue.size')
        })
    }


    load() {
        this.app.api.asyncRequest(this.app.api.getUrl('queuecallgroup'), null, 'get', {
            onComplete: () => {
                this.app.emit('widget.indicator.stop', {name: 'queues'})
            },
            onOk: (response) => {
                // Find the id's for queuecallgroups.
                let queues = response.objects

                let widgetsData = this.app.store.get('widgets')
                if (queues.length) {
                    this.queuecallgroups = []

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
                } else {
                    this.app.emit('queues.empty')
                }

                // Save queues, sizes and ids in storage.
                widgetsData.queues.list = queues
                widgetsData.queues.queuecallgroups = this.queuecallgroups
                widgetsData.queues.sizes = this.sizes
                widgetsData.queues.unauthorized = false
                this.app.store.set('widgets', widgetsData)

                this.setQueueSizesTimer()
            },
            onUnauthorized: () => {
                this.app.logger.info(`${this}widget.unauthorized: queues`)

                // update authorization status
                let widgetsData = this.app.store.get('widgets')
                widgetsData.queues.unauthorized = true
                this.app.store.set('widgets', widgetsData)

                // display an icon explaining the user lacks permissions to use
                // this feature of the plugin
                this.app.emit('widget.unauthorized', {name: 'queues'})
            },
        })
    }


    reset() {
        this.app.emit('queues.reset')
    }


    restore() {
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
        let icon = '/build/img/queue.png'
        if (!isNaN(size)) {
            if (size < 10) {
                icon = '/build/img/queue' + size + '.png'
            } else {
                icon = '/build/img/queue10.png'
            }
        }
        return icon
    }


    setQueueSizesTimer() {
        this.app.timer.registerTimer('queue.size', this.timerFunction.bind(this))
        this.app.timer.setTimeout('queue.size', this.timerTimeout.bind(this), true)
        this.app.timer.startTimer('queue.size')
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


    timerFunction() {
        if (this.queuecallgroups.length) {
            this.queuecallgroups.forEach((id) => {
                // FIXME: The current limitation on the server of 20r/m will always reject some
                // requests (status 503) in case of more than one queuecallgroup.
                this.app.api.asyncRequest(this.app.api.getUrl('queuecallgroup') + id + '/', null, 'get', {
                    onOk: (response) => {
                        let size = parseInt(response.queue_size, 10)
                        if (isNaN(size)) {
                            // Queue size is not available.
                            size = '?'
                        }

                        // Update icon for toolbarbutton if this queuecallgroup was selected earlier.
                        if (response.id === this.app.store.get('widgets').queues.selected) {
                            this.app.browser.browserAction.setIcon({path: this.getIconForSize(size)})
                        }

                        this.sizes[response.id] = size
                        this.app.emit('queue.size', {id: response.id, size: size})

                        // Save sizes in storage.
                        let widgetsData = this.app.store.get('widgets')
                        widgetsData.queues.sizes = this.sizes
                        this.app.store.set('widgets', widgetsData)
                    },
                    onUnauthorized: () => {
                        this.app.logger.debug(`${this}unauthorized queues request`)
                        // Update authorization status.
                        let widgetsData = this.app.store.get('widgets')
                        widgetsData.queues.unauthorized = true
                        this.app.store.set('widgets', widgetsData)

                        // Display an icon explaining the user lacks permissions
                        // to use this feature of the plugin.
                        this.app.emit('widget.unauthorized', {name: 'queues'})
                    },
                })
            })
        }
    }


    toString() {
        return `${this.app} [Queues]             `
    }
}

module.exports = QueuesModule
