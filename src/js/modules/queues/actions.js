'use strict'

const Actions = require('../../lib/actions')


/**
 * All UI related actions for the Queues.
 */
class QueuesActions extends Actions {

    popup() {
        if (!('queue' in window.cache)) {
            window.cache.queue = {
                'list': [],
                'selected': null,
            }
        }


        this.app.on('queues.reset', (data) => {
            let list = $('.queues .list')
            list.empty()
            $('.queues .empty-list').addClass('hide')
        })

        this.app.on('queues.empty', (data) => {
            $('.queues .empty-list').removeClass('hide')
        })

        // Fill the queue list.
        this.app.on('queues.fill', (data) => {
            let queues = data.queues
            let selectedQueue = data.selectedQueue
            $('.queues .empty-list').addClass('hide')
            if (window.cache.queue.list === queues && window.cache.queue.selected === selectedQueue) {
                // No changes so exit early.
                this.app.logger.debug(`${this}no new queue data`)
                return
            }
            // Update cache.
            window.cache.queue.list = queues
            window.cache.queue.selected = selectedQueue

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
                    listItem.addClass('selected');
                }

                listItem.data('queue-id', queue.id)
                listItem.find('.indicator').attr('id', 'size' + queue.id)
                listItem.appendTo(list)
            })
        })

        // Update the size for a queue.
        this.app.on('queue.size', (data) => {
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

            window.cache.queue.selected = queueId
            this.app.emit('queue.select', {id: queueId})
        })
    }


    toString() {
        return `${this.app} [QueuesActions]     `
    }

}

module.exports = QueuesActions
