/**
* @module Availability
*/
class AvailabilityModule {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(app) {
        this.app = app
        this.app.modules.availability = this

        /**
        * Notify the VoIPGRID API about the availability change and set
        * the background state to the new situation.
        */
        this.app.on('bg:update-availability', async({destination, destinations}) => {
            const res = await this.app.api.client.put(`api/selecteduserdestination/${this.app.state.availability.sud.id}/`, {
                fixeddestination: destination.type === 'fixeddestination' ? destination.id : null,
                phoneaccount: destination.type === 'phoneaccount' ? destination.id : null,
            })

            if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.logger.warn(`${this}unauthorized availability request`)
                this.app.state.availability.widget.state = 'unauthorized'
                this.app.emit('fg:set_state', {availability: {widget: {state: 'unauthorized'}}})
                return
            }


            // Set an icon depending on whether the user is available.
            let icon = 'img/icon-menubar-unavailable.png'
            if (destination.id) {
                icon = 'img/icon-menubar-active.png'
            }
            this.app.state.availability.icon = icon

            if (this.app.env.isExtension) {
                if (!this.app.state.queues.selectedQueue) {
                    browser.browserAction.setIcon({path: icon})
                }
            }

            this.app.setState({availability: {destination, destinations}}, true)
        })
    }



    /**
    * Do an API request to get an update of the available userdestination
    * options when the module is loaded in the background.
    */
    async getApiData() {
        const res = await this.app.api.client.get('api/userdestination/')

        if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
            this.app.logger.warn(`${this}unauthorized availability request`)
            this.app.state.availability.widget.state = 'unauthorized'
            this.app.emit('fg:set_state', {availability: {widget: {state: 'unauthorized'}}})
            return
        }

        // Lets format the data in a select-friendly way.
        let userdestination = res.data.objects[0]
        let sud = userdestination.selecteduserdestination

        let fixeddestinations = userdestination.fixeddestinations
        let phoneaccounts = userdestination.phoneaccounts
        fixeddestinations = fixeddestinations.map(fd => ({id: parseInt(fd.id), name: `${fd.phonenumber} - ${fd.description}`, type: 'fixeddestination'}))
        phoneaccounts = phoneaccounts.map(fd => ({id: parseInt(fd.id), name: `${fd.internal_number} - ${fd.description}`, type: 'phoneaccount'}))

        // The actual form data.
        let destination = {id: null, name: null, type: null}
        let destinations = []
        destinations = [...fixeddestinations, ...phoneaccounts]

        if (sud.fixeddestination) {
            destination = destinations.find((d) => d.id === sud.fixeddestination)
        } else if (sud.phoneaccount) {
            destination = destinations.find((d) => d.id === sud.phoneaccount)
        }

        this.app.setState({
            availability: {
                destination,
                destinations,
                sud: {
                    id: sud.id,
                },
            },
        }, true)

        // Set an icon depending on whether the user is available.
        let icon = 'img/icon-menubar-unavailable.png'
        if (destination) icon = 'img/icon-menubar-active.png'

        if (this.app.env.isExtension) {
            this.app.logger.info(`${this}setting icon ${icon}`)
            if (!this.app.state.queues.selectedQueue) {
                browser.browserAction.setIcon({path: icon})
            }
        }

        // Save icon in storage, so we can restore the icon state without
        // getting API data.
        this.app.state.availability.icon = icon
    }

    toString() {
        return `${this.app}[availability] `
    }



}

module.exports = AvailabilityModule
