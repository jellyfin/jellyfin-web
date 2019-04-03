define(['lazyLoader', 'imageFetcher', 'layoutManager', 'browser', 'appSettings', 'require', 'css!./style'], function (lazyLoader, imageFetcher, layoutManager, browser, appSettings, require) {
    'use strict';

    var requestIdleCallback = window.requestIdleCallback || function (fn) {
        fn();
    };

    var self = {};

    // seeing slow performance with firefox
    var enableFade = false;

    function fillImage(elem, source, enableEffects) {

        if (!elem) {
            throw new Error('elem cannot be null');
        }

        if (!source) {
            source = elem.getAttribute('data-src');
        }

        if (!source) {
            return;
        }

        fillImageElement(elem, source, enableEffects);
    }

    function fillImageElement(elem, source, enableEffects) {
        imageFetcher.loadImage(elem, source).then(function () {

            if (enableFade && enableEffects !== false) {
                fadeIn(elem);
            }

            elem.removeAttribute("data-src");
        });
    }

    function fadeIn(elem) {

        var cssClass = 'lazy-image-fadein';

        elem.classList.add(cssClass);
    }

    function lazyChildren(elem) {

        lazyLoader.lazyChildren(elem, fillImage);
    }

    function getPrimaryImageAspectRatio(items) {

        var values = [];

        for (var i = 0, length = items.length; i < length; i++) {

            var ratio = items[i].PrimaryImageAspectRatio || 0;

            if (!ratio) {
                continue;
            }

            values[values.length] = ratio;
        }

        if (!values.length) {
            return null;
        }

        // Use the median
        values.sort(function (a, b) { return a - b; });

        var half = Math.floor(values.length / 2);

        var result;

        if (values.length % 2) {
            result = values[half];
        }
        else {
            result = (values[half - 1] + values[half]) / 2.0;
        }

        // If really close to 2:3 (poster image), just return 2:3
        var aspect2x3 = 2 / 3;
        if (Math.abs(aspect2x3 - result) <= 0.15) {
            return aspect2x3;
        }

        // If really close to 16:9 (episode image), just return 16:9
        var aspect16x9 = 16 / 9;
        if (Math.abs(aspect16x9 - result) <= 0.2) {
            return aspect16x9;
        }

        // If really close to 1 (square image), just return 1
        if (Math.abs(1 - result) <= 0.15) {
            return 1;
        }

        // If really close to 4:3 (poster image), just return 2:3
        var aspect4x3 = 4 / 3;
        if (Math.abs(aspect4x3 - result) <= 0.15) {
            return aspect4x3;
        }

        return result;
    }

    function fillImages(elems) {

        for (var i = 0, length = elems.length; i < length; i++) {
            var elem = elems[0];
            fillImage(elem);
        }
    }

    self.fillImages = fillImages;
    self.lazyImage = fillImage;
    self.lazyChildren = lazyChildren;
    self.getPrimaryImageAspectRatio = getPrimaryImageAspectRatio;

    return self;
});