/**
 * @deprecated This file is deprecated in favor of React + ui-primitives.
 *
 * Migration:
 * - Web Component `emby-tabs` → ui-primitives/Tabs
 * - Custom tab logic → Radix UI Tabs
 *
 * @see src/ui-primitives/Tabs.tsx
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import dom from '../../utils/dom';
import ScrollerFactory from 'lib/scroller';
import browser from '../../scripts/browser';
import focusManager from '../../components/focusManager';
import layoutManager from '../../components/layoutManager';
import './emby-tabs.scss';

interface Scroller {
    toCenter(element: HTMLElement, animate: boolean): void;
    reload(): void;
    init(): void;
    destroy(): void;
}

interface EmbyTabsInterface extends HTMLDivElement {
    scroller: Scroller | null;
    selectedTabIndex: number;
    readyFired: boolean;
    createdCallback(): void;
    attachedCallback(): void;
    detachedCallback(): void;
    focus(): void;
    refresh(): void;
    selectedIndex(selected?: number, triggerEvent?: boolean): number | void;
    selectNext(): void;
    selectPrevious(): void;
    triggerBeforeTabChange(): void;
    triggerTabChange(): void;
    setTabEnabled(index: number, enabled: boolean): void;
}

const buttonClass = 'emby-tab-button';
const activeButtonClass = buttonClass + '-active';

function setActiveTabButton(newButton: Element): void {
    newButton.classList.add(activeButtonClass);
}

function getTabPanel(): Element | null {
    return null;
}

function removeActivePanelClass(): void {
    const tabPanel = getTabPanel();
    if (tabPanel) {
        tabPanel.classList.remove('is-active');
    }
}

function fadeInRight(elem: Element): void {
    const pct = browser.mobile ? '4%' : '0.5%';

    const keyframes: Keyframe[] = [
        { opacity: '0', transform: 'translate3d(' + pct + ', 0, 0)', offset: 0 },
        { opacity: '1', transform: 'none', offset: 1 }
    ];

    if (elem.animate) {
        elem.animate(keyframes, {
            duration: 160,
            iterations: 1,
            easing: 'ease-out'
        });
    }
}

function triggerBeforeTabChange(
    tabs: EmbyTabsInterface,
    index: number,
    previousIndex: number | null | undefined
): void {
    tabs.dispatchEvent(
        new CustomEvent('beforetabchange', {
            detail: {
                selectedTabIndex: index,
                previousIndex: previousIndex
            }
        })
    );
    if (previousIndex != null && previousIndex !== index) {
        removeActivePanelClass();
    }

    const newPanel = getTabPanel();

    if (newPanel) {
        fadeInRight(newPanel);

        newPanel.classList.add('is-active');
    }
}

function onClick(this: EmbyTabsInterface, e: Event): void {
    const tabs = this;

    const current = tabs.querySelector('.' + activeButtonClass);
    const tabButton = dom.parentWithClass(e.target as HTMLElement, buttonClass);

    if (tabButton && tabButton !== current) {
        if (current) {
            current.classList.remove(activeButtonClass);
        }

        const previousIndex = current ? parseInt(current.getAttribute('data-index') || '0', 10) : null;

        setActiveTabButton(tabButton);

        const index = parseInt(tabButton.getAttribute('data-index') || '0', 10);

        triggerBeforeTabChange(tabs, index, previousIndex);

        setTimeout(() => {
            tabs.selectedTabIndex = index;

            tabs.dispatchEvent(
                new CustomEvent('tabchange', {
                    detail: {
                        selectedTabIndex: index,
                        previousIndex: previousIndex
                    }
                })
            );
        }, 120);

        if (tabs.scroller) {
            tabs.scroller.toCenter(tabButton as HTMLElement, false);
        }
    }
}

function onFocusIn(this: EmbyTabsInterface, e: Event): void {
    const tabs = this;
    const tabButton = dom.parentWithClass(e.target as HTMLElement, buttonClass);
    if (tabButton && tabs.scroller) {
        tabs.scroller.toCenter(tabButton, false);
    }
}

function onFocusOut(e: Event): void {
    const parentContainer = (e.target as Element).parentNode as HTMLElement;
    const previousFocus = parentContainer?.querySelector('.lastFocused');
    if (previousFocus) {
        previousFocus.classList.remove('lastFocused');
    }
    (e.target as Element).classList.add('lastFocused');
}

interface ScrollerOptions {
    horizontal: number;
    itemNav: number;
    mouseDragging: number;
    touchDragging: number;
    slidee: Element;
    smart: boolean;
    releaseSwing: boolean;
    scrollBy: number;
    speed: number;
    elasticBounds: number;
    dragHandle: number;
    dynamicHandle: number;
    clickBar: number;
    hiddenScroll: boolean;
    requireAnimation: boolean;
    allowNativeSmoothScroll: boolean;
}

function initScroller(tabs: EmbyTabsInterface): void {
    if (tabs.scroller) {
        return;
    }

    const contentScrollSlider = tabs.querySelector('.emby-tabs-slider');
    if (contentScrollSlider) {
        const options: ScrollerOptions = {
            horizontal: 1,
            itemNav: 0,
            mouseDragging: 1,
            touchDragging: 1,
            slidee: contentScrollSlider,
            smart: true,
            releaseSwing: true,
            scrollBy: 200,
            speed: 120,
            elasticBounds: 1,
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1,
            hiddenScroll: true,
            requireAnimation: !browser.safari,
            allowNativeSmoothScroll: true
        };
        tabs.scroller = new ScrollerFactory(tabs, options) as Scroller;
        tabs.scroller.init();
    } else {
        tabs.classList.add('scrollX');
        tabs.classList.add('hiddenScrollX');
        tabs.classList.add('smoothScrollX');
    }
}

const EmbyTabs = Object.create(HTMLDivElement.prototype) as EmbyTabsInterface;

interface PassiveEventListenerOptions extends AddEventListenerOptions {
    passive: boolean;
}

EmbyTabs.createdCallback = function (this: EmbyTabsInterface): void {
    if (this.classList.contains('emby-tabs')) {
        return;
    }
    this.classList.add('emby-tabs');
    this.classList.add('focusable');

    this.addEventListener('click', onClick, { passive: true } as PassiveEventListenerOptions);

    if (layoutManager.tv) {
        this.addEventListener('focusin', onFocusIn, { passive: true } as PassiveEventListenerOptions);
    }

    this.addEventListener('focusout', onFocusOut);
};

EmbyTabs.focus = function (this: EmbyTabsInterface): void {
    const selectedTab = this.querySelector('.' + activeButtonClass);
    const lastFocused = this.querySelector('.lastFocused');

    if (lastFocused) {
        focusManager.focus(lastFocused as HTMLElement);
    } else if (selectedTab) {
        focusManager.focus(selectedTab as HTMLElement);
    } else {
        focusManager.autoFocus(this);
    }
};

EmbyTabs.refresh = function (this: EmbyTabsInterface): void {
    if (this.scroller) {
        this.scroller.reload();
    }
};

EmbyTabs.attachedCallback = function (this: EmbyTabsInterface): void {
    initScroller(this);

    const current = this.querySelector('.' + activeButtonClass);
    const currentIndex = current
        ? parseInt(current.getAttribute('data-index') || '0', 10)
        : parseInt(this.getAttribute('data-index') || '0', 10);

    if (currentIndex !== -1) {
        this.selectedTabIndex = currentIndex;

        const tabButtons = this.querySelectorAll('.' + buttonClass);

        const newTabButton = tabButtons[currentIndex];

        if (newTabButton) {
            setActiveTabButton(newTabButton);
        }
    }

    if (!this.readyFired) {
        this.readyFired = true;
        this.dispatchEvent(new CustomEvent('ready', {}));
    }
};

EmbyTabs.detachedCallback = function (this: EmbyTabsInterface): void {
    if (this.scroller) {
        this.scroller.destroy();
        this.scroller = null;
    }

    dom.removeEventListener(this, 'click', onClick, { passive: true } as any);

    if (layoutManager.tv) {
        dom.removeEventListener(this, 'focusin', onFocusIn, { passive: true } as any);
    }
};

function getSelectedTabButton(elem: Element): Element | null {
    return elem.querySelector('.' + activeButtonClass);
}

EmbyTabs.selectedIndex = function (this: EmbyTabsInterface, selected?: number, triggerEvent?: boolean): number | void {
    const tabs = this;

    if (selected == null) {
        return tabs.selectedTabIndex || 0;
    }

    const current = tabs.selectedIndex();

    tabs.selectedTabIndex = selected;

    const tabButtons = tabs.querySelectorAll('.' + buttonClass);

    if (current === selected || triggerEvent === false) {
        triggerBeforeTabChange(tabs, selected, typeof current === 'number' ? current : null);

        tabs.dispatchEvent(
            new CustomEvent('tabchange', {
                detail: {
                    selectedTabIndex: selected
                }
            })
        );

        const currentTabButton = typeof current === 'number' ? tabButtons[current] : null;
        setActiveTabButton(tabButtons[selected]);

        if (current !== selected && currentTabButton) {
            currentTabButton.classList.remove(activeButtonClass);
        }
    } else {
        onClick.call(tabs, {
            target: tabButtons[selected]
        } as unknown as MouseEvent);
    }
};

function getSibling(elem: Element, method: 'nextSibling' | 'previousSibling'): Element | null {
    let sibling = elem[method] as Element | null;

    while (sibling) {
        if (sibling.classList?.contains(buttonClass) && !sibling.classList?.contains('hide')) {
            return sibling;
        }

        sibling = sibling[method] as Element | null;
    }

    return null;
}

EmbyTabs.selectNext = function (this: EmbyTabsInterface): void {
    const current = getSelectedTabButton(this);

    const sibling = getSibling(current as Element, 'nextSibling');

    if (sibling) {
        onClick.call(this, {
            target: sibling
        } as unknown as MouseEvent);
    }
};

EmbyTabs.selectPrevious = function (this: EmbyTabsInterface): void {
    const current = getSelectedTabButton(this);

    const sibling = getSibling(current as Element, 'previousSibling');

    if (sibling) {
        onClick.call(this, {
            target: sibling
        } as unknown as MouseEvent);
    }
};

EmbyTabs.triggerBeforeTabChange = function (this: EmbyTabsInterface): void {
    const tabs = this;
    const currentIdx = tabs.selectedIndex();
    if (typeof currentIdx === 'number') {
        triggerBeforeTabChange(tabs, currentIdx, null);
    }
};

EmbyTabs.triggerTabChange = function (this: EmbyTabsInterface): void {
    const tabs = this;

    tabs.dispatchEvent(
        new CustomEvent('tabchange', {
            detail: {
                selectedTabIndex: tabs.selectedIndex()
            }
        })
    );
};

EmbyTabs.setTabEnabled = function (this: EmbyTabsInterface, index: number, enabled: boolean): void {
    const btn = this.querySelector('.emby-tab-button[data-index="' + index + '"]');

    if (enabled) {
        btn?.classList.remove('hide');
    } else {
        btn?.classList.remove('add');
    }
};

interface CustomElementOptions {
    prototype: object;
    extends: string;
}

declare global {
    interface Document {
        registerElement(name: string, options: CustomElementOptions): CustomElementConstructor;
    }
}

document.registerElement('emby-tabs', {
    prototype: EmbyTabs,
    extends: 'div'
});

export default EmbyTabs;
