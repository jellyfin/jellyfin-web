define(['require', 'browser'], function (require, browser) {
    'use strict';

    function LazyLoader(options) {

        this.options = options;
    }

    if (browser.edge) {
        require(['css!./lazyedgehack']);
    }

    LazyLoader.prototype.createObserver = function () {
        var callback = this.options.callback;

        var observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    callback(entry);
                },
                {rootMargin: "50%"});
            });

        this.observer = observer;
    };

    LazyLoader.prototype.addElements = function (elements) {

        var observer = this.observer;

        if (!observer) {
            this.createObserver();
            observer = this.observer;
        }

        this.elementCount = (this.elementCount || 0) + elements.length;

        for (var i = 0, length = elements.length; i < length; i++) {
            observer.observe(elements[i]);
        }
    };

    LazyLoader.prototype.destroyObserver = function (elements) {

        var observer = this.observer;

        if (observer) {
            observer.disconnect();
            this.observer = null;
        }
    };

    LazyLoader.prototype.destroy = function (elements) {

        this.destroyObserver();
        this.options = null;
    };

    function unveilElements(elements, root, callback) {

        if (!elements.length) {
            return;
        }
        var lazyLoader = new LazyLoader({
            callback: callback
        });
        lazyLoader.addElements(elements);
    }

    LazyLoader.lazyChildren = function (elem, callback) {

        unveilElements(elem.getElementsByClassName('lazy'), elem, callback);
    };

    return LazyLoader;
});
