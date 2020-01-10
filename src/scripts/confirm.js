if (preferNativeAlerts && window.confirm) {
    define("confirm", ["components/confirm/nativeconfirm"], function (obj) { return obj; });
} else {
    define("confirm", ["components/confirm/confirm"], function (obj) { return obj; });
}