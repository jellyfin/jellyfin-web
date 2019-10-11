define([], function () {
    'use strict';

    const scrollIncrement = 40;
    const scrollTime = 500;
    const scrollExtra = Math.min(window.innerWidth, window.innerHeight)*0.05;

    var scrollElement;
    var scrollElementRect;
    var scrollTarget = {};
    var scrollTimer;
    var oldActiveElement;

    function clamp(min, value, max) {
        return value < min ? min : value > max ? max : value;
    }

    function nearestScroll(v1, v2, min, max) {
        var delta1 = v1 - min;
        var delta2 = max - v2;
        if (delta1 < 0 && delta1 < delta2) {
            return delta1;
        } else if (delta2 < 0) {
            return -delta2;
        }
        return 0;
    };

    function trend(v, v1, v2) {
        return (v1 < v && v2 < v1) || (v1 > v && v2 > v1) ? v2 : v1;
    };

    function getWindowRect() {
        return {
            left: window.scrollX,
            top: window.scrollY,
            right: window.scrollX + window.innerWidth - 1,
            bottom: window.scrollY + window.innerHeight - 1
        };
    }

    function getViewRect() {
        return {
            left: window.scrollX + scrollExtra,
            top: window.scrollY + scrollExtra,
            right: window.scrollX + window.innerWidth - 1 - scrollExtra,
            bottom: window.scrollY + window.innerHeight - 1 - scrollExtra
        };
    }

    function getItemRect(elem) {
        var rect = elem.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX,
            top: rect.top + window.scrollY,
            right: rect.right + window.scrollX,
            bottom: rect.bottom + window.scrollY
        };
    }

    var origScrollTo = window.scrollTo;
    var origScrollBy = window.scrollBy;

    window.scroll = function(x, y) {
        return scrollTo(x, y, false);
    };

    window.scrollTo = function(options) {
        if (typeof options !== 'object') {
            return scrollTo(arguments[0], arguments[1]);
        }
        return scrollTo(options.left, options.top, options.behavior === 'smooth');
    };

    window.scrollBy = function scrollTo(options) {
        if (typeof options !== 'object') {
            return scrollBy(arguments[0], arguments[1]);
        }
        return scrollBy(options.left, options.top, options.behavior === 'smooth');
    };

    function resetScroll() {
        cancelAnimationFrame(scrollTimer);
        scrollTimer = undefined;
    }

    function scrollTo(x, y, smooth) {
        //console.log('scrollTo (' + x + ', ' + y + ', ' + smooth + ')');

        if (smooth !== true) {
            resetScroll();
            origScrollTo(x, y);
            return true;
        }

        if (scrollTimer) {
            scrollTarget.x = trend(window.scrollX, scrollTarget.x, x);
            scrollTarget.y = trend(window.scrollY, scrollTarget.y, y);
        } else {
            scrollTarget.x = x;
            scrollTarget.y = y;
        }

        var scrollMaxX = Math.max(0, Math.max(document.body.scrollWidth, document.body.offsetWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth) - window.innerWidth);
        var scrollMaxY = Math.max(0, Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight) - window.innerHeight);

        scrollTarget.x = clamp(0, scrollTarget.x, scrollMaxX);
        scrollTarget.y = clamp(0, scrollTarget.y, scrollMaxY);

        if (scrollTarget.x === window.scrollX && scrollTarget.y === window.scrollY) {
            //console.log('cancel scroll animation');
            resetScroll();
            return true;
        }

        //console.log('scroll from (' + window.scrollX + ', ' + window.scrollY + ') to (' + scrollTarget.x + ', ' + scrollTarget.y + ')');

        if (!scrollTimer) {
            var start;

            function scrollAnim(currentTimestamp) {
                start = start || currentTimestamp;

                var dx = scrollTarget.x - window.scrollX;
                var dy = scrollTarget.y - window.scrollY;
                //console.log('> ' + dx + ', ' + dy + ' = ' + window.scrollX + ', ' + window.scrollY);

                if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                    //console.log('scrolled');
                    scrollTimer = undefined;
                    origScrollTo(scrollTarget.x, scrollTarget.y);
                    return;
                }

                var k = Math.min(0.5, (currentTimestamp - start) / scrollTime);

                dx = Math.sign(dx)*Math.ceil(Math.abs(dx*k));
                dy = Math.sign(dy)*Math.ceil(Math.abs(dy*k));

                //console.log('> ' + k + ' > ' + dx + ', ' + dy);
                origScrollBy(dx, dy);

                scrollTimer = requestAnimationFrame(scrollAnim);
            };

            scrollTimer = requestAnimationFrame(scrollAnim);
        }

        return false;
    }

    function scrollBy(dx, dy, smooth) {
        //console.log('scrollBy (' + dx + ', ' + dy + ', ' + smooth + ')');
        return scrollTo(window.scrollX + dx, window.scrollY + dy, smooth);
    }

    function scrollIntoView(elem, scrollX, scrollY) {
        if (!elem) {
            throw 'Element to scroll is undefined';
        }

        scrollX = scrollX || 0;
        scrollY = scrollY || 0;

        // scroll to element container instead
        elem = elem.closest('.focuscontainer-scroll, .inputContainer, .selectContainer, .checkboxContainer, .paperList') || elem;

        //console.log('scrollIntoView (' + elem.tagName + ', ' + scrollX + ', ' + scrollY + ')');

        if (elem !== scrollElement) {
            scrollElementRect = getItemRect(elem);
            scrollElement = elem;
        }

        var rect = scrollElementRect;

        var viewRect = getViewRect();

        //console.log('rect (' + rect.left + ', ' + rect.top + ', ' + rect.right + ', ' + rect.bottom + '), viewRect (' + viewRect.left + ', ' + viewRect.top + ', ' + viewRect.right + ', ' + viewRect.bottom + ')');

        var scrollTarget = {};

        if (scrollX === 0) {
            // scroll nearest
            scrollTarget.x = nearestScroll(rect.left, rect.right, viewRect.left, viewRect.right) + window.scrollX;
        } else if (scrollX < 0 && rect.left < viewRect.left) {
            // scroll left
            scrollTarget.x = Math.ceil(window.scrollX + (rect.left - viewRect.left));
        } else if (scrollX > 0 && rect.right > viewRect.right) {
            // scroll right
            scrollTarget.x = Math.floor(window.scrollX + (rect.right - viewRect.right));
        } else {
            scrollTarget.x = window.scrollX;
        }

        if (scrollY === 0) {
            // scroll nearest
            scrollTarget.y = nearestScroll(rect.top, rect.bottom, viewRect.top, viewRect.bottom) + window.scrollY;
        } else if (scrollY < 0 && rect.top < viewRect.top) {
            // scroll up
            scrollTarget.y = Math.ceil(window.scrollY + (rect.top - viewRect.top));
        } else if (scrollY > 0 && rect.bottom > viewRect.bottom) {
            // scroll down
            scrollTarget.y = Math.floor(window.scrollY + (rect.bottom - viewRect.bottom));
        } else {
            scrollTarget.y = window.scrollY;
        }

        if (scrollTo(scrollTarget.x, scrollTarget.y, true)) {
            return true;
        }

        var windowRect = getWindowRect();

        return ((scrollX < 0 && rect.left >= windowRect.left) ||
                (scrollX > 0 && rect.right <= windowRect.right) ||
                (scrollX === 0 && rect.left >= windowRect.left && rect.right <= windowRect.right)) &&
            ((scrollY < 0 && rect.top >= windowRect.top) ||
                (scrollY > 0 && rect.bottom <= windowRect.bottom) ||
                (scrollY === 0 && rect.top >= windowRect.top && rect.bottom <= windowRect.bottom));
    }

    function prepare() {
        oldActiveElement = document.activeElement;
    }

    function scrollInDirection(scrollX, scrollY) {
        if (!document.activeElement || scrollIntoView(document.activeElement, scrollX, scrollY)) {
            if (document.activeElement === oldActiveElement) {
                scrollBy(scrollX, scrollY, true);
            }
        }
    }

    return {
        scrollTo: scrollTo,
        scrollBy: scrollBy,
        scrollIntoView: scrollIntoView,
        reset: resetScroll,
        prepare: prepare,
        scrollLeft: function() { scrollInDirection(-scrollIncrement, 0); },
        scrollRight: function() { scrollInDirection(scrollIncrement, 0); },
        scrollUp: function() { scrollInDirection(0, -scrollIncrement); },
        scrollDown: function() { scrollInDirection(0, scrollIncrement); }
    };
});
