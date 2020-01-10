require(['browser'], function (browser) {
    if (window.IntersectionObserver && !browser.edge) {
        define("lazyLoader", ["lazyloader-intersectionobserver"], function (obj) { return obj; });
    } else {
        define("lazyLoader", ["lazyloader-scroll"], function (obj) { return obj; });
    }
})