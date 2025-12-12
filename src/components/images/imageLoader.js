import Worker from './blurhash.worker.ts'; // eslint-disable-line import/default
import * as lazyLoader from '@/components/lazyLoader/lazyLoaderIntersectionObserver';
import * as userSettings from '@/scripts/settings/userSettings';
import './style.scss';

const worker = new Worker();
const targetDic = {};
worker.addEventListener(
    'message',
    ({ data: { pixels, hsh, width, height } }) => {
        const elems = targetDic[hsh];
        if (elems?.length) {
            for (const elem of elems) {
                drawBlurhash(elem, pixels, width, height);
            }
            delete targetDic[hsh];
        }
    }
);

export function lazyImage(elem, source = elem.getAttribute('data-src')) {
    if (!source) {
        return;
    }

    fillImageElement(elem, source);
}

function drawBlurhash(target, pixels, width, height) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(width, height);

    imgData.data.set(pixels);
    ctx.putImageData(imgData, 0, 0);

    requestAnimationFrame(() => {
        // This class is just an utility class, so users can customize the canvas using their own CSS.
        canvas.classList.add('blurhash-canvas');

        target.parentNode.insertBefore(canvas, target);
        target.classList.add('blurhashed');
        target.removeAttribute('data-blurhash');
    });
}

function itemBlurhashing(target, hash) {
    try {
        // Although the default values recommended by Blurhash developers is 32x32, a size of 20x20 seems to be the sweet spot for us,
        // improving the performance and reducing the memory usage, while retaining almost full blur quality.
        // Lower values had more visible pixelation
        const width = 20;
        const height = 20;
        targetDic[hash] = (targetDic[hash] || []).filter(item => item !== target);
        targetDic[hash].push(target);

        worker.postMessage({
            hash,
            width,
            height
        });
    } catch (err) {
        console.error(err);
        target.classList.add('non-blurhashable');
        return;
    }
}

export function fillImage(entry) {
    if (!entry) {
        throw new Error('entry cannot be null');
    }
    const target = entry.target;
    let source;

    if (target) {
        source = target.getAttribute('data-src');
    } else {
        source = entry;
    }

    if (entry.isIntersecting) {
        if (source) {
            fillImageElement(target, source);
        }
    } else if (!source) {
        emptyImageElement(target);
    }
}

function onAnimationEnd(event) {
    const elem = event.target;
    requestAnimationFrame(() => {
        const canvas = elem.previousSibling;
        if (elem.classList.contains('blurhashed') && canvas?.tagName === 'CANVAS') {
            canvas.classList.add('lazy-hidden');
        }

        // HACK: Hide the content of the card padder
        elem.parentNode?.querySelector('.cardPadder')?.classList.add('lazy-hidden-children');
    });
    elem.removeEventListener('animationend', onAnimationEnd);
}

function fillImageElement(elem, url) {
    if (url === undefined) {
        throw new TypeError('url cannot be undefined');
    }

    const preloaderImg = new Image();
    preloaderImg.src = url;

    elem.classList.add('lazy-hidden');
    elem.addEventListener('animationend', onAnimationEnd);

    preloaderImg.addEventListener('load', () => {
        requestAnimationFrame(() => {
            if (elem.tagName !== 'IMG') {
                elem.style.backgroundImage = "url('" + url + "')";
            } else {
                elem.setAttribute('src', url);
            }
            elem.removeAttribute('data-src');

            if (userSettings.enableFastFadein()) {
                elem.classList.add('lazy-image-fadein-fast');
            } else {
                elem.classList.add('lazy-image-fadein');
            }
            elem.classList.remove('lazy-hidden');
        });
    });
}

function emptyImageElement(elem) {
    elem.removeEventListener('animationend', onAnimationEnd);
    const canvas = elem.previousSibling;
    if (canvas?.tagName === 'CANVAS') {
        canvas.classList.remove('lazy-hidden');
    }

    // HACK: Unhide the content of the card padder
    elem.parentNode?.querySelector('.cardPadder')?.classList.remove('lazy-hidden-children');

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

export default {
    setLazyImage: setLazyImage,
    fillImages: fillImages,
    fillImage: fillImage,
    lazyImage: lazyImage,
    lazyChildren: lazyChildren,
    getPrimaryImageAspectRatio: getPrimaryImageAspectRatio
};
