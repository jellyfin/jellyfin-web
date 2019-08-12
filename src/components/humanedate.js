define(["datetime"], function(datetime) {
    "use strict";

    function humane_date(date_str) {
        var format, time_formats = [
            [90, "a minute"],
            [3600, "minutes", 60],
            [5400, "an hour"],
            [86400, "hours", 3600],
            [129600, "a day"],
            [604800, "days", 86400],
            [907200, "a week"],
            [2628e3, "weeks", 604800],
            [3942e3, "a month"],
            [31536e3, "months", 2628e3],
            [47304e3, "a year"],
            [31536e5, "years", 31536e3]
        ];
        var dt = new Date;
        var date = datetime.parseISO8601Date(date_str, true);
        var seconds = ((dt - date) / 1000);
        var token = " ago";
        var i = 0;
        if (seconds < 0) {
            seconds = Math.abs(seconds);
            //token = '';
        }
        while (format = time_formats[i++]) {
            if (seconds < format[0]) {
                if (format.length == 2) {
                    return format[1] + token;
                } else {
                    return Math.round(seconds / format[2]) + ' ' + format[1] + token;
                }
            }
        }
        // overflow for centuries
        if (seconds > 4730400000)
            return Math.round(seconds / 4730400000) + ' centuries' + token;

        return date_str;
    }
    window.humane_date = humane_date;
    return humane_date;
});
