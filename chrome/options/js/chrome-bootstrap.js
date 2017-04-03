(function() {
    'use strict';

    $(function() {
        $('.menu a').click(function(ev) {
            ev.preventDefault();
            var selected = 'selected';

            $('.mainview > *').removeClass(selected);
            $('.menu li').removeClass(selected);
            setTimeout(function() {
                $('.mainview > *:not(.selected)').css('display', 'none');
            }, 100);

            $(ev.currentTarget).parent().addClass(selected);
            var currentView = $($(ev.currentTarget).attr('href'));
            currentView.css('display', 'block');
            setTimeout(function() {
                currentView.addClass(selected);
            }, 0);

            setTimeout(function() {
                $('body')[0].scrollTop = 0;
            }, 200);
        });

        $('.mainview > *:not(.selected)').css('display', 'none');
    });
})();
