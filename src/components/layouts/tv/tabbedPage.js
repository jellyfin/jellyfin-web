import loading from "loading";
import scroller from "scroller";
import dom from "dom";
import focusHandler from "focusHandler";
import focusManager from "focusManager";
import "emby-button";

function createHeaderScroller(view, instance, initialTabId) {
    const userViewNames = view.querySelector('.userViewNames');
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
        scrollWidth: userViewNames.querySelectorAll('.btnUserViewHeader').length * (screen.width / 5)
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
    const userViewNames = view.querySelector('.userViewNames');
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

function selectUserView(page, id, self) {
    const btn = page.querySelector(`.btnUserViewHeader[data-id='${id}']`);
    self.bodyScroller.slideTo(0, true);
    const contentScrollSlider = page.querySelector(".contentScrollSlider");
    contentScrollSlider.innerHTML = "";
    const promise = self.loadViewContent.call(self, page, id, btn.getAttribute('data-type'));
    if (promise) {
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

function tabbedPage(page, pageOptions) {

    const self = this;
    pageOptions = pageOptions || {};
    const contentScrollSlider = page.querySelector('.contentScrollSlider');
    contentScrollSlider.classList.add('focuscontainer-x');
    const selectedItemInfoInner = page.querySelector('.selectedItemInfoInner');
    const selectedIndexElement = page.querySelector('.selectedIndex');
    const tagName = 'button';
    self.renderTabs = (tabs, initialTabId) => {
        page.querySelector('.viewsScrollSlider').innerHTML = tabs.map(({
            Id,
            CollectionType,
            Name
        }) => {

            return `<${tagName} is="emby-button" class="btnTabs btnUserViewHeader" data-id="${Id}" data-type="${CollectionType || ''}"><span class="userViewButtonText">${Name}</span></${tagName}>`;

        }).join('');
        createHeaderScroller(page, self, initialTabId);
        initEvents(page, self);
        createHorizontalScroller(page);
    };

    const viewsScrollSlider = page.querySelector('.viewsScrollSlider');
    viewsScrollSlider.classList.add('focusable');
    viewsScrollSlider.classList.add('focuscontainer-x');
    viewsScrollSlider.focus = focusViewSlider;

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
    self.setFocusDelay = (view, elem) => {
        const viewId = elem.getAttribute('data-id');
        const btn = view.querySelector('.btnUserViewHeader.selected');
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
            selectUserView(view, viewId, self);
        }, focusDelay);
        focusDelay = 700;
    };

    function createHorizontalScroller(view) {
        const scrollFrame = view.querySelector('.itemScrollFrame');
        const options = {
            horizontal: 1,
            itemNav: 0,
            mouseDragging: 1,
            touchDragging: 1,
            slidee: view.querySelector('.contentScrollSlider'),
            smart: true,
            releaseSwing: true,
            scrollBy: 200,
            speed: 270,
            immediateSpeed: pageOptions.immediateSpeed,
            elasticBounds: 1,
            dragHandle: 1,
            dynamicHandle: 1,
            clickBar: 1,
            scrollWidth: 500000
        };
        self.bodyScroller = new scroller(scrollFrame, options);
        self.bodyScroller.init();
        initFocusHandler(view);
    }

    function initFocusHandler(view) {
        if (pageOptions.handleFocus) {
            const scrollSlider = view.querySelector('.contentScrollSlider');
            self.focusHandler = new focusHandler({
                parent: scrollSlider,
                selectedItemInfoInner,
                selectedIndexElement,
                animateFocus: pageOptions.animateFocus,
                scroller: self.bodyScroller,
                enableBackdrops: true
            });
        }
    }

    self.destroy = () => {
        if (self.focusHandler) {
            self.focusHandler.destroy();
            self.focusHandler = null;
        }
        if (self.bodyScroller) {
            self.bodyScroller.destroy();
            self.bodyScroller = null;
        }
        if (self.headerScroller) {
            self.headerScroller.destroy();
            self.headerScroller = null;
        }
    };

}
export default tabbedPage;
