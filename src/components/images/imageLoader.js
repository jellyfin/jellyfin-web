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

    export function getImageBlurhashStr(hashes, tags) {
        if (hashes && tags) {
            return hashes[tags];
        }
        return null;
    }

    // function destroyBlurhash(target) {
    //     let canvas = target.getElementsByClassName('blurhash-canvas')[0];
    //     target.removeChild(canvas);
    //     target.classList.remove('blurhashed');
    // }

    function itemBlurhashing(entry) {
        // This intersection ratio ensures that items that are near the borders are also blurhashed, alongside items that are outside the viewport
        // if (entry.intersectionRation <= 0.025)
        if (entry.target) {
            let target = entry.target;
            // We only keep max 80 items blurhashed in screen to save memory
            // if (document.getElementsByClassName('blurhashed').length <= 80) {

            //} else {
                // destroyBlurhash(target);
            //}
            let blurhashstr = target.getAttribute('data-blurhash');
            if (blurhash.isBlurhashValid(blurhashstr) && target.getElementsByClassName('blurhash-canvas').length === 0) {
                console.log('Blurhashing item ' + target.parentElement.parentElement.parentElement.getAttribute('data-index') + ' with intersection ratio ' + entry.intersectionRatio);
                // let width = target.offsetWidth;
                // let height = target.offsetHeight;
                let width = 18;
                let height = 18;
                if (width && height) {
                    let pixels;
                    try {
                        pixels = blurhash.decode(blurhashstr, width, height);
                    } catch (err) {
                        console.log('Blurhash decode error: ' + err.toString());
                        return;
                    }
                    let canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    let ctx = canvas.getContext('2d');
                    let imgData = ctx.createImageData(width, height);

                    imgData.data.set(pixels);
                    // Values taken from https://www.npmjs.com/package/blurhash
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
                }
            }
        }
        return;
    }

    function switchCanvas(elem) {
        let child = elem.getElementsByClassName('blurhash-canvas')[0];
        if (child) {
            if (elem.getAttribute('data-src')) {
                child.style.opacity = 1;
            } else {
                child.style.opacity = 0;
            }
        }
        return;
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

        if (!entry.target.classList.contains('blurhashed')) {
            itemBlurhashing(entry);
        }

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

            elem.removeAttribute('data-src');
            switchCanvas(elem);
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
        switchCanvas(elem);
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
    getImageBlurhashStr: getImageBlurhashStr,
    lazyImage: lazyImage,
    lazyChildren: lazyChildren,
    getPrimaryImageAspectRatio: getPrimaryImageAspectRatio
};
