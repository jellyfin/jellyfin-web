import dom from '../utils/dom';
import appSettings from '../scripts/settings/appSettings';
import layoutManager from './layoutManager';

const ScrollTime = 270;
const Epsilon = 1e-6;

function minimumScrollY(): number {
    const topMenu = document.querySelector('.headerTop');
    return topMenu?.clientHeight || 0;
}

const supportsSmoothScroll = typeof document !== 'undefined' && 'scrollBehavior' in document.documentElement.style;
let supportsScrollToOptions = false;
if (typeof document !== 'undefined') {
    try {
        const elem = document.createElement('div');
        const opts = Object.defineProperty({}, 'behavior', { get: () => { supportsScrollToOptions = true; return 'auto'; } });
        elem.scrollTo(opts as any);
    } catch (err) {}
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

function fitRange(begin1: number, end1: number, begin2: number, end2: number): number {
    const d1 = begin1 - begin2;
    const d2 = end2 - end1;
    if (d1 < 0 && d1 < d2) return -d1;
    if (d2 < 0) return d2;
    return 0;
}

function ease(t: number): number {
    return t * (2 - t);
}

class DocumentScroller {
    get scrollLeft(): number { return window.pageXOffset; }
    set scrollLeft(val: number) { window.scroll(val, window.pageYOffset); }
    get scrollTop(): number { return window.pageYOffset; }
    set scrollTop(val: number) { window.scroll(window.pageXOffset, val); }
    get scrollWidth(): number { return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth); }
    get scrollHeight(): number { return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight); }
    get clientWidth(): number { return Math.min(document.documentElement.clientWidth, document.body.clientWidth); }
    get clientHeight(): number { return Math.min(document.documentElement.clientHeight, document.body.clientHeight); }
    getAttribute(name: string): string | null { return document.body.getAttribute(name); }
    getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; }
    scrollTo(options: any) { (window as any).scrollTo(options); }
}

const documentScroller = new DocumentScroller();

const scrollerHints = {
    x: { nameScroll: 'scrollWidth', nameClient: 'clientWidth', nameStyle: 'overflowX', nameScrollMode: 'data-scroll-mode-x' },
    y: { nameScroll: 'scrollHeight', nameClient: 'clientHeight', nameStyle: 'overflowY', nameScrollMode: 'data-scroll-mode-y' }
};

function getScrollableParent(element: HTMLElement | null, vertical: boolean): any {
    if (element) {
        const hint = vertical ? scrollerHints.y : scrollerHints.x;
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            if (parent.getAttribute(hint.nameScrollMode as string) === 'custom') return parent;
            const style = window.getComputedStyle(parent);
            if (style.position === 'fixed') return parent;
            const overflow = (style as any)[hint.nameStyle];
            if (overflow === 'scroll' || (overflow === 'auto' && (parent as any)[hint.nameScroll] > (parent as any)[hint.nameClient])) return parent;
            parent = parent.parentElement;
        }
    }
    return documentScroller;
}

function getScrollerData(scroller: any, vertical: boolean) {
    const hint = vertical ? scrollerHints.y : scrollerHints.x;
    return {
        scrollPos: vertical ? scroller.scrollTop : scroller.scrollLeft,
        scrollSize: (scroller as any)[hint.nameScroll],
        clientSize: (scroller as any)[hint.nameClient],
        mode: scroller.getAttribute?.(hint.nameScrollMode),
        custom: scroller.getAttribute?.(hint.nameScrollMode) === 'custom'
    };
}

function getScrollerChildPos(scroller: any, element: HTMLElement, vertical: boolean): number {
    const eRect = element.getBoundingClientRect();
    const sRect = scroller.getBoundingClientRect();
    return (vertical ? scroller.scrollTop : scroller.scrollLeft) + (vertical ? eRect.top - sRect.top : eRect.left - sRect.left);
}

function scrollToHelper(scroller: any, options: ScrollToOptions): void {
    if ('scrollTo' in scroller) {
        if (!supportsScrollToOptions) {
            const x = options.left !== undefined ? options.left : scroller.scrollLeft;
            const y = options.top !== undefined ? options.top : scroller.scrollTop;
            scroller.scrollTo(x, y);
        } else scroller.scrollTo(options);
    } else {
        if (options.left !== undefined) scroller.scrollLeft = options.left;
        if (options.top !== undefined) scroller.scrollTop = options.top;
    }
}

let scrollTimer: any;
function resetScrollTimer() { cancelAnimationFrame(scrollTimer); scrollTimer = undefined; }

function builtinScroll(xS: any, x: number, yS: any, y: number, smooth: boolean) {
    const behavior = smooth ? 'smooth' : 'instant';
    if (xS !== yS) {
        if (xS) scrollToHelper(xS, { left: x, behavior });
        if (yS) scrollToHelper(yS, { top: y, behavior });
    } else if (xS) scrollToHelper(xS, { left: x, top: y, behavior });
}

export function isEnabled(): boolean { return layoutManager.tv; }

export function scrollToElement(element: HTMLElement, smooth: boolean = false): void {
    const isFixed = element.offsetParent && (!element.offsetParent.parentElement || window.getComputedStyle(element.offsetParent).position === 'fixed');
    let xS = getScrollableParent(element, false);
    let yS = getScrollableParent(element, true);
    const xD = getScrollerData(xS, false);
    const yD = getScrollerData(yS, true);

    if ((xS === yS && (xD.custom || yD.custom)) || (xD.custom && yD.custom)) return;

    const eRect = element.getBoundingClientRect();
    let x = 0, y = 0;

    if (!xD.custom) {
        const xPos = getScrollerChildPos(xS, element, false);
        x = clamp(Math.round(xPos + (eRect.width - xD.clientSize) / 2), 0, xD.scrollSize - xD.clientSize);
    } else xS = null;

    if (!yD.custom) {
        const yPos = getScrollerChildPos(yS, element, true);
        y = clamp(Math.round(yPos + (eRect.height - yD.clientSize) / 2), 0, yD.scrollSize - yD.clientSize);
        if (isFixed && eRect.bottom < 0) y = 0;
        if (y < minimumScrollY() && yS === documentScroller) y = 0;
    } else yS = null;

    resetScrollTimer();
    builtinScroll(xS, x, yS, y, smooth);
}

if (typeof window !== 'undefined' && isEnabled()) {
    dom.addEventListener(window, 'focusin', (e: any) => {
        setTimeout(() => scrollToElement(e.target, (appSettings as any).enableSmoothScroll()), 0);
    }, { capture: true });
}

const scrollManager = { isEnabled, scrollToElement };
export default scrollManager;
