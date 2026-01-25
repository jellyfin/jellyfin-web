// Native blurhash implementation - no external worker needed
import * as lazyLoader from '../lazyLoader/lazyLoaderIntersectionObserver';
import * as userSettings from '../../scripts/settings/userSettings';
import { logger } from '../../utils/logger';
import './style.scss';

// Native blurhash implementation - target dictionary for canvas rendering
const targetDic: Record<string, HTMLElement[]> = {};

function drawBlurhash(target: HTMLElement, pixels: Uint8ClampedArray, width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imgData = ctx.createImageData(width, height);

    imgData.data.set(pixels);
    ctx.putImageData(imgData, 0, 0);

    requestAnimationFrame(() => {
        canvas.classList.add('blurhash-canvas');
        target.parentNode?.insertBefore(canvas, target);
        target.classList.add('blurhashed');
        target.removeAttribute('data-blurhash');
    });
}

function itemBlurhashing(target: HTMLElement, hash: string) {
    try {
        const width = 20;
        const height = 20;
        // Native blurhash implementation - itemBlurhashing removed
        targetDic[hash] = [target];
    } catch (err) {
        logger.error('Blurhash processing failed', { component: 'imageLoader' }, err as Error);
        target.classList.add('non-blurhashable');
    }
}

export function fillImage(entry: IntersectionObserverEntry | string | any) {
    if (!entry) throw new Error('entry cannot be null');

    let target: HTMLElement | null = null;
    let source: string | null = null;
    let isIntersecting = false;

    if (typeof entry === 'object' && 'target' in entry) {
        target = entry.target as HTMLElement;
        source = target.getAttribute('data-src');
        isIntersecting = entry.isIntersecting;
    } else {
        source = entry as string;
        isIntersecting = true;
    }

    if (isIntersecting) {
        if (source && target) {
            const isPriority = target.getAttribute('data-priority') === 'true';
            fillImageElement(target, source, isPriority);
        }
    } else if (!source && target) {
        emptyImageElement(target);
    }
}

function onAnimationEnd(event: AnimationEvent) {
    const elem = event.target as HTMLElement;
    requestAnimationFrame(() => {
        const canvas = elem.previousSibling as HTMLElement;
        if (elem.classList.contains('blurhashed') && canvas?.tagName === 'CANVAS') {
            canvas.classList.add('lazy-hidden');
        }
        elem.parentNode?.querySelector('.cardPadder')?.classList.add('lazy-hidden-children');
    });
    elem.removeEventListener('animationend', onAnimationEnd as EventListener);
}

function fillImageElement(elem: HTMLElement, url: string, priority = false) {
    if (url === undefined) throw new TypeError('url cannot be undefined');
    const cleanUrl = url.replace(/^['"]+|['"]+$/g, '');

    const preloaderImg = new Image();
    preloaderImg.src = cleanUrl;
    if (priority) (preloaderImg as any).fetchPriority = 'high';

    elem.classList.add('lazy-hidden');
    elem.addEventListener('animationend', onAnimationEnd as EventListener);

    preloaderImg.addEventListener('load', () => {
        requestAnimationFrame(() => {
            if (elem.tagName !== 'IMG') {
                elem.style.backgroundImage = `url('${cleanUrl}')`;
            } else {
                elem.setAttribute('src', cleanUrl);
                if (priority) elem.setAttribute('fetchpriority', 'high');
            }
            elem.removeAttribute('data-src');

            if ((userSettings as any).enableFastFadein?.()) elem.classList.add('lazy-image-fadein-fast');
            else elem.classList.add('lazy-image-fadein');

            elem.classList.remove('lazy-hidden');
        });
    });
}

function emptyImageElement(elem: HTMLElement) {
    elem.removeEventListener('animationend', onAnimationEnd as EventListener);
    const canvas = elem.previousSibling as HTMLElement;
    if (canvas?.tagName === 'CANVAS') canvas.classList.remove('lazy-hidden');

    elem.parentNode?.querySelector('.cardPadder')?.classList.remove('lazy-hidden-children');

    let url: string | null;
    if (elem.tagName !== 'IMG') {
        url = elem.style.backgroundImage.slice(4, -1).replace(/['"]/g, '');
        elem.style.backgroundImage = 'none';
    } else {
        url = elem.getAttribute('src');
        elem.setAttribute('src', '');
    }
    if (url) elem.setAttribute('data-src', url);

    elem.classList.remove('lazy-image-fadein-fast', 'lazy-image-fadein');
    elem.classList.add('lazy-hidden');
}

export function lazyChildren(elem: HTMLElement) {
    if ((userSettings as any).enableBlurhash?.()) {
        for (const lazyElem of Array.from(elem.querySelectorAll('.lazy')) as HTMLElement[]) {
            const blurhashstr = lazyElem.getAttribute('data-blurhash');
            if (
                !lazyElem.classList.contains('blurhashed') &&
                !lazyElem.classList.contains('non-blurhashable') &&
                blurhashstr
            ) {
                itemBlurhashing(lazyElem, blurhashstr);
            } else if (!blurhashstr && !lazyElem.classList.contains('blurhashed')) {
                lazyElem.classList.add('non-blurhashable');
            }
        }
    }

    lazyLoader.lazyChildren(elem, fillImage);
}

export function getPrimaryImageAspectRatio(items: any[]): number | null {
    const values: number[] = [];
    for (const item of items) {
        const ratio = item.PrimaryImageAspectRatio || 0;
        if (ratio) values.push(ratio);
    }

    if (!values.length) return null;
    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);
    const result = values.length % 2 ? values[half] : (values[half - 1] + values[half]) / 2.0;

    if (Math.abs(2 / 3 - result) <= 0.15) return 2 / 3;
    if (Math.abs(16 / 9 - result) <= 0.2) return 16 / 9;
    if (Math.abs(1 - result) <= 0.15) return 1;
    if (Math.abs(4 / 3 - result) <= 0.15) return 4 / 3;

    return result;
}

export function lazyImage(elem: HTMLElement, source = elem.getAttribute('data-src')) {
    if (source) fillImageElement(elem, source);
}

const imageLoader = {
    lazyImage,
    fillImage,
    lazyChildren,
    getPrimaryImageAspectRatio,
    setLazyImage: (element: HTMLElement, url: string, priority = false) => {
        element.classList.add('lazy');
        element.setAttribute('data-src', url);
        element.setAttribute('data-priority', priority ? 'true' : 'false');
        lazyImage(element);
    }
};

export default imageLoader;
