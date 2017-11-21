class I18n {
    constructor(app, messages = false) {
        this.app = app
        this.messages = messages

        if (this.app.env.extension && !this.app.env.extension.background) {
            $(() => this.processPage())
        } else {
            $(() => this.processPage())
        }
    }


    translate(messageID, args) {
        if (this.app.env.extension) {
            return this.app.browser.i18n.getMessage(messageID, args)
        } else {
            if (messageID in this.messages) {
                return this.messages[messageID].message
            } else return messageID
        }
    }


    processPage() {
        let translated = []

        // Translate text content.
        $('[data-i18n-content]').not('.i18n-replaced').each((i, el) => {
            $(el).text(this.translate($(el).attr('data-i18n-content')))
            translated.push($(el))
        })

        // Translate attributes.
        $('[data-i18n-attrs]').not('.i18n-replaced').each((i, el) => {
            // Example format:
            // <element data-i18n-attrs='{"attr-name": "messageID"}'>
            let attrs = $(el).data('i18n-attrs')
            if (typeof attrs === 'string') throw 'i18n-attrs string must be parsable JSON'
            for (const attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    $(el).attr(attr, this.translate(attrs[attr]))
                }
            }
            translated.push($(el))
        })

        $('[data-i18n-title]').not('.i18n-replaced').each((i, el) => {
            $(el).attr('title', this.translate($(el).attr('data-i18n-title')))
            translated.push($(el))
        })

        // Prevent translating elements multiple times.
        $(translated).each(function() {
            $(this).addClass('i18n-replaced')
        })
    }
}

module.exports = I18n
