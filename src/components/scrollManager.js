define(["dom", "browser", "layoutManager"], function (dom, browser, layoutManager) {
    "use strict";

    var ScrollTime = 200;

    // FIXME: Need to scroll to top of page to fully show the top menu. This can be solved by some marker of top most elements or their containers
    var _minimumScrollY = 0;
    /**
     * Returns minimum vertical scroll.
     * Scroll less than that value will be zeroed.
     *
     * @return {number} minimum vertical scroll
     */
    function minimumScrollY() {
        if (_minimumScrollY === 0) {
            var topMenu = document.querySelector(".headerTop");
            if (topMenu) {
                _minimumScrollY = topMenu.clientHeight;
            }
        }
        return _minimumScrollY;
    }

    var supportsSmoothScroll = "scrollBehavior" in document.documentElement.style;

    var supportsScrollToOptions = false;
    try {
        var elem = document.createElement("div");

        var opts = Object.defineProperty({}, "behavior", {
            get: function () {
                supportsScrollToOptions = true;
            }
        });

        elem.scrollTo(opts);
    } catch(e) {}

    /**
     * Returns value clamped by range [min, max].
     *
     * @param {number} value clamped value
     * @param {number} min begining of range
     * @param {number} max ending of range
     * @return {number} clamped value
     */
    function clamp(value, min, max) {
        return value <= min ? min : value >= max ? max : value;
    }

    /**
     * Returns the required delta to fit range 1 into range 2.
     * In case of range 1 is bigger than range 2 returns delta to fit most out of range part.
     *
     * @param {number} begin1 begining of range 1
     * @param {number} end1 ending of range 1
     * @param {number} begin2 begining of range 2
     * @param {number} end2 ending of range 2
     * @return {number} delta: <0 move range1 to the left, >0 - to the right
     */
    function fitRange(begin1, end1, begin2, end2) {
        var delta1 = begin1 - begin2;
        var delta2 = end2 - end1;
        if (delta1 < 0 && delta1 < delta2) {
            return -delta1;
        } else if (delta2 < 0) {
            return delta2;
        }
        return 0;
    };

    /**
     * Returns parent element that can be scrolled. If no such, returns documentElement.
     *
     * @param {HTMLElement} element element for which parent is being searched
     * @param {boolean} vertical search for vertical scrollable parent
     */
    function getScrollableParent(element, vertical) {
        if (element) {
            var parent = element.parentElement;

            while (parent) {
                if ((!vertical && parent.scrollWidth > parent.clientWidth && parent.classList.contains("scrollX")) ||
                    (vertical && parent.scrollHeight > parent.clientHeight) && parent.classList.contains("scrollY")) {
                    return parent;
                }

                parent = parent.parentElement;
            }
        }

        return document.scrollingElement || document.documentElement;
    }

    /**
     * @typedef {Object} ScrollerData
     * @property {number} scrollPos current scroll position
     * @property {number} scrollSize scroll size
     * @property {number} clientSize client size
     */

    /**
     * Returns scroll data for specified orientation.
     *
     * @param {HTMLElement} scroller scroller
     * @param {boolean} vertical vertical scroll data
     * @return {ScrollerData} scroll data
     */
    function getScrollerData(scroller, vertical) {
        var data = {};

        if (!vertical) {
            data.scrollPos = scroller.scrollLeft;
            data.scrollSize = scroller.scrollWidth;
            data.clientSize = scroller.clientWidth;
        } else {
            data.scrollPos = scroller.scrollTop;
            data.scrollSize = scroller.scrollHeight;
            data.clientSize = scroller.clientHeight;
        }

        return data;
    }

    /**
     * Returns position of child of scroller for specified orientation.
     *
     * @param {HTMLElement} scroller scroller
     * @param {HTMLElement} element child of scroller
     * @param {boolean} vertical vertical scroll
     * @return {number} child position
     */
    function getScrollerChildPos(scroller, element, vertical) {
        var elementRect = element.getBoundingClientRect();
        var scrollerRect = scroller.getBoundingClientRect();

        var scrollerLeft = scrollerRect.left;
        var scrollerTop = scrollerRect.top;

        // documentElement scrolls itself - coordinates is changed relative to viewport
        if (scroller === getScrollableParent(null, false)) {
            scrollerLeft += scroller.scrollLeft;
            scrollerTop += scroller.scrollTop;
        }

        if (!vertical) {
            return scroller.scrollLeft + elementRect.left - scrollerLeft;
        } else {
            return scroller.scrollTop + elementRect.top - scrollerTop;
        }
    }

    /**
     * Returns scroll position for element.
     *
     * @param {ScrollerData} scrollerData scroller data
     * @param {number} elementPos child element position
     * @param {number} elementSize child element size
     * @param {boolean} centered scroll to center
     * @return {number} scroll position
     */
    function calcScroll(scrollerData, elementPos, elementSize, centered) {
        var maxScroll = scrollerData.scrollSize - scrollerData.clientSize;

        var scroll;

        if (centered) {
            scroll = elementPos + (elementSize - scrollerData.clientSize) / 2;
        } else {
            var delta = fitRange(elementPos, elementPos + elementSize - 1, scrollerData.scrollPos, scrollerData.scrollPos + scrollerData.clientSize - 1);
            scroll = scrollerData.scrollPos - delta;
        }

        return clamp(Math.round(scroll), 0, maxScroll);
    }

    /**
     * Calls scrollTo function in proper way.
     *
     * @param {HTMLElement} scroller scroller
     * @param {ScrollToOptions} options scroll options
     */
    function scrollToHelper(scroller, options) {
        if ("scrollTo" in scroller) {
            if (!supportsScrollToOptions) {
                var scrollX = (options.left !== undefined ? options.left : scroller.scrollLeft);
                var scrollY = (options.top !== undefined ? options.top : scroller.scrollTop);
                scroller.scrollTo(scrollX, scrollY);
            } else {
                scroller.scrollTo(options);
            }
        } else if ("scrollLeft" in scroller) {
            if (options.left !== undefined) {
                scroller.scrollLeft = options.left;
            }
            if (options.top !== undefined) {
                scroller.scrollTop = options.top;
            }
        }
    }

    /**
     * Performs built-in scroll.
     *
     * @param {HTMLElement} xScroller horizontal scroller
     * @param {number} scrollX horizontal coordinate
     * @param {HTMLElement} yScroller vertical scroller
     * @param {number} scrollY vertical coordinate
     * @param {boolean} smooth smooth scrolling
     */
    function builtinScroll(xScroller, scrollX, yScroller, scrollY, smooth) {
        var scrollBehavior = smooth ? "smooth" : "instant";

        if (xScroller !== yScroller) {
            scrollToHelper(xScroller, {left: scrollX, behavior: scrollBehavior});
            scrollToHelper(yScroller, {top: scrollY, behavior: scrollBehavior});
        } else {
            scrollToHelper(xScroller, {left: scrollX, top: scrollY, behavior: scrollBehavior});
        }
    }

    var scrollTimer;

    /**
     * Resets scroll timer to stop scrolling.
     */
    function resetScrollTimer() {
        cancelAnimationFrame(scrollTimer);
        scrollTimer = undefined;
    }

    /**
     * Performs animated scroll.
     *
     * @param {HTMLElement} xScroller horizontal scroller
     * @param {number} scrollX horizontal coordinate
     * @param {HTMLElement} yScroller vertical scroller
     * @param {number} scrollY vertical coordinate
     */
    function animateScroll(xScroller, scrollX, yScroller, scrollY) {
        var start;

        function scrollAnim(currentTimestamp) {
            start = start || currentTimestamp;

            var dx = scrollX - xScroller.scrollLeft;
            var dy = scrollY - yScroller.scrollTop;

            if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                resetScrollTimer();
                xScroller.scrollLeft = scrollX;
                yScroller.scrollTop = scrollY;
                return;
            }

            var k = Math.min(1, (currentTimestamp - start) / ScrollTime);

            dx = Math.round(dx*k);
            dy = Math.round(dy*k);

            builtinScroll(xScroller, xScroller.scrollLeft + dx, yScroller, yScroller.scrollTop + dy, false);

            scrollTimer = requestAnimationFrame(scrollAnim);
        };

        scrollTimer = requestAnimationFrame(scrollAnim);
    }

    /**
     * Performs scroll.
     *
     * @param {HTMLElement} xScroller horizontal scroller
     * @param {number} scrollX horizontal coordinate
     * @param {HTMLElement} yScroller vertical scroller
     * @param {number} scrollY vertical coordinate
     * @param {boolean} smooth smooth scrolling
     */
    function doScroll(xScroller, scrollX, yScroller, scrollY, smooth) {

        resetScrollTimer();

        if (smooth && useAnimatedScroll()) {
            animateScroll(xScroller, scrollX, yScroller, scrollY);
        } else {
            builtinScroll(xScroller, scrollX, yScroller, scrollY, smooth);
        }
    }

    /**
     * Returns true if smooth scroll must be used.
     */
    function useSmoothScroll() {

        if (browser.tizen) {
            return true;
        }

        return false;
    };

    /**
     * Returns true if animated implementation of smooth scroll must be used.
     */
    function useAnimatedScroll() {
        // Add block to force using (or not) of animated implementation

        return !supportsSmoothScroll;
    };

    /**
     * Returns true if scroll manager is enabled.
     */
    var isEnabled = function() {

        if (!layoutManager.tv) {
            return false;
        }

        if (browser.tizen) {
            return true;
        }

        if (browser.web0s) {
            return true;
        }

        return false;
    };

    /**
     * Scrolls the document to a given position.
     *
     * @param {number} scrollX horizontal coordinate
     * @param {number} scrollY vertical coordinate
     * @param {boolean} [smooth=false] smooth scrolling
     */
    var scrollTo = function(scrollX, scrollY, smooth) {

        smooth = !!smooth;

        // Scroller is document itself by default
        var scroller = getScrollableParent(null, false);

        var xScrollerData = getScrollerData(scroller, false);
        var yScrollerData = getScrollerData(scroller, true);

        scrollX = clamp(Math.round(scrollX), 0, xScrollerData.scrollSize - xScrollerData.clientSize);
        scrollY = clamp(Math.round(scrollY), 0, yScrollerData.scrollSize - yScrollerData.clientSize);

        doScroll(scroller, scrollX, scroller, scrollY, smooth);
    }

    /**
     * Scrolls the document to a given element.
     *
     * @param {HTMLElement} element target element of scroll task
     * @param {boolean} [smooth=false] smooth scrolling
     */
    var scrollToElement = function(element, smooth) {

        smooth = !!smooth;

        var scrollCenterX = true;
        var scrollCenterY = true;

        var offsetParent = element.offsetParent;

        var isFixed = offsetParent && !offsetParent.offsetParent;

        // Scroll fixed elements to nearest edge (or do not scroll at all)
        if (isFixed) {
            scrollCenterX = scrollCenterY = false;
        }

        var xScroller = getScrollableParent(element, false);
        var yScroller = getScrollableParent(element, true);

        var elementRect = element.getBoundingClientRect();

        var xScrollerData = getScrollerData(xScroller, false);
        var yScrollerData = getScrollerData(yScroller, true);

        var xPos = getScrollerChildPos(xScroller, element, false);
        var yPos = getScrollerChildPos(yScroller, element, true);

        var scrollX = calcScroll(xScrollerData, xPos, elementRect.width, scrollCenterX);
        var scrollY = calcScroll(yScrollerData, yPos, elementRect.height, scrollCenterY);

        // HACK: Scroll to top for top menu because it is hidden
        // FIXME: Need a marker to scroll top/bottom
        if (isFixed && elementRect.bottom < 0) {
            scrollY = 0;
        }

        // HACK: Ensure we are at the top
        // FIXME: Need a marker to scroll top/bottom
        if (scrollY < minimumScrollY()) {
            scrollY = 0;
        }

        doScroll(xScroller, scrollX, yScroller, scrollY, smooth);
    }

    if (isEnabled()) {
        dom.addEventListener(window, "focusin", function(e) {
            setTimeout(function() {
                scrollToElement(e.target, useSmoothScroll());
            }, 0);
        }, {capture: true});
    }

    return {
        isEnabled: isEnabled,
        scrollTo: scrollTo,
        scrollToElement: scrollToElement
    };
});
