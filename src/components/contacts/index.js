module.exports = (app) => {

    return {
        computed: {
            filteredContacts: function() {
                let searchQuery = this.module.search.input.toLowerCase()
                return this.module.contacts.filter(function(contact) {
                    let name = contact.callerid_name.toLowerCase()
                    let description = contact.description.toLowerCase()
                    if (!name.includes(searchQuery) && !description.includes(searchQuery)) {
                        return false
                    }

                    return true
                })
            },
        },
        methods: {
            blindTransfer: function(number) {
                app.emit('bg:sip:transfer', {number, type: 'attended'})
                app.setState({sip: {session: {transfer: false}}})
            },
            callContact: function(contact) {
                // Only make the call when there is currently no call going on.
                if (!this.sip.session.state) {
                    app.emit('bg:sip:call', {number: contact.internal_number})
                }

            },

        },
        render: templates.contacts.r,
        staticRenderFns: templates.contacts.s,
        store: {
            module: 'contacts',
            sip: 'sip',
        },
    }
}
