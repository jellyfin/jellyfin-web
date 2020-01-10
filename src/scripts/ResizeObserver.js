if (self.ResizeObserver) {
    define("ResizeObserver", [], function () {
        return self.ResizeObserver;
    });
} else {
    define("ResizeObserver", ["resize-observer-polyfill"], function (obj) { return obj; });
}