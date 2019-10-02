define(['layoutManager', 'dom', 'css!./emby-scrollbuttons', 'registerElement', 'paper-icon-button-light'], function (layoutManager, dom) {
    'use strict';

    var EmbyScrollButtonsPrototype = Object.create(HTMLDivElement.prototype);

    EmbyScrollButtonsPrototype.createdCallback = function () {};

    function getScrollButtonHtml(direction) {
        var html = '';
        var icon = direction === 'left' ? '&#xE5CB;' : '&#xE5CC;';

        html += '<button type="button" is="paper-icon-button-light" data-ripple="false" data-direction="' + direction + '" class="emby-scrollbuttons-button">';
        html += '<i class="md-icon">' + icon + '</i>';
        html += '</button>';

        return html;
    }

    function getScrollPosition(parent) {
        if (parent.getScrollPosition) {
            return parent.getScrollPosition();
        }

        return 0;
    }

    function getScrollWidth(parent) {
        if (parent.getScrollSize) {
            return parent.getScrollSize();
        }

        return 0;
    }

    function updateScrollButtons(scrollButtons, scrollSize, scrollPos, scrollWidth) {
        // hack alert add twenty for rounding errors
        if (scrollWidth <= scrollSize + 20) {
            scrollButtons.scrollButtonsLeft.classList.add('hide');
            scrollButtons.scrollButtonsRight.classList.add('hide');
        }

        if (scrollPos > 0) {
            scrollButtons.scrollButtonsLeft.disabled = false;
        } else {
            scrollButtons.scrollButtonsLeft.disabled = true;
        }

        var scrollPosEnd = scrollPos + scrollSize;
        if (scrollWidth > 0 && scrollPosEnd >= scrollWidth) {
            scrollButtons.scrollButtonsRight.disabled = true;
        } else {
            scrollButtons.scrollButtonsRight.disabled = false;
        }
    }

    function onScroll(e) {
        var scrollButtons = this;
        var scroller = this.scroller;

        var scrollSize = getScrollSize(scroller);
        var scrollPos = getScrollPosition(scroller);
        var scrollWidth = getScrollWidth(scroller);

        updateScrollButtons(scrollButtons, scrollSize, scrollPos, scrollWidth);
    }

    function getStyleValue(style, name) {
        var value = style.getPropertyValue(name);
        if (!value) {
            return 0;
        }

        value = value.replace('px', '');
        if (!value) {
            return 0;
        }

        value = parseInt(value);
        if (isNaN(value)) {
            return 0;
        }

        return value;
    }

    function getScrollSize(elem) {
        var scrollSize = elem.offsetWidth;
        var style = window.getComputedStyle(elem, null);

        var paddingLeft = getStyleValue(style, 'padding-left');
        if (paddingLeft) {
            scrollSize -= paddingLeft;
        }

        var paddingRight = getStyleValue(style, 'padding-right');
        if (paddingRight) {
            scrollSize -= paddingRight;
        }

        var slider = elem.getScrollSlider();
        style = window.getComputedStyle(slider, null);

        paddingLeft = getStyleValue(style, 'padding-left');
        if (paddingLeft) {
            scrollSize -= paddingLeft;
        }

        paddingRight = getStyleValue(style, 'padding-right');
        if (paddingRight) {
            scrollSize -= paddingRight;
        }

        return scrollSize;
    }

    function onScrollButtonClick(e) {
        var scroller = this.parentNode.nextSibling;

        var direction = this.getAttribute('data-direction');
        var scrollSize = getScrollSize(scroller);
        var scrollPos = getScrollPosition(scroller);
        var scrollWidth = getScrollWidth(scroller);

        var newPos;
        if (direction === 'left') {
            newPos = Math.max(0, scrollPos - scrollSize);
        } else {
            newPos = scrollPos + scrollSize;
        }

        scroller.scrollToPosition(newPos, false);
    }

    EmbyScrollButtonsPrototype.attachedCallback = function () {
        var scroller = this.nextSibling;
        this.scroller = scroller;

        var parent = this.parentNode;
        parent.classList.add('emby-scroller-container');

        this.innerHTML = getScrollButtonHtml('left') + getScrollButtonHtml('right');

        var buttons = this.querySelectorAll('.emby-scrollbuttons-button');
        buttons[0].addEventListener('click', onScrollButtonClick);
        buttons[1].addEventListener('click', onScrollButtonClick);
        this.scrollButtonsLeft = buttons[0];
        this.scrollButtonsRight = buttons[1];

        var scrollHandler = onScroll.bind(this);
        this.scrollHandler = scrollHandler;
        scroller.addScrollEventListener(scrollHandler, {
            capture: false,
            passive: true
        });
    };

    EmbyScrollButtonsPrototype.detachedCallback = function () {
        var parent = this.scroller;
        this.scroller = null;

        var scrollHandler = this.scrollHandler;
        if (parent && scrollHandler) {
            parent.removeScrollEventListener(scrollHandler, {
                capture: false,
                passive: true
            });
        }

        this.scrollHandler = null;
        this.scrollButtonsLeft = null;
        this.scrollButtonsRight = null;
    };

    document.registerElement('emby-scrollbuttons', {
        prototype: EmbyScrollButtonsPrototype,
        extends: 'div'
    });
});