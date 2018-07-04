module.exports = (app) => {
    /**
    * @memberof fg.components
    */
    const Contact = {
        computed: Object.assign({
            filteredContacts: function() {
                let searchQuery = this.search.input.toLowerCase()
                let _registeredContacts = []
                let _unregisteredContacts = []

                for (const contactId of Object.keys(this.contacts)) {
                    const contact = this.contacts[contactId]
                    // Filter favorites only.
                    if (this.filters.favorites && !contact.favorite) continue
                    if (this.filters.online) {
                        if (!this.contactIsRegistered(contact)) continue
                    }

                    const name = contact.name.toLowerCase()
                    if (name.includes(searchQuery)) {
                        // First try to match on the name.
                        if (this.contactIsRegistered(contact)) _registeredContacts.push(contact)
                        else _unregisteredContacts.push(contact)
                    } else {
                        // Try to match on the endpoint's number.
                        for (const endpointId of Object.keys(contact.endpoints)) {
                            if (String(contact.endpoints[endpointId].number).includes(searchQuery)) {
                                if (this.contactIsRegistered(contact)) _registeredContacts.push(contact)
                                else _unregisteredContacts.push(contact)
                                break
                            }
                        }
                    }
                }

                // First show the registered accounts; then the unregistered ones.
                _registeredContacts = _registeredContacts.sort(app.utils.sortByMultipleKey(['name']))
                _unregisteredContacts = _unregisteredContacts.sort(app.utils.sortByMultipleKey(['name']))
                return _registeredContacts.concat(_unregisteredContacts)
            },
        }, app.helpers.sharedComputed()),
        methods: Object.assign({
            /**
            * Call the Contact on its first available endpoint.
            * @param {Contact} contact - The contact to call.
            */
            callContact: function(contact) {
                for (const id of Object.keys(contact.endpoints)) {
                    if (contact.endpoints[id].status === 'available') {
                        this.createCall(contact.endpoints[id].number)
                        break
                    }
                }
            },
            classes: function(block, modifier = null) {
                let classes = {}
                if (block === 'contacts-list') {
                    classes[this.displayMode] = true
                } else if (block === 'display-mode') {
                    if (modifier === this.displayMode) classes.active = true
                } else if (block === 'favorite-button') {
                    classes['active-yellow'] = modifier
                } else if (block === 'filter-favorites') {
                    classes['active-yellow'] = this.filters.favorites
                } else if (block === 'filter-online') {
                    classes['active-green'] = this.filters.online
                }
                return classes
            },
            contactIsCallable: function(contact) {
                let isReady = false
                for (const id of Object.keys(contact.endpoints)) {
                    if (contact.endpoints[id].status === 'available') {
                        isReady = true
                    }
                }

                return isReady
            },
            contactIsRegistered: function(contact) {
                let isRegistered = false
                for (const id of Object.keys(contact.endpoints)) {
                    if (contact.endpoints[id].status !== 'unregistered') {
                        isRegistered = true
                    }
                }

                return isRegistered
            },
            setDisplayMode: function(type) {
                app.setState({contacts: {displayMode: type}}, {persist: true})
            },
            toggleFavorite: function(contact) {
                app.setState({favorite: !contact.favorite}, {path: `contacts.contacts.${contact.id}`, persist: true})
            },
            toggleFilterFavorites: function() {
                app.setState({contacts: {filters: {favorites: !this.filters.favorites}}}, {persist: true})
            },
            toggleFilterOnline: function() {
                app.setState({contacts: {filters: {online: !this.filters.online}}}, {persist: true})
            },
        }, app.helpers.sharedMethods()),
        render: templates.contacts.r,
        staticRenderFns: templates.contacts.s,
        store: {
            calls: 'calls.calls',
            contacts: 'contacts.contacts',
            displayMode: 'contacts.displayMode',
            filters: 'contacts.filters',
            search: 'contacts.search',
            status: 'contacts.status',
            user: 'user',
        },
    }

    return Contact
}
