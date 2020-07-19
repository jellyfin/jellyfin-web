import loading from 'loading';
import scroller from 'scroller';
import dom from 'dom';
import {FocusHandler} from './focusHandler';
import focusManager from 'focusManager';
import browser from 'browser';
import 'emby-button';

function createHeaderScroller(view, instance, initialTabId) {
    const userViewNames = document.querySelector('.userViewNames');
    const scrollFrame = userViewNames.querySelector('.scrollFrame');
    const options = {
        horizontal: 1,
        itemNav: 'basic',
        mouseDragging: 1,
        touchDragging: 1,
        slidee: userViewNames.querySelector('.scrollSlider'),
        itemSelector: '.btnUserViewHeader',
        activateOn: 'focus',
        smart: true,
        releaseSwing: true,
        scrollBy: 200,
        speed: 500,
        elasticBounds: 1,
        dragHandle: 1,
        dynamicHandle: 1,
        clickBar: 1,
        scrollWidth: 20000
    };
    instance.headerScroller = new scroller(scrollFrame, options);
    instance.headerScroller.init();
    loading.hide();
    let initialTab = initialTabId ? userViewNames.querySelector(`.btnUserViewHeader[data-id='${initialTabId}']`) : null;
    if (!initialTab) {
        initialTab = userViewNames.querySelector('.btnUserViewHeader');
    }
    instance.setFocusDelay(view, initialTab);
}

function initEvents(view, instance) {
    const userViewNames = document.querySelector('.userViewNames');
    userViewNames.addEventListener('click', ({
        target
    }) => {

        const elem = dom.parentWithClass(target, 'btnUserViewHeader');

        if (elem) {
            elem.focus();
        }
    });
    userViewNames.addEventListener('focus', ({
        target
    }) => {

        const elem = dom.parentWithClass(target, 'btnUserViewHeader');

        if (elem) {
            instance.headerScroller.toCenter(elem);
            instance.setFocusDelay(view, elem);
        }
    }, true);
}

function selectUserView(page, id, instance) {
    const btn = document.querySelector(`.btnUserViewHeader[data-id='${id}']`);
    instance.bodyScroller.slideTo(0, true);
    const contentScrollSlider = document.querySelector('.contentScrollSlider');
    contentScrollSlider.innerHTML = '';
    const promise = instance.loadViewContent.call(this, page, id, btn.getAttribute('data-type'));
    if (promise && browser.animate && !browser.slow) {
        promise.then(() => {
            fadeInRight(contentScrollSlider);
        });
    }
}

function fadeInRight(elem, iterations) {
    const translateX = Math.round(window.innerWidth / 100);
    const keyframes = [{
        opacity: '0',
        transform: `translate3d(${translateX}px, 0, 0)`,
        offset: 0
    },
    {
        opacity: '1',
        transform: 'none',
        offset: 1
    }
    ];
    const timing = {
        duration: 300,
        iterations
    };
    elem.animate(keyframes, timing);
}

function createHorizontalScroller(view, instance) {
    const scrollFrame = document.querySelector('.itemScrollFrame');
    const options = {
        horizontal: 1,
        itemNav: 0,
        mouseDragging: 1,
        touchDragging: 1,
        slidee: document.querySelector('.contentScrollSlider'),
        smart: true,
        releaseSwing: true,
        scrollBy: 200,
        speed: 270,
        immediateSpeed: instance.pageOptions.immediateSpeed,
        elasticBounds: 1,
        dragHandle: 1,
        dynamicHandle: 1,
        clickBar: 1,
        scrollWidth: 500000
    };
    instance.bodyScroller = new scroller(scrollFrame, options);
    instance.bodyScroller.init();
    initFocusHandler(instance);
}

function initFocusHandler(instance) {
    if (instance.pageOptions.handleFocus) {
        const scrollSlider = document.querySelector('.contentScrollSlider');
        instance.focusHandler = new FocusHandler({
            parent: scrollSlider,
            selectedItemInfoInner: document.querySelector('.selectedItemInfoInner'),
            animateFocus: instance.pageOptions.animateFocus,
            scroller: instance.bodyScroller,
            enableBackdrops: true
        });
    }
}

function focusViewSlider() {
    const selected = this.querySelector('.selected');
    if (selected) {
        focusManager.focus(selected);
    } else {
        focusManager.autoFocus(this);
    }
}

let focusTimeout;
let focusDelay = 0;
export class TabbedPage {
    constructor(page, pageOptions) {
        this.pageOptions = pageOptions || {};
        const contentScrollSlider = document.querySelector('.contentScrollSlider');
        contentScrollSlider.classList.add('focuscontainer-x');
        this.renderTabs = (tabs, initialTabId) => {
            document.querySelector('.viewsScrollSlider').innerHTML = tabs.map(({ Id, CollectionType, Name }) => {
                return `<button is="emby-button" class="btnTabs btnUserViewHeader" data-id="${Id}" data-type="${CollectionType || ''}"><span class="userViewButtonText">${Name}</span></button>`;
            }).join('');
            createHeaderScroller(page, this, initialTabId);
            initEvents(page, this);
            createHorizontalScroller(page, this);
        };
        const viewsScrollSlider = document.querySelector('.viewsScrollSlider');
        viewsScrollSlider.classList.add('focusable');
        viewsScrollSlider.classList.add('focuscontainer-x');
        viewsScrollSlider.focus = focusViewSlider;

    }

    setFocusDelay(view, elem) {
        const viewId = elem.getAttribute('data-id');
        const btn = document.querySelector('.btnUserViewHeader.selected');
        if (btn) {
            if (viewId == btn.getAttribute('data-id')) {
                return;
            }
            btn.classList.remove('selected');
        }
        elem.classList.add('selected');
        if (focusTimeout) {
            clearTimeout(focusTimeout);
        }
        focusTimeout = setTimeout(() => {
            selectUserView(view, viewId, this);
        }, focusDelay);
        focusDelay = 700;
    }

    destroy () {
        if (this.focusHandler) {
            this.focusHandler.destroy();
            this.focusHandler = null;
        }
        if (this.bodyScroller) {
            this.bodyScroller.destroy();
            this.bodyScroller = null;
        }
        if (this.headerScroller) {
            this.headerScroller.destroy();
            this.headerScroller = null;
        }
    }

}
export default TabbedPage;
