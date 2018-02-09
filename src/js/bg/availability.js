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
        this.app.on('bg:availability:update', async({available, selected, destinations}) => {
            // Set an icon depending on whether the user is available.
            let icon = 'img/icon-menubar-unavailable.png'
            let endpoint = `api/selecteduserdestination/${this.app.state.availability.sud}/`
            let res
            this.app.setState({availability: {available, destinations, placeholder: selected, selected: selected}}, {persist: true})

            if (available) {
                icon = 'img/icon-menubar-active.png'
                res = await this.app.api.client.put(endpoint, {
                    fixeddestination: selected.type === 'fixeddestination' ? selected.id : null,
                    phoneaccount: selected.type === 'phoneaccount' ? selected.id : null,
                })
            } else {
                icon = 'img/icon-menubar-unavailable.png'
                res = await this.app.api.client.put(endpoint, {fixeddestination: null, phoneaccount: null})
            }



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
            available: false,
            destinations: [],
            dnd: false,
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
        if (sud.fixeddestination) selected = destinations.find((d) => d.id === sud.fixeddestination)
        else if (sud.phoneaccount) selected = destinations.find((d) => d.id === sud.phoneaccount)

        // The `availability` switch is potentially overriden by this
        // check against API data.
        this.app.setState({availability: {available: Boolean(selected.id), destinations, selected, sud: sud.id}}, true)

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
