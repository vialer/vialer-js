const Module = require('./lib/module')

/**
* @module Availability
*/
class AvailabilityModule extends Module {

    /**
    * @param {ClickToDialApp} app - The application object.
    */
    constructor(...args) {
        super(...args)

        /**
        * Notify the VoIPGRID API about the availability change and set
        * the background state to the new situation.
        */
        this.app.on('bg:availability:update', async({selected, destinations}) => {
            console.log("UPDATE AVAILABILITY:", selected, destinations)
            // Set an icon depending on whether the user is available.
            let icon = 'img/icon-menubar-unavailable.png'
            let available = 'no'
            if (selected.id) {
                icon = 'img/icon-menubar-active.png'
                available = 'yes'
            }
            console.log("SELECTED FROM UPDATE:", available, selected)
            this.app.setState({availability: {available, destinations, selected}}, {persist: true})

            const res = await this.app.api.client.put(`api/selecteduserdestination/${this.app.state.availability.sud}/`, {
                fixeddestination: selected.type === 'fixeddestination' ? selected.id : null,
                phoneaccount: selected.type === 'phoneaccount' ? selected.id : null,
            })

            if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.logger.warn(`${this}unauthorized availability request`)
                return
            }

            if (this.app.env.isExtension) {
                if (!this.app.state.queues.selectedQueue) {
                    browser.browserAction.setIcon({path: icon})
                }
            }
        })
    }


    _initialState() {
        return {
            available: 'yes',
            destinations: [],
            placeholder: {
                id: null,
                name: null,
                type: null,
            },
            selected: {
                id: null,
                name: null,
                type: null,
            },
            sud: null, // This is a fixed id used to build the API endpoint for selected userdestination.
        }
    }


    /**
    * Do an API request to get an update of the available userdestination
    * options when the module is loaded in the background.
    */
    async _platformData() {
        const res = await this.app.api.client.get('api/userdestination/')

        if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
            this.app.logger.warn(`${this}unauthorized availability request`)
            return
        }

        // Lets format the data in a select-friendly way.
        const userdestination = res.data.objects[0]

        let fixed = userdestination.fixeddestinations
        let voip = userdestination.phoneaccounts
        fixed = fixed.map(fd => ({id: parseInt(fd.id), name: `${fd.phonenumber} - ${fd.description}`, type: 'fixeddestination'}))
        voip = voip.map(fd => ({id: parseInt(fd.id), name: `${fd.internal_number} - ${fd.description}`, type: 'phoneaccount'}))

        // The actual form data.
        let selected = {id: null, name: null, type: null}
        let destinations = []
        destinations = [...fixed, ...voip]

        const sud = userdestination.selecteduserdestination
        console.log("SUD:", sud)
        if (sud.fixeddestination) selected = destinations.find((d) => d.id === sud.fixeddestination)
        else if (sud.phoneaccount) selected = destinations.find((d) => d.id === sud.phoneaccount)

        let available = selected.id ? 'yes' : 'no'
        console.log("SET AVAILABLE ON LOAD:", available)
        this.app.setState({availability: {available, destinations, selected, sud: sud.id}}, true)

        // Set an icon depending on whether the user is available.
        let icon = 'img/icon-menubar-unavailable.png'
        if (selected.id) icon = 'img/icon-menubar-active.png'

        if (this.app.env.isExtension) {
            this.app.logger.info(`${this}setting icon ${icon}`)
            if (!this.app.state.queues.selectedQueue) {
                browser.browserAction.setIcon({path: icon})
            }
        }
    }

    toString() {
        return `${this.app}[availability] `
    }
}

module.exports = AvailabilityModule
