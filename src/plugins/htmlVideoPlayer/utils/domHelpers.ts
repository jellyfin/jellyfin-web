import dom from '../../../utils/dom';
import { logger } from '../../../utils/logger';

/**
 * Returns resolved URL.
 */
export function resolveUrl(url: string): Promise<string> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);
        xhr.onload = function () {
            resolve(xhr.responseURL || url);
        };
        xhr.onerror = function (e: any) {
            logger.error('Failed to resolve URL', { component: 'HtmlVideoPlayer', error: e.message, url });
            resolve(url);
        };
        xhr.send(null);
    });
}

export function tryRemoveElement(elem: HTMLElement): void {
    const parentNode = elem.parentNode;
    if (parentNode) {
        try {
            parentNode.removeChild(elem);
        } catch (err: any) {
            logger.error('Error removing dialog element', { component: 'HtmlVideoPlayer', error: err.message });
        }
    }
}

export function zoomIn(elem: HTMLElement): Promise<void> {
    return new Promise(resolve => {
        const duration = 240;
        elem.style.animation = `htmlvideoplayer-zoomin ${duration}ms ease-in normal`;
        dom.addEventListener(elem, dom.whichAnimationEvent(), resolve, {
            once: true
        });
    });
}

export function normalizeTrackEventText(text: string, useHtml: boolean): string {
    const result = text
        .replace(/\\N/gi, '\n') // Correct newline characters
        .replace(/\r/gi, '') // Remove carriage return characters
        .replace(/{\\.*?}/gi, '') // Remove ass/ssa tags
        // Force LTR as the default direction
        .split('\n').map(val => `\u200E${val}`).join('\n');
    return useHtml ? result.replace(/\n/gi, '<br>') : result;
}
