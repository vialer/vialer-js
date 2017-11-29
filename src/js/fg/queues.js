/**
* @module Queues
*/
class QueuesModule {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app

        // Fill the queue list with data from the background.
        this.app.on('queues:fill', (data) => {
            Object.assign(this.app.state.queues, {
                queues: data.queues,
                selectedQueue: data.selectedQueue,
            })
        })

        // Update the size of all passed queues.
        this.app.on('queues:update_size', (data) => {
            this.app.state.queues.queues = data.queues
        })
    }
}

module.exports = QueuesModule
