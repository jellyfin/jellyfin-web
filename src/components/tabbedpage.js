define(['loading', 'scroller', 'focusHandler', 'focusManager', 'scrollHelper', 'browser', 'emby-button', 'scrollStyles'], function (loading, scroller, focusHandler, focusManager, scrollHelper, browser) {
    'use strict';

    function focusViewSlider() {

        var selected = this.querySelector('.selected');

        if (selected) {
            focusManager.focus(selected);
        } else {
            focusManager.autoFocus(this);
        }
    }

    function createHeaderScroller(view, instance) {

        var userViewNames = view.querySelector('.userViewNames');

        userViewNames.classList.add('smoothScrollX');
        userViewNames.classList.add('focusable');
        userViewNames.classList.add('focuscontainer-x');
        userViewNames.style.scrollBehavior = 'smooth';
        userViewNames.focus = focusViewSlider;

        loading.hide();

        setTimeout(function () {
            var initialTab = userViewNames.querySelector('.btnUserViewHeader');

            if (initialTab) {
                instance.setFocusDelay(view, initialTab);
            }

        }, 0);
    }

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function initEvents(view, instance) {

        // Catch events on the view headers
        var userViewNames = view.querySelector('.userViewNames');
        userViewNames.addEventListener('click', function (e) {

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                scrollHelper.toCenter(userViewNames, elem, true);
                instance.setFocusDelay(view, elem);
            }
        });

        userViewNames.addEventListener('focus', function (e) {

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                scrollHelper.toCenter(userViewNames, elem, true);
                instance.setFocusDelay(view, elem);
            }
        }, true);
    }

    function selectUserView(page, id, self) {

        var btn = page.querySelector(".btnUserViewHeader[data-id='" + id + "']");

        self.bodyScroller.slideTo(0, true);

        var contentScrollSlider = page.querySelector('.contentScrollSlider');
        contentScrollSlider.innerHTML = '';
        var promise = self.loadViewContent.call(self, page, id, btn.getAttribute('data-type'));

        if (promise && browser.animate) {
            promise.then(function () {
                fadeInRight(contentScrollSlider);
            });
        }
    }

    function fadeInRight(elem) {

        var keyframes = [
            { opacity: '0', transform: 'translate3d(1%, 0, 0)', offset: 0 },
            { opacity: '1', transform: 'none', offset: 1 }];
        var timing = { duration: 300, iterations: 1 };
        elem.animate(keyframes, timing);
    }

    function tabbedPage(page, pageOptions) {

        var self = this;
        pageOptions = pageOptions || {};

        // lock the height so that the location of the top tabs won't fluctuate
        var contentScrollSlider = page.querySelector('.contentScrollSlider');
        contentScrollSlider.classList.add('focuscontainer-x');

        var selectedItemInfoInner = page.querySelector('.selectedItemInfoInner');
        var selectedIndexElement = page.querySelector('.selectedIndex');

        var tagName = 'button';

        self.renderTabs = function (tabs) {

            page.querySelector('.userViewNames').innerHTML = tabs.map(function (i) {

                return '<' + tagName + ' is="emby-button" class="flat btnUserViewHeader button-flat" data-id="' + i.Id + '" data-type="' + (i.CollectionType || '') + '"><span class="userViewButtonText">' + i.Name + '</span></' + tagName + '>';

            }).join('');

            createHeaderScroller(page, self);
            createHorizontalScroller(page);
            initEvents(page, self);
        };

        var focusTimeout;
        var focusDelay = 0;
        self.setFocusDelay = function (view, elem, immediate) {

            var viewId = elem.getAttribute('data-id');

            var btn = view.querySelector('.btnUserViewHeader.selected');

            if (btn) {

                if (viewId === btn.getAttribute('data-id')) {
                    return;
                }
            }

            if (elem !== btn) {
                if (btn) {
                    btn.classList.remove('selected');
                }
                elem.classList.add('selected');
            }

            if (focusTimeout) {
                clearTimeout(focusTimeout);
            }

            var onTimeout = function () {

                selectUserView(view, viewId, self);

            };

            if (immediate) {
                onTimeout();
            } else {
                focusTimeout = setTimeout(onTimeout, focusDelay);
            }

            // No delay the first time
            focusDelay = 700;
        };

        function createHorizontalScroller(view) {

            var scrollFrame = view.querySelector('.itemScrollFrame');

            var options = {
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
            initFocusHandler(view, self.bodyScroller);
        }

        function initFocusHandler(view) {

            if (pageOptions.handleFocus) {

                var scrollSlider = view.querySelector('.contentScrollSlider');

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

        self.destroy = function () {

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

    return tabbedPage;
});
