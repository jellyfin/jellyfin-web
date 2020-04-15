import loading from "loading";
import scroller from "scroller";
import dom from "dom";
import focusHandler from "focusHandler";
import focusManager from "focusManager";
import scrollHelper from "scrollHelper";
import browser from "browser";
import "emby-button";
import "css!assets/css/scrollstyles";

function focusViewSlider() {
    const selected = this.querySelector(".selected");
    if (selected) {
        focusManager.focus(selected);
    } else {
        focusManager.autoFocus(this);
    }
}

function createHeaderScroller(view, instance) {
    const userViewNames = view.querySelector(".userViewNames");
    userViewNames.classList.add("smoothScrollX");
    userViewNames.classList.add("focusable");
    userViewNames.classList.add("focuscontainer-x");
    userViewNames.style.scrollBehavior = "smooth";
    userViewNames.focus = focusViewSlider;
    loading.hide();
    setTimeout(() => {
        const initialTab = userViewNames.querySelector(".btnUserViewHeader");
        if (initialTab) {
            instance.setFocusDelay(view, initialTab);
        }
    }, 0);
}

function initEvents(view, instance) {
    const userViewNames = view.querySelector(".userViewNames");
    userViewNames.addEventListener("click", e => {
        const elem = dom.parentWithClass(e.target, "btnUserViewHeader");
        if (elem) {
            scrollHelper.toCenter(userViewNames, elem, true);
            instance.setFocusDelay(view, elem);
        }
    });
    userViewNames.addEventListener("focus", e => {
        const elem = dom.parentWithClass(e.target, "btnUserViewHeader");
        if (elem) {
            scrollHelper.toCenter(userViewNames, elem, true);
            instance.setFocusDelay(view, elem);
        }
    }, true);
}

function selectUserView(page, id, self) {
    const btn = page.querySelector(`.btnUserViewHeader[data-id='${id}']`);
    self.bodyScroller.slideTo(0, true);
    const contentScrollSlider = page.querySelector(".contentScrollSlider");
    contentScrollSlider.innerHTML = "";
    const promise = self.loadViewContent.call(self, page, id, btn.getAttribute("data-type"));
    if (promise && browser.animate) {
        promise.then(() => {
            fadeInRight(contentScrollSlider);
        });
    }
}

function fadeInRight(elem) {
    const keyframes = [{
        opacity: "0",
        transform: "translate3d(1%, 0, 0)",
        offset: 0
    }, {
        opacity: "1",
        transform: "none",
        offset: 1
    }];
    const timing = {
        duration: 300,
        iterations: 1
    };
    elem.animate(keyframes, timing);
}

export function tabbedPage(page, pageOptions) {
    const self = this;
    pageOptions = pageOptions || ({});
    const contentScrollSlider = page.querySelector(".contentScrollSlider");
    contentScrollSlider.classList.add("focuscontainer-x");
    const selectedItemInfoInner = page.querySelector(".selectedItemInfoInner");
    const selectedIndexElement = page.querySelector(".selectedIndex");
    const tagName = "button";
    self.renderTabs = tabs => {
        page.querySelector(".userViewNames").innerHTML = tabs.map(i => {
            return `<${tagName} is="emby-button" class="flat btnUserViewHeader button-flat" data-id="${i.Id}" data-type="${i.CollectionType || ""}"><span class="userViewButtonText">${i.Name}</span></${tagName}>`;
        }).join("");
        createHeaderScroller(page, self);
        createHorizontalScroller(page);
        initEvents(page, self);
    };
    let focusTimeout;
    let focusDelay = 0;
    self.setFocusDelay = (view, elem, immediate) => {
        const viewId = elem.getAttribute("data-id");
        const btn = view.querySelector(".btnUserViewHeader.selected");
        if (btn) {
            if (viewId === btn.getAttribute("data-id")) {
                return;
            }
        }
        if (elem !== btn) {
            if (btn) {
                btn.classList.remove("selected");
            }
            elem.classList.add("selected");
        }
        if (focusTimeout) {
            clearTimeout(focusTimeout);
        }
        const onTimeout = () => {
            selectUserView(view, viewId, self);
        };
        if (immediate) {
            onTimeout();
        } else {
            focusTimeout = setTimeout(onTimeout, focusDelay);
        }
        focusDelay = 700;
    };

    function createHorizontalScroller(view) {
        const scrollFrame = view.querySelector(".itemScrollFrame");
        const options = {
            horizontal: 1,
            itemNav: 0,
            mouseDragging: 1,
            touchDragging: 1,
            slidee: view.querySelector(".contentScrollSlider"),
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
            const scrollSlider = view.querySelector(".contentScrollSlider");
            self.focusHandler = new focusHandler({
                parent: scrollSlider,
                selectedItemInfoInner: selectedItemInfoInner,
                selectedIndexElement: selectedIndexElement,
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
    };
}
export default tabbedPage;
