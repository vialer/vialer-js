'use strict'

$(function($) {
    function getStorage(key) {
        var value = localStorage.getItem(key)
        if (value) {
            return JSON.parse(value)
        }
        return null
    }

    function setStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value))
    }

    (function restore() {
        var platformUrl = getStorage('platformUrl');
        $('#platformUrl').val(platformUrl);

        var c2d = getStorage('c2d');

        if (c2d) {
            $('#c2d').attr('checked', 'checked');
        } else {
            $('#c2d').removeAttr('checked');
        }
    })();

    function save() {
        $('input').each(function(index, input) {
            if ($(input).attr('type') === 'checkbox' || $(input).attr('radio')) {
                setStorage($(input).attr('id'), $(input).is(':checked'));
            } else {
                setStorage($(input).attr('id'), $(input).val());
            }
        });

        $('.message').text(translate('optionsSaveText')).show();

        setTimeout(function() {
            $('.message').fadeOut(1000, function() {
                $('.message').text('').show();
            });
        }, 2000);
    }
    $('.save').click(save);
});
