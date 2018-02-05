module.exports = (app) => {

    return {
        computed: Object.assign({
            filteredContacts: function() {
                let searchQuery = this.search.input.toLowerCase()
                let _contacts = {}
                for (const id of Object.keys(this.contacts)) {
                    const contact = this.contacts[id]
                    const name = contact.name.toLowerCase()
                    const description = contact.name.toLowerCase()
                    const number = String(contact.number)

                    if (name.includes(searchQuery) ||
                        description.includes(searchQuery) ||
                        number.includes(searchQuery)) {
                        _contacts[id] = contact
                    }
                }

                return _contacts
            },
        }, app.utils.sharedComputed()),
        methods: Object.assign({
            callContact: function(contact) {
                // Only make the call when there is currently no call going on.
                if (!this.calls.length) {
                    app.emit('bg:sip:call', {number: contact.number})
                }
            },
        }, app.utils.sharedMethods()),
        render: templates.contacts.r,
        staticRenderFns: templates.contacts.s,
        store: {
            calls: 'calls.calls',
            contacts: 'contacts.contacts',
            search: 'contacts.search',
            state: 'contacts.state',
        },
    }
}
