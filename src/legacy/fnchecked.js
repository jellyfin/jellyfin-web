define(['jQuery'], function($) {
    'use strict';
    $.fn.checked = function(value) {
        /* eslint-disable-next-line jquery/no-each */
        return !0 === value || !1 === value ? $(this).each(function() {
            this.checked = value;
        }) : this.length && this[0].checked;
    };

    $.fn.checkboxradio = function() {
        return this;
    };
});
