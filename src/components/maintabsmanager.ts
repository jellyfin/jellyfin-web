import dom from '../utils/dom';
import browser from '../scripts/browser';
import Events from '../utils/events';
import '../elements/emby-tabs/emby-tabs';
import '../elements/emby-button/emby-button';

export interface TabInfo {
    name: string;
    href?: string;
    cssClass?: string;
    enabled?: boolean;
}

let tabOwnerView: HTMLElement | null = null;
const queryScope = document.querySelector('.skinHeader') as HTMLElement;
let headerTabsContainer: HTMLElement | null = null;
let tabsElem: any = null;

function ensureElements() {
    if (!headerTabsContainer && queryScope) {
        headerTabsContainer = queryScope.querySelector('.headerTabs');
    }
}

function onViewTabsReady(this: any) {
    this.selectedIndex(this.readySelectedIndex);
    this.readySelectedIndex = null;
}

function allowSwipe(target: HTMLElement): boolean {
    const allowSwipeOn = (elem: HTMLElement) => {
        if (dom.parentWithTag(elem, 'input')) return false;
        const classList = elem.classList;
        if (classList) return !classList.contains('scrollX') && !classList.contains('animatedScrollX');
        return true;
    };

    let parent: HTMLElement | null = target;
    while (parent != null) {
        if (!allowSwipeOn(parent)) return false;
        parent = parent.parentElement;
    }
    return true;
}

function configureSwipeTabs(view: HTMLElement, currentElement: any) {
    if (!browser.touch) return;

    const onSwipeLeft = (_e: any, target: HTMLElement) => {
        if (allowSwipe(target) && view.contains(target)) currentElement.selectNext();
    };

    const onSwipeRight = (_e: any, target: HTMLElement) => {
        if (allowSwipe(target) && view.contains(target)) currentElement.selectPrevious();
    };

    import('../scripts/touchHelper').then(({ default: TouchHelper }) => {
        const touchHelper = new TouchHelper(view.parentElement?.parentElement as HTMLElement);
        Events.on(touchHelper, 'swipeleft', onSwipeLeft);
        Events.on(touchHelper, 'swiperight', onSwipeRight);
        view.addEventListener('viewdestroy', () => touchHelper.destroy());
    });
}

export function setTabs(
    view: HTMLElement | null, 
    selectedIndex: number, 
    getTabsFn: () => TabInfo[], 
    getTabContainersFn?: () => HTMLElement[], 
    onBeforeTabChange?: (e: any) => void, 
    onTabChange?: (e: any) => void, 
    setSelectedIndex?: boolean
): { tabsContainer: HTMLElement | null, replaced: boolean, tabs?: any } {
    ensureElements();

    if (!view) {
        if (tabOwnerView) {
            document.body.classList.remove('withSectionTabs');
            if (headerTabsContainer) {
                headerTabsContainer.innerHTML = '';
                headerTabsContainer.classList.add('hide');
            }
            tabOwnerView = null;
        }
        return { tabsContainer: headerTabsContainer, replaced: false };
    }

    if (!headerTabsContainer) return { tabsContainer: null, replaced: false };

    if (!tabOwnerView) headerTabsContainer.classList.remove('hide');

    if (tabOwnerView !== view) {
        const tabsHtml = '<div is="emby-tabs"' + (selectedIndex == null ? '' : ` data-index="${selectedIndex}"`) + ' class="tabs-viewmenubar"><div class="emby-tabs-slider" style="white-space:nowrap;">' + getTabsFn().map((t, index) => {
            let tabClass = 'emby-tab-button';
            if (t.enabled === false) tabClass += ' hide';
            if (t.cssClass) tabClass += ' ' + t.cssClass;

            if (t.href) return `<a href="${t.href}" is="emby-linkbutton" class="${tabClass}" data-index="${index}"><div class="emby-button-foreground">${t.name}</div></a>`;
            return `<button type="button" is="emby-button" class="${tabClass}" data-index="${index}"><div class="emby-button-foreground">${t.name}</div></button>`;
        }).join('') + '</div></div>';

        headerTabsContainer.innerHTML = tabsHtml;
        (window as any).CustomElements?.upgradeSubtree(headerTabsContainer);

        document.body.classList.add('withSectionTabs');
        tabOwnerView = view;
        tabsElem = headerTabsContainer.querySelector('[is="emby-tabs"]');

        configureSwipeTabs(view, tabsElem);

        if (getTabContainersFn) {
            tabsElem.addEventListener('beforetabchange', (e: any) => {
                const tabContainers = getTabContainersFn();
                if (e.detail.previousIndex != null) tabContainers[e.detail.previousIndex]?.classList.remove('is-active');
                tabContainers[e.detail.selectedTabIndex]?.classList.add('is-active');
            });
        }

        if (onBeforeTabChange) tabsElem.addEventListener('beforetabchange', onBeforeTabChange);
        if (onTabChange) tabsElem.addEventListener('tabchange', onTabChange);

        if (setSelectedIndex !== false) {
            if (tabsElem.selectedIndex) tabsElem.selectedIndex(selectedIndex);
            else {
                tabsElem.readySelectedIndex = selectedIndex;
                tabsElem.addEventListener('ready', onViewTabsReady);
            }
        }

        return { tabsContainer: headerTabsContainer, tabs: tabsElem, replaced: true };
    }

    tabsElem.selectedIndex(selectedIndex);
    return { tabsContainer: headerTabsContainer, tabs: tabsElem, replaced: false };
}

export function selectedTabIndex(index?: number): void {
    if (index != null) tabsElem?.selectedIndex(index);
    else tabsElem?.triggerTabChange();
}

export function getTabsElement(): HTMLElement | null {
    return document.querySelector('.tabs-viewmenubar');
}

const maintabsmanager = { setTabs, selectedTabIndex, getTabsElement };
export default maintabsmanager;
