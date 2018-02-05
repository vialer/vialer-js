/**
* @module Queues
*/
class QueuesModule {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.app.timer.registerTimer('bg:queues:size', this.getApiData.bind(this))

        this.app.on('bg:queues:selected', ({queue}) => {
            app.setState({queues: {selected: {id: queue ? queue.id : null}}}, {persist: true})

            if (this.app.env.isExtension) {
                if (queue) {
                    browser.browserAction.setIcon({path: this.getIconForSize(queue.queue_size)})
                } else {
                    browser.browserAction.setIcon({path: 'img/icon-menubar-active.png'})
                }
            }
        })
        // this.setQueueSizesTimer()
    }


    onPopupAction(type) {
        this.setQueueSizesTimer()
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
                if (this.app.state.queues.selected.id) timeout = 20000
                // Check more regularly when the popup is open and the
                // queues widget is open.
                if (this.app.state.ui.visible) timeout = 5000
            }
            this.app.logger.debug(`${this}set queue timer to ${timeout} ms`)
            return timeout
        }, true)

        this.app.timer.startTimer('bg:queues:size')
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
                if (queue.id === this.app.state.queues.selected.id) {
                    browser.browserAction.setIcon({path: this.getIconForSize(queue.queue_size)})
                }
            }
        }

        this.app.setState({queues: {queues: queues}})
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


    toString() {
        return `${this.app}[queues] `
    }
}

module.exports = QueuesModule
