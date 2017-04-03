/**
 * @inspiration: https://code.google.com/p/adblockforchrome/source/browse/trunk/functions.js
 */
(function() {
    'use strict';

    /**
     * A copy from `lib/translate.js` to prevent wrapping every page in an
     * asynchronous call to retrieve `translate` from `backgroundPage`.
     */
    window.translate = function(messageID, args) {
        return chrome.i18n.getMessage(messageID, args);
    };

    $(function() {
        var translated = [];

        // translate content (text)
        $('[data-i18n-content]')
            .not('.i18n-replaced').each(function() {
                $(this).text(translate($(this).attr('data-i18n-content')));
                translated.push($(this));
        });

        // translate html
        // $('[data-i18n-html]')
        //     .not('.i18n-replaced').each(function() {
        //         $(this).html(translate($(this).attr('data-i18n-html')));
        // });

        // translate attributes
        $('[data-i18n-attrs]')
            .not('.i18n-replaced').each(function() {
                // example format:
                // <element data-i18n-attrs='{"attr-name": "messageID"}'>
                var attrs = $(this).data('i18n-attrs');
                for(var attr in attrs) {
                    if(attrs.hasOwnProperty(attr)) {
                        $(this).attr(attr, translate(attrs[attr]));
                    }
                }
                translated.push($(this));
        });

        // shortcut to translate common attributes
        // $('[data-i18n-placeholder]')
        //     .not('.i18n-replaced').each(function() {
        //         $(this).attr('placeholder', translate($(this).attr('data-i18n-placeholder')));
        // });
        $('[data-i18n-title]')
            .not('.i18n-replaced').each(function() {
                $(this).attr('title', translate($(this).attr('data-i18n-title')));
                translated.push($(this));
        });
        // $('[data-i18n-val]')
        //     .not('.i18n-replaced').each(function() {
        //         $(this).val(translate($(this).attr('data-i18n-value')));
        // });

        // prevent translating elements multiple times
        $(translated).each(function() {
            $(this).addClass('i18n-replaced');
        });
    });
})();
