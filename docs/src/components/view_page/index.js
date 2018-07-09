module.exports = (app) => {
    const markdownIt = new MarkdownIt({
        highlight: function(str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                return hljs.highlight(lang, str).value
            }
            return ''
        },
    }).enable('image')

    const ViewStory = {
        computed: {
            page: function() {
                if (this.$route.name === 'view_readme') {
                    return markdownIt.render(this.readme)

                    // return this.readme.split('\n').map(function(line) {
                    //     return markdownIt.renderInline(line).trim()
                    // }).join('\n')

                } else {
                    let topic = this.topics.find((i) => i.name === this.$route.params.topic_id)
                    if (topic) return markdownIt.render(topic.content)
                }

                return ''
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
            readme: 'pages.readme',
            topics: 'pages.topics',
        },
    }

    return ViewStory
}
