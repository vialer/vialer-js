module.exports = (app) => {

    const ViewStory = {
        computed: {
            page: function() {
                let topic
                if (this.$route.name === 'view_quickstart') {
                    topic = this.topics.find((i) => i.name === 'quickstart')
                } else {
                    topic = this.topics.find((i) => i.name === this.$route.params.topic_id)

                }

                return topic.content
            },
        },
        methods: {
            classes: function(block) {
                let classes = {}
                if (block === 'component') {
                    let topic = this.topics.find((i) => i.name === this.$route.params.topic_id)
                    if (topic) classes.topic = true
                    else classes.readme = true
                }
                return classes
            },
        },
        render: templates.view_page.r,
        staticRenderFns: templates.view_page.s,
        store: {
            topics: 'pages.topics',
        },
    }

    return ViewStory
}
