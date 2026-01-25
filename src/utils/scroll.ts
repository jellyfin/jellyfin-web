import { scrollBehavior, scrollX, scrollY, scrollYSmooth, hiddenScrollbar, overflow } from '../styles/layout.css';

export { scrollBehavior, scrollX, scrollY, scrollYSmooth, hiddenScrollbar, overflow };

export interface ScrollToOptions {
    left?: number;
    top?: number;
    behavior?: 'auto' | 'smooth';
}

export interface ScrollState {
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
    scrollHeight: number;
    clientWidth: number;
    clientHeight: number;
}

export function getWindowScrollState(): ScrollState {
    return {
        scrollLeft: window.scrollX,
        scrollTop: window.scrollY,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientWidth: window.innerWidth,
        clientHeight: window.innerHeight
    };
}

export function getElementScrollState(element: HTMLElement): ScrollState {
    return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight
    };
}

export function scrollToWindow(options: ScrollToOptions): void {
    window.scrollTo({
        left: options.left ?? window.scrollX,
        top: options.top ?? window.scrollY,
        behavior: options.behavior
    });
}

export function scrollToElement(element: HTMLElement, options: ScrollToOptions): void {
    element.scrollTo({
        left: options.left ?? element.scrollLeft,
        top: options.top ?? element.scrollTop,
        behavior: options.behavior
    });
}

export function scrollWindowToTop(behavior: 'auto' | 'smooth' = 'smooth'): void {
    window.scrollTo({ top: 0, behavior });
}

export function scrollElementToTop(element: HTMLElement, behavior: 'auto' | 'smooth' = 'smooth'): void {
    element.scrollTo({ top: 0, behavior });
}

export function scrollWindowToLeft(behavior: 'auto' | 'smooth' = 'smooth'): void {
    window.scrollTo({ left: 0, behavior });
}

export function scrollElementToLeft(element: HTMLElement, behavior: 'auto' | 'smooth' = 'smooth'): void {
    element.scrollTo({ left: 0, behavior });
}

export function scrollIntoView(element: HTMLElement, options?: ScrollIntoViewOptions): void {
    element.scrollIntoView({
        behavior: options?.behavior ?? 'smooth',
        block: options?.block ?? 'center',
        inline: options?.inline ?? 'nearest'
    });
}

export function getScrollableParent(element: HTMLElement): HTMLElement | null {
    let parent: HTMLElement | null = element;
    while (parent) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.getPropertyValue('overflow-y');
        const overflow = style.getPropertyValue('overflow');
        if (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll') {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}

export function isWindowAtTop(): boolean {
    return window.scrollY === 0;
}

export function isElementAtTop(element: HTMLElement): boolean {
    return element.scrollTop === 0;
}

export function isWindowAtBottom(): boolean {
    return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
}

export function isElementAtBottom(element: HTMLElement): boolean {
    return element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
}

export function isWindowAtLeft(): boolean {
    return window.scrollX === 0;
}

export function isElementAtLeft(element: HTMLElement): boolean {
    return element.scrollLeft === 0;
}

export function isWindowAtRight(): boolean {
    return window.scrollX + window.innerWidth >= document.documentElement.scrollWidth - 1;
}

export function isElementAtRight(element: HTMLElement): boolean {
    return element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function smoothScrollTo(element: HTMLElement, targetTop: number): void {
    const start = element.scrollTop;
    const change = targetTop - start;
    const duration = 270;
    const startTime = performance.now();

    function animateScroll(currentTime: number): void {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        element.scrollTop = start + change * easeProgress;

        if (progress < 1) {
            requestAnimationFrame(animateScroll);
        }
    }

    requestAnimationFrame(animateScroll);
}

export function getWindowScrollPosition(): { x: number; y: number } {
    return { x: window.scrollX, y: window.scrollY };
}

export function getElementScrollPosition(element: HTMLElement): { x: number; y: number } {
    return { x: element.scrollLeft, y: element.scrollTop };
}
