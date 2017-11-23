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
        // User indicated that it wants to watch a queue.
        this.app.on('queues:queue.select', (data) => {
            let id = data.id
            let widgetState = this.app.store.get('widgets')

            if (id) {
                let size = NaN
                if (this.module.sizes && this.module.sizes.hasOwnProperty(id)) {
                    size = this.module.sizes[id]
                }

                if (this.app.env.extension) {
                    browser.browserAction.setIcon({path: this.module.getIconForSize(size)})
                }
            } else {
                // Restore availability icon.
                if (widgetState.availability) {
                    if (this.app.env.extension) {
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


    /**
    * Popup script related events.
    */
    _popup() {
        let _$ = {}
        _$.widget = $('.widget.queues')
        _$.list = _$.widget.find('.widget-item-list.list')
        _$.emptyList = _$.widget.find('.widget-item-list.empty')

        if (!('queue' in this.app.cache)) {
            this.app.cache.queue = {
                list: [],
                selected: null,
            }
        }

        this.app.on('queues:empty', (data) => {
            _$.emptyList.removeClass('hide')
        })

        // Fill the queue list with data from the background.
        this.app.on('queues:fill', (data) => {
            let queues = data.queues
            let selectedQueue = data.selectedQueue
            _$.emptyList.addClass('hide')

            if (this.app.cache.queue.list === queues && this.app.cache.queue.selected === selectedQueue) {
                // No changes so exit early.
                this.app.logger.debug(`${this}no new queue data`)
                return
            }
            // Update cache.
            this.app.cache.queue.list = queues
            this.app.cache.queue.selected = selectedQueue

            _$.list.empty()

            // Fill list.
            let template = _$.widget.find('template').contents()
            $.each(queues, function(index, queue) {
                let listItem = template.clone()
                listItem.find('.icon i').text(queue.queue_size)
                listItem.find('.name').text(queue.description)
                listItem.find('.description').text( queue.internal_number)

                // Check if this queue is currently selected.
                if (selectedQueue && selectedQueue === queue.id) {
                    listItem.addClass('selected')
                }

                listItem.data('queue-id', queue.id)
                listItem.find('.indicator').attr('id', 'size' + queue.id)
                listItem.appendTo(_$.list)
            })
        })

        this.app.on('queues:reset', (data) => {
            _$.list.empty()
            _$.emptyList.addClass('hide')
        })

        // Update the size of all passed queues.
        this.app.on('queues:update_size', (data) => {
            for (const queue of data.queues) {
                $(`#size${queue.id}`).text(queue.size)
            }
        })

        /**
        * Select a queue.
        */
        _$.list.on('click', '.queue', (e) => {
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
