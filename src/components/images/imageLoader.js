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

    async function itemBlurhashing(target, blurhashstr) {
        if (blurhash.isBlurhashValid(blurhashstr)) {
            // Although the default values recommended by Blurhash developers is 32x32, a size of 18x18 seems to be the sweet spot for us,
            // improving the performance and reducing the memory usage, while retaining almost full blur quality.
            // Lower values had more visible pixelation
            let width = 18;
            let height = 18;
            let pixels;
            try {
                pixels = blurhash.decode(blurhashstr, width, height);
            } catch (err) {
                console.error('Blurhash decode error: ', err);
                target.classList.add('non-blurhashable');
                return;
            }
            let canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            let ctx = canvas.getContext('2d');
            let imgData = ctx.createImageData(width, height);

            imgData.data.set(pixels);
            ctx.putImageData(imgData, 0, 0);

            let child = target.appendChild(canvas);
            child.classList.add('blurhash-canvas');
            child.style.opacity = 1;
            if (userSettings.enableFastFadein()) {
                child.classList.add('lazy-blurhash-fadein-fast');
            } else {
                child.classList.add('lazy-blurhash-fadein');
            }

            target.classList.add('blurhashed');
            target.removeAttribute('data-blurhash');
        }
    }

    function switchCanvas(elem) {
        let child = elem.getElementsByClassName('blurhash-canvas')[0];
        if (child) {
            child.style.opacity = elem.getAttribute('data-src') ? 1 : 0;
        }
    }

    export function fillImage(entry) {
        if (!entry) {
            throw new Error('entry cannot be null');
        }
        let target = entry.target;
        var source = undefined;

        if (target) {
            source = target.getAttribute('data-src');
            var blurhashstr = target.getAttribute('data-blurhash');
        } else {
            source = entry;
        }

        if (!target.classList.contains('blurhashed', 'non-blurhashable') && userSettings.enableBlurhash() && blurhashstr) {
            itemBlurhashing(target, blurhashstr);
        } else if (userSettings.enableBlurhash() && !blurhashstr && !target.classList.contains('blurhashed')) {
            target.classList.add('non-blurhashable');
        }

        if (entry.intersectionRatio > 0) {
            if (source) fillImageElement(target, source);
        } else if (!source) {
            emptyImageElement(target);
        }
    }

    function fillImageElement(elem, url) {
        if (url === undefined) {
            throw new TypeError('url cannot be undefined');
        }

        let preloaderImg = new Image();
        preloaderImg.src = url;

        // This is necessary here, so changing blurhash settings without reloading the page works
        if (!userSettings.enableBlurhash() || elem.classList.contains('non-blurhashable')) {
            elem.classList.add('lazy-hidden');
        }

        preloaderImg.addEventListener('load', () => {
            if (elem.tagName !== 'IMG') {
                elem.style.backgroundImage = "url('" + url + "')";
            } else {
                elem.setAttribute('src', url);
            }
            elem.removeAttribute('data-src');

            if (elem.classList.contains('non-blurhashable') || !userSettings.enableBlurhash()) {
                elem.classList.remove('lazy-hidden');
                if (userSettings.enableFastFadein()) {
                    elem.classList.add('lazy-image-fadein-fast');
                } else {
                    elem.classList.add('lazy-image-fadein');
                }
            } else {
                switchCanvas(elem);
            }
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

        if (elem.classList.contains('non-blurhashable') || !userSettings.enableBlurhash()) {
            elem.classList.remove('lazy-image-fadein-fast', 'lazy-image-fadein');
            elem.classList.add('lazy-hidden');
        } else {
            switchCanvas(elem);
        }
    }

    export function lazyChildren(elem) {
        lazyLoader.lazyChildren(elem, fillImage);
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
    fillImage: fillImage,
    lazyImage: lazyImage,
    lazyChildren: lazyChildren,
    getPrimaryImageAspectRatio: getPrimaryImageAspectRatio
};
