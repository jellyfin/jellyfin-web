define(["datetime"], function(datetime) {
    "use strict";

    function humaneDate(date_str) {
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
            ],
            dt = new Date,
            date = datetime.parseISO8601Date(date_str, !0),
            seconds = (dt - date) / 1e3,
            i = 0;
        for (seconds < 0 && (seconds = Math.abs(seconds)); format = time_formats[i++];)
            if (seconds < format[0]) return 2 == format.length ? format[1] + " ago" : Math.round(seconds / format[2]) + " " + format[1] + " ago";
        return seconds > 47304e5 ? Math.round(seconds / 47304e5) + " centuries ago" : date_str
    }

    function humaneElapsed(firstDateStr, secondDateStr) {
        // TODO replace this whole script with a library or something
        var dateOne = new Date(firstDateStr);
        var dateTwo = new Date(secondDateStr);
        var delta = (dateTwo.getTime() - dateOne.getTime()) / 1e3;

        var days = Math.floor(delta % 31536e3 / 86400);
        var hours = Math.floor(delta % 31536e3 % 86400 / 3600);
        var minutes = Math.floor(delta % 31536e3 % 86400 % 3600 / 60);
        var seconds = Math.round(delta % 31536e3 % 86400 % 3600 % 60);

        var elapsed = "";
        elapsed += 1 == days ? days + " day " : "";
        elapsed += days > 1 ? days + " days " : "";
        elapsed += 1 == hours ? hours + " hour " : "";
        elapsed += hours > 1 ? hours + " hours " : "";
        elapsed += 1 == minutes ? minutes + " minute " : "";
        elapsed += minutes > 1 ? minutes + " minutes " : "";
        elapsed += elapsed.length > 0 ? "and " : "";
        elapsed += 1 == seconds ? seconds + " second" : "";
        elapsed += 0 == seconds || seconds > 1 ? seconds + " seconds" : "";

        return elapsed;
    }

    window.humaneDate = humaneDate;
    window.humaneElapsed = humaneElapsed;

    return {
        humaneDate: humaneDate,
        humaneElapsed: humaneElapsed
    }
});