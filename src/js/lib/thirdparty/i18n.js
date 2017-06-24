'use strict'

/**
 * A copy from `lib/translate.js` to prevent wrapping every page in an
 * asynchronous call to retrieve `translate` from `backgroundPage`.
 */
window.translate = function(messageID, args) {
    return chrome.i18n.getMessage(messageID, args);
};

$(function() {
    let translated = []

    // Translate text content.
    $('[data-i18n-content]').not('.i18n-replaced').each(function() {
        $(this).text(translate($(this).attr('data-i18n-content')))
        translated.push($(this))
    })

    // Translate attributes.
    $('[data-i18n-attrs]').not('.i18n-replaced').each(function() {
        // Example format:
        // <element data-i18n-attrs='{"attr-name": "messageID"}'>
        const attrs = $(this).data('i18n-attrs')
        for (const attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
                $(this).attr(attr, translate(attrs[attr]))
            }
        }
        translated.push($(this))
    })

    $('[data-i18n-title]').not('.i18n-replaced').each(function() {
        $(this).attr('title', translate($(this).attr('data-i18n-title')))
        translated.push($(this))
    })

    // Prevent translating elements multiple times.
    $(translated).each(function() {
        $(this).addClass('i18n-replaced');
    })
})
