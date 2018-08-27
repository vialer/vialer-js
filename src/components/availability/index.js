module.exports = (app, actions) => {
    /**
    * @memberof fg.components
    */
    const Availability = {
        computed: app.helpers.sharedComputed(),
        data: function() {
            return {
                /**
                * Please notice that the foreground Addon is expected
                * to have a component called `AvailabilityPostfix`.
                */
                addons: app.plugins.availability.addons.map((addon) => {
                    return addon.name
                }),
            }
        },
        methods: app.helpers.sharedMethods(),
        render: templates.availability.r,
        staticRenderFns: templates.availability.s,
        store: {
            dnd: 'availability.dnd',
            webrtc: 'settings.webrtc',
        },
        watch: {
            dnd: function(dnd) {
                app.setState({availability: {dnd}}, {persist: true})
            },
        },
    }

    return Availability
}
