module.exports = (app) => {

    const ViewStory = {
        computed: {
            page: function() {
                let topic
                if (this.$route.name === 'view_quickstart') {
                    topic = this.topics.user.find((i) => i.name === 'introduction')
                } else if (this.$route.name === 'view_developer_topic') {
                    topic = this.topics.developer.find((i) => i.name === this.$route.params.topic_id)
                } else if (this.$route.name === 'view_user_topic') {
                    topic = this.topics.user.find((i) => i.name === this.$route.params.topic_id)
                }

                return topic.content
            },
        },
        methods: {
            classes: function(block) {
                let classes = {}
                if (block === 'component') {
                    let topic = this.topics.developer.find((i) => i.name === this.$route.params.topic_id)
                    if (topic) classes.topic = true
                    else classes.readme = true
                }
                return classes
            },
        },
        render: templates.view_page.r,
        staticRenderFns: templates.view_page.s,
        store: {
            app: 'app',
            topics: 'pages.topics',
            vendor: 'vendor',
        },
    }

    return ViewStory
}
