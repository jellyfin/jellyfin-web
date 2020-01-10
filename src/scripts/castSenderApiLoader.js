if ("cordova" === self.appMode || "android" === self.appMode) {
    define("castSenderApiLoader", [], function () {
        return {
            load: function () {
                window.chrome = window.chrome || {};
                return Promise.resolve();
            }
        };
    });
} else {
    define("castSenderApiLoader", [], function () {
        var ccLoaded = false;
        return {
            load: function () {
                if (ccLoaded) {
                    return Promise.resolve();
                }

                return new Promise(function (resolve, reject) {
                    var fileref = document.createElement("script");
                    fileref.setAttribute("type", "text/javascript");

                    fileref.onload = function () {
                        ccLoaded = true;
                        resolve();
                    };

                    fileref.setAttribute("src", "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js");
                    document.querySelector("head").appendChild(fileref);
                });
            }
        };
    }