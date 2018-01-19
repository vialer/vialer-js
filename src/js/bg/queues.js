/**
* @module Queues
*/
class QueuesModule {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
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
                // if (queue.id === this.app.state.queues.selected.queues.selected.id) {
                //     browser.browserAction.setIcon({path: this.getIconForSize(queue.queue_size)})
                // }
            }
        }

        this.app.setState({queues: {queues: queues}})
    }


    toString() {
        return `${this.app}[queues] `
    }
}

module.exports = QueuesModule
