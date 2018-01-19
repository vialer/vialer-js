module.exports = (app, actions) => {

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
                app.emit('bg:sip:blind_transfer', {number})
            },
            callContact: function(contact) {
                let forceSilent = false
                if (app.env.isExtension && app.env.role.popout) forceSilent = true

                app.emit('dialer:dial', {
                    analytics: 'Colleagues',
                    b_number: contact.internal_number,
                    forceSilent: forceSilent,
                })
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
