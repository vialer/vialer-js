/**
* VoIPGRID-platform specific functionality. Within the platform, it is
* possible to set a user's availability. This has effect when the
* user is part of a dialplan and can be used to dynamically switch
* between endpoints.
* @module ModuleAvailability
*/
const Module = require('../lib/module')


/**
* Main entrypoint for Availability.
* @memberof AppBackground.modules
*/
class ModuleAvailability extends Module {
    /**
    * @param {AppBackground} app - The background application.
    */
    constructor(app) {
        super(app)

        this.app.on('bg:availability:platform_data', this._platformData.bind(this))

        /**
        * Notify the VoIPGRID API about the availability change and set
        * the background state to the new situation.
        */
        this.app.on('bg:availability:update', async({available, selected, destinations}) => {
            // Set an icon depending on whether the user is available.
            let endpoint = `api/selecteduserdestination/${this.app.state.availability.sud}/`
            let res
            this.app.setState({availability: {available, destinations, selected}}, {persist: true})

            if (available) {
                res = await this.app.api.client.put(endpoint, {
                    fixeddestination: selected.type === 'fixeddestination' ? selected.id : null,
                    phoneaccount: selected.type === 'phoneaccount' ? selected.id : null,
                })
            } else {
                res = await this.app.api.client.put(endpoint, {fixeddestination: null, phoneaccount: null})
            }

            this.app.modules.ui.menubarState()
            if (this.app.api.UNAUTHORIZED_STATUS.includes(res.status)) {
                this.app.logger.warn(`${this}unauthorized availability request`)
                return
            }
        })
    }


    /**
    * Initializes the module's store.
    * Notice that the `sud` property is used to keep track of the
    * selecteduserdestination API endpoint reference.
    * @returns {Object} The module's store properties.
    */
    _initialState() {
        return {
            available: false,
            destinations: [],
            dnd: false,
            phoneaccounts: [],
            placeholder: {id: null, name: null, type: null},
            selected: {id: null, name: null, type: null},
            sud: null, // This is a fixed id used to build the API endpoint for selected userdestination.
        }
    }


    /**
    * Do an API request to get an update of the available userdestination
    * options when the module is loaded in the background.
    */
    async _platformData({callback = null} = {}) {
        this.app.setState({settings: {webrtc: {account: {status: 'loading'}}}})
        let res = await this.app.api.client.get('api/userdestination/')
        if (this.app.api.NOTOK_STATUS.includes(res.status)) {
            this.app.logger.warn(`${this}platform data request failed (${res.status})`)
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

        // Request all voipaccounts and filter them against the ones the user
        // has. Then augment them with the useragent, so we know whether
        // the VoIP account is already in use or not.
        res = await this.app.api.client.get('api/phoneaccount/basic/phoneaccount/?active=true&order_by=description')
        let voipaccounts = res.data.objects

        let platformAccounts = userdestination.phoneaccounts.map((i) => {
            // The options for successful softphone usage.
            let settings = {
                avpf: false,
                encryption: false,
                ua: null,
            }

            let registeredAccount = voipaccounts.find((j) => (j.account_id === i.account_id && j.sipreginfo))
            if (registeredAccount) settings.ua = registeredAccount.sipreginfo.useragent
            // The expert options need to be parsed first.
            Object.assign(settings, this.app.utils.parseConfigLine(i.expert_options))
            return {
                id: i.id,
                name: `${i.internal_number} - ${i.description}`,
                password: i.password,
                settings,
                username: i.account_id,
            }
        })

        this.app.setState({
            availability: {available: Boolean(selected.id), destinations, selected, sud: sud.id},
            settings: {webrtc: {account: {options: platformAccounts}}},
        }, {persist: true})

        this.app.setState({settings: {webrtc: {account: {status: null}}}})
        if (callback) callback()
    }


    /**
    * Setup availability-specific store watchers.
    * @param {Boolean} dndEnabled - Whether do-not-disturb is being enabled.
    * @returns {Object} - Properties that need to be watched.
    */
    _watchers() {
        return {
            'store.availability.dnd': (dndEnabled) => {
                this.app.modules.ui.menubarState()
            },
        }
    }


    /**
    * Generate a representational name for this module. Used for logging.
    * @returns {String} - An identifier for this module.
    */
    toString() {
        return `${this.app}[availability] `
    }
}

module.exports = ModuleAvailability
