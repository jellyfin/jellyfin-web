define(['lazyLoader', 'imageFetcher', 'layoutManager', 'browser', 'appSettings', 'userSettings', 'require', 'css!./style'], function (lazyLoader, imageFetcher, layoutManager, browser, appSettings, userSettings, require) {
    'use strict';

    var self = {};

    function fillImage(entry) {
        if (!entry) {
            throw new Error('entry cannot be null');
        }

        var source = entry.target.getAttribute('data-src');

        if (entry.intersectionRatio > 0 && source) {
            fillImageElement(entry.target, source);
        } else if (!source) {
            emptyImageElement(entry.target);
        }
    }

    function fillImageElement(elem, source) {
        imageFetcher.loadImage(elem, source).then(function () {
            if (userSettings.enableFastFadein()) {
                elem.classList.add('lazy-image-fadein-fast');
            } else {
                elem.classList.add('lazy-image-fadein');
            }

            elem.removeAttribute("data-src");
        });
    }

    function emptyImageElement(elem) {
        imageFetcher.unloadImage(elem).then(function (url) {
            elem.setAttribute("data-src", url);
        });
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
        values.sort(function (a, b) {
            return a - b;
        });

        var half = Math.floor(values.length / 2);

        var result;

        if (values.length % 2) {
            result = values[half];
        } else {
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
