module.exports = (app) => {

    return {
        computed: Object.assign({
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
        }, app.utils.sharedComputed()),
        methods: Object.assign({
            callContact: function(contact) {
                // Only make the call when there is currently no call going on.
                if (!this.sip.calls.length) {
                    app.emit('bg:sip:call', {number: contact.internal_number})
                }
            },
        }, app.utils.sharedMethods()),
        render: templates.contacts.r,
        staticRenderFns: templates.contacts.s,
        store: {
            module: 'contacts',
            sip: 'sip',
        },
    }
}
