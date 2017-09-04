/**
* @module Queues
*/
const Actions = require('../../lib/actions')


/**
* Actions for the Queue module.
*/
class QueuesActions extends Actions {

    toString() {
        return `${this.module}[actions] `
    }


    /**
    * Background script related events.
    */
    _background() {
        // Keep track of selected queue.
        this.app.on('queues:queue.select', (data) => {
            let widgetState = this.app.store.get('widgets')
            let id = data.id
            if (id) {
                let size = NaN
                if (this.module.sizes && this.module.sizes.hasOwnProperty(id)) {
                    size = this.module.sizes[id]
                }

                if (this.app.env.extension) {
                    this.app.browser.browserAction.setIcon({path: this.module.getIconForSize(size)})
                }
            } else {
                // Restore availability icon.
                if (widgetState.availability) {
                    if (this.app.env.extension) {
                        this.app.logger.info(`${this}set availability icon`)
                        this.app.browser.browserAction.setIcon({
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


    /**
     * Popup script related events.
     */
    _popup() {
        if (!('queue' in this.app.cache)) {
            this.app.cache.queue = {
                list: [],
                selected: null,
            }
        }

        this.app.on('queues:empty', (data) => {
            $('.queues .empty-list').removeClass('hide')
        })

        // Fill the queue list.
        this.app.on('queues:fill', (data) => {
            let queues = data.queues
            let selectedQueue = data.selectedQueue
            $('.queues .empty-list').addClass('hide')
            if (this.app.cache.queue.list === queues && this.app.cache.queue.selected === selectedQueue) {
                // No changes so exit early.
                this.app.logger.debug(`${this}no new queue data`)
                return
            }
            // Update cache.
            this.app.cache.queue.list = queues
            this.app.cache.queue.selected = selectedQueue

            // Clear list.
            let list = $('.queues .list')
            list.empty()

            // Fill list.
            let template = $('.queues .template .queue')
            $.each(queues, function(index, queue) {
                let listItem = template.clone()
                listItem.find('.indicator').text(queue.queue_size)
                listItem.find('.text').text(queue.description)
                listItem.find('.code').text('(' + queue.internal_number + ')')

                // Check if this queue is currently selected.
                if (selectedQueue && selectedQueue === queue.id) {
                    listItem.addClass('selected')
                }

                listItem.data('queue-id', queue.id)
                listItem.find('.indicator').attr('id', 'size' + queue.id)
                listItem.appendTo(list)
            })
        })

        this.app.on('queues:reset', (data) => {
            let list = $('.queues .list')
            list.empty()
            $('.queues .empty-list').addClass('hide')
        })

        // Update the size for a queue.
        this.app.on('queues:queue.size', (data) => {
            let id = data.id
            let size = data.size

            if (isNaN(size)) {
                // Queue size is not available.
                size = '?'
            }
            $(`#size${id}`).text(size)
        })

        /**
         * Select a queue.
         */
        $('.queues .list').on('click', '.queue', (e) => {
            let target = e.currentTarget
            let queueId = null
            if ($(target).data('queue-id')) {
                // Toggle selection.
                $(target).toggleClass('selected')
                $(target).siblings().removeClass('selected')

                if ($(target).hasClass('selected')) {
                    queueId = $(target).data('queue-id')
                }
            }

            this.app.cache.queue.selected = queueId
            this.app.emit('queues:queue.select', {id: queueId})
        })
    }
}

module.exports = QueuesActions
