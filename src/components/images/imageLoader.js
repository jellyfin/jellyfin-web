import * as lazyLoader from '../lazyLoader/lazyLoaderIntersectionObserver';
import * as userSettings from '../../scripts/settings/userSettings';
import { decode, isBlurhashValid } from 'blurhash';
import './style.scss';
/* eslint-disable indent */

    export function lazyImage(elem, source = elem.getAttribute('data-src')) {
        if (!source) {
            return;
        }

        fillImageElement(elem, source);
    }

    function itemBlurhashing(target, blurhashstr) {
        if (isBlurhashValid(blurhashstr)) {
            // Although the default values recommended by Blurhash developers is 32x32, a size of 18x18 seems to be the sweet spot for us,
            // improving the performance and reducing the memory usage, while retaining almost full blur quality.
            // Lower values had more visible pixelation
            const width = 18;
            const height = 18;
            let pixels;
            try {
                pixels = decode(blurhashstr, width, height);
            } catch (err) {
                console.error('Blurhash decode error: ', err);
                target.classList.add('non-blurhashable');
                return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(width, height);

            imgData.data.set(pixels);
            ctx.putImageData(imgData, 0, 0);

            requestAnimationFrame(() => {
                canvas.classList.add('blurhash-canvas');
                if (userSettings.enableFastFadein()) {
                    canvas.classList.add('lazy-blurhash-fadein-fast');
                } else {
                    canvas.classList.add('lazy-blurhash-fadein');
                }

                target.parentNode.insertBefore(canvas, target);
                target.classList.add('blurhashed');
                target.removeAttribute('data-blurhash');
            });
        }
    }

    export function fillImage(entry) {
        if (!entry) {
            throw new Error('entry cannot be null');
        }
        const target = entry.target;
        let source = undefined;

        if (target) {
            source = target.getAttribute('data-src');
        } else {
            source = entry;
        }

        if (entry.intersectionRatio > 0) {
            if (source) fillImageElement(target, source);
        } else if (!source) {
            requestAnimationFrame(() => {
                emptyImageElement(target);
            });
        }
    }

    function fillImageElement(elem, url) {
        if (url === undefined) {
            throw new TypeError('url cannot be undefined');
        }

        const preloaderImg = new Image();
        preloaderImg.src = url;

        elem.classList.add('lazy-hidden');

        preloaderImg.addEventListener('load', () => {
            requestAnimationFrame(() => {
                if (elem.tagName !== 'IMG') {
                    elem.style.backgroundImage = "url('" + url + "')";
                } else {
                    elem.setAttribute('src', url);
                }
                elem.removeAttribute('data-src');

                elem.classList.remove('lazy-hidden');
                if (userSettings.enableFastFadein()) {
                    elem.classList.add('lazy-image-fadein-fast');
                } else {
                    elem.classList.add('lazy-image-fadein');
                }

                const canvas = elem.previousSibling;
                if (elem.classList.contains('blurhashed') && canvas && canvas.tagName === 'CANVAS') {
                    canvas.classList.remove('lazy-image-fadein-fast', 'lazy-image-fadein');
                    canvas.classList.add('lazy-hidden');
                }
            });
        });
    }

    function emptyImageElement(elem) {
        let url;

        if (elem.tagName !== 'IMG') {
            url = elem.style.backgroundImage.slice(4, -1).replace(/"/g, '');
            elem.style.backgroundImage = 'none';
        } else {
            url = elem.getAttribute('src');
            elem.setAttribute('src', '');
        }
        elem.setAttribute('data-src', url);

        elem.classList.remove('lazy-image-fadein-fast', 'lazy-image-fadein');
        elem.classList.add('lazy-hidden');

        const canvas = elem.previousSibling;
        if (canvas && canvas.tagName === 'CANVAS') {
            canvas.classList.remove('lazy-hidden');
            if (userSettings.enableFastFadein()) {
                canvas.classList.add('lazy-image-fadein-fast');
            } else {
                canvas.classList.add('lazy-image-fadein');
            }
        }
    }

    export function lazyChildren(elem) {
        if (userSettings.enableBlurhash()) {
            for (const lazyElem of elem.querySelectorAll('.lazy')) {
                const blurhashstr = lazyElem.getAttribute('data-blurhash');
                if (!lazyElem.classList.contains('blurhashed', 'non-blurhashable') && blurhashstr) {
                    itemBlurhashing(lazyElem, blurhashstr);
                } else if (!blurhashstr && !lazyElem.classList.contains('blurhashed')) {
                    lazyElem.classList.add('non-blurhashable');
                }
            }
        }

        lazyLoader.lazyChildren(elem, fillImage);
    }

    export function getPrimaryImageAspectRatio(items) {
        const values = [];

        for (let i = 0, length = items.length; i < length; i++) {
            const ratio = items[i].PrimaryImageAspectRatio || 0;

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

        const half = Math.floor(values.length / 2);

        let result;

        if (values.length % 2) {
            result = values[half];
        } else {
            result = (values[half - 1] + values[half]) / 2.0;
        }

        // If really close to 2:3 (poster image), just return 2:3
        const aspect2x3 = 2 / 3;
        if (Math.abs(aspect2x3 - result) <= 0.15) {
            return aspect2x3;
        }

        // If really close to 16:9 (episode image), just return 16:9
        const aspect16x9 = 16 / 9;
        if (Math.abs(aspect16x9 - result) <= 0.2) {
            return aspect16x9;
        }

        // If really close to 1 (square image), just return 1
        if (Math.abs(1 - result) <= 0.15) {
            return 1;
        }

        // If really close to 4:3 (poster image), just return 2:3
        const aspect4x3 = 4 / 3;
        if (Math.abs(aspect4x3 - result) <= 0.15) {
            return aspect4x3;
        }

        return result;
    }

    export function fillImages(elems) {
        for (let i = 0, length = elems.length; i < length; i++) {
            const elem = elems[0];
            fillImage(elem);
        }
    }

    export function setLazyImage(element, url) {
        element.classList.add('lazy');
        element.setAttribute('data-src', url);
        lazyImage(element);
    }

/* eslint-enable indent */
export default {
    setLazyImage: setLazyImage,
    fillImages: fillImages,
    fillImage: fillImage,
    lazyImage: lazyImage,
    lazyChildren: lazyChildren,
    getPrimaryImageAspectRatio: getPrimaryImageAspectRatio
};
