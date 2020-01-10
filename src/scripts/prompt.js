if ((preferNativeAlerts || browser.xboxOne) && window.confirm) {
    define("prompt", ["components/prompt/nativeprompt"], function (obj) { return obj; });
} else {
    define("prompt", ["components/prompt/prompt"], function (obj) { return obj; });
}