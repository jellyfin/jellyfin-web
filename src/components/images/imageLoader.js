import * as lazyLoader from 'lazyLoader';
import * as userSettings from 'userSettings';
import * as blurhash from 'blurhash';
import 'css!./style';
/* eslint-disable indent */

    export function lazyImage(elem, source = elem.getAttribute('data-src')) {
        if (!source) {
            return;
        }

        fillImageElement(elem, source);
    }

    /** Get the Blurhash hash value of a card's image */
    export function getImageBlurhash(hashes, tags) {
        if (hashes && tags) {
            return hashes[tags];
        }
    }

    export function fillImage(entry) {
        if (!entry) {
            throw new Error('entry cannot be null');
        }

        var source = undefined;
        if (entry.target) {
            source = entry.target.getAttribute('data-src');
        } else {
            source = entry;
        }

        var blurHash = entry.getAttribute('data-blurhash');
        if (blurHash && blurhash.isBlurhashValid(blurHash)) {
            var width = entry.clientWidth; // TODO: get correct dimensions
            var height = entry.clientHeight;
            var pixels = undefined;
            try {
                pixels = blurhash.decode(blurHash, width, height);
            } catch (e) {
                console.log('Blurhash load failed: ' + e.toString());
            }
            if (pixels) {
                if (!self.canvas || !self.ctx) {
                    var canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    self.canvas = canvas;
                    self.ctx = canvas.getContext('2d');
                }

                var ctx = self.ctx;
                var imageData = ctx.createImageData(width, height);
                imageData.data.set(pixels);
                ctx.putImageData(imageData, 0, 0);
                var uri = self.canvas.toDataURL();
                entry.style.backgroundImage = "url('" + uri + "')";
            }
        }

        // if (onlyBlurhash) return;
        // fillImageElement(elem, source, enableEffects);

        if (entry.intersectionRatio > 0) {
            if (source) fillImageElement(entry.target, source);
        } else if (!source) {
            emptyImageElement(entry.target);
        }
    }

    function fillImageElement(elem, url) {
        if (url === undefined) {
            throw new Error('url cannot be undefined');
        }

        let preloaderImg = new Image();
        preloaderImg.src = url;

        preloaderImg.addEventListener('load', () => {
            if (elem.tagName !== 'IMG') {
                elem.style.backgroundImage = "url('" + url + "')";
            } else {
                elem.setAttribute('src', url);
            }

            if (userSettings.enableFastFadein()) {
                elem.classList.add('lazy-image-fadein-fast');
            } else {
                elem.classList.add('lazy-image-fadein');
            }

            elem.removeAttribute('data-src');
        });
    }

    function emptyImageElement(elem) {
        var url;

        if (elem.tagName !== 'IMG') {
            url = elem.style.backgroundImage.slice(4, -1).replace(/"/g, '');
            elem.style.backgroundImage = 'none';
        } else {
            url = elem.getAttribute('src');
            elem.setAttribute('src', '');
        }

        elem.setAttribute('data-src', url);

        elem.classList.remove('lazy-image-fadein-fast');
        elem.classList.remove('lazy-image-fadein');
    }

    export function lazyChildren(elem) {
        lazyLoader.lazyChildren(elem, fillImage);

        // preload all blurhashes, since lazy-loading always lags behind a bit
        var children = elem.getElementsByTagName('*');
        for (var i = 0; i < children.length; i++) {
            fillImage(children[i], null, false, true);
        }
    }

    export function getPrimaryImageAspectRatio(items) {

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

    export function fillImages(elems) {

        for (var i = 0, length = elems.length; i < length; i++) {
            var elem = elems[0];
            fillImage(elem);
        }
    }

/* eslint-enable indent */
export default {
    fillImages: fillImages,
    getImageBlurhash: getImageBlurhash,
    fillImage: fillImage,
    lazyImage: lazyImage,
    lazyChildren: lazyChildren,
    getPrimaryImageAspectRatio: getPrimaryImageAspectRatio
};
