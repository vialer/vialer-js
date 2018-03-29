module.exports = (app) => {

    function sortByMultipleKey(keys) {
        return function(a, b) {
            if (keys.length === 0) return 0
            var key = keys[0]
            if (a[key] < b[key]) return -1
            else if (a[key] > b[key]) return 1
            else return sortByMultipleKey(keys.slice(1))(a, b)
        }
    }

    /**
    * @memberof fg.components
    */
    const Contact = {
        computed: Object.assign({
            filteredContacts: function() {
                let searchQuery = this.search.input.toLowerCase()
                let _contacts = []
                for (const id of Object.keys(this.contacts)) {
                    const contact = this.contacts[id]
                    const name = contact.name.toLowerCase()
                    const description = contact.name.toLowerCase()
                    const number = String(contact.number)

                    if (name.includes(searchQuery) || description.includes(searchQuery) || number.includes(searchQuery)) {
                        _contacts.push(contact)
                    }
                }

                return _contacts.sort(sortByMultipleKey(['status', 'name']))
            },
        }, app.helpers.sharedComputed()),
        methods: app.helpers.sharedMethods(),
        render: templates.contacts.r,
        staticRenderFns: templates.contacts.s,
        store: {
            calls: 'calls.calls',
            contacts: 'contacts.contacts',
            search: 'contacts.search',
            status: 'contacts.status',
            user: 'user',
        },
    }

    return Contact
}
