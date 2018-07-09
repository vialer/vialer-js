module.exports = (app) => {

    const Sidebar = {
        render: templates.sidebar.r,
        staticRenderFns: templates.sidebar.s,
        store: {
            topics: 'pages.topics',
            vendor: 'vendor',
            version: 'version',
        },
    }

    return Sidebar
}
