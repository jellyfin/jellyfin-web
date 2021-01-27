import './emby-scrollbuttons.scss';
import 'webcomponents.js/webcomponents-lite';
import '../emby-button/paper-icon-button-light';

/* eslint-disable indent */

const EmbyScrollButtonsPrototype = Object.create(HTMLDivElement.prototype);

    EmbyScrollButtonsPrototype.createdCallback = function () {};

    function getScrollButtonHtml(direction) {
        let html = '';
        const icon = direction === 'left' ? 'chevron_left' : 'chevron_right';

        html += '<button type="button" is="paper-icon-button-light" data-ripple="false" data-direction="' + direction + '" class="emby-scrollbuttons-button">';
        html += '<span class="material-icons ' + icon + '"></span>';
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
        // TODO: Check if hack is really needed
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

        const scrollPosEnd = scrollPos + scrollSize;
        if (scrollWidth > 0 && scrollPosEnd >= scrollWidth) {
            scrollButtons.scrollButtonsRight.disabled = true;
        } else {
            scrollButtons.scrollButtonsRight.disabled = false;
        }
    }

    function onScroll() {
        const scrollButtons = this;
        const scroller = this.scroller;

        const scrollSize = getScrollSize(scroller);
        const scrollPos = getScrollPosition(scroller);
        const scrollWidth = getScrollWidth(scroller);

        updateScrollButtons(scrollButtons, scrollSize, scrollPos, scrollWidth);
    }

    function getStyleValue(style, name) {
        let value = style.getPropertyValue(name);
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
        let scrollSize = elem.offsetWidth;
        let style = window.getComputedStyle(elem, null);

        let paddingLeft = getStyleValue(style, 'padding-left');
        if (paddingLeft) {
            scrollSize -= paddingLeft;
        }

        let paddingRight = getStyleValue(style, 'padding-right');
        if (paddingRight) {
            scrollSize -= paddingRight;
        }

        const slider = elem.getScrollSlider();
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

    function onScrollButtonClick() {
        const scroller = this.parentNode.nextSibling;

        const direction = this.getAttribute('data-direction');
        const scrollSize = getScrollSize(scroller);
        const scrollPos = getScrollPosition(scroller);

        let newPos;
        if (direction === 'left') {
            newPos = Math.max(0, scrollPos - scrollSize);
        } else {
            newPos = scrollPos + scrollSize;
        }

        scroller.scrollToPosition(newPos, false);
    }

    EmbyScrollButtonsPrototype.attachedCallback = function () {
        const scroller = this.nextSibling;
        this.scroller = scroller;

        const parent = this.parentNode;
        parent.classList.add('emby-scroller-container');

        this.innerHTML = getScrollButtonHtml('left') + getScrollButtonHtml('right');

        const buttons = this.querySelectorAll('.emby-scrollbuttons-button');
        buttons[0].addEventListener('click', onScrollButtonClick);
        buttons[1].addEventListener('click', onScrollButtonClick);
        this.scrollButtonsLeft = buttons[0];
        this.scrollButtonsRight = buttons[1];

        const scrollHandler = onScroll.bind(this);
        this.scrollHandler = scrollHandler;
        scroller.addScrollEventListener(scrollHandler, {
            capture: false,
            passive: true
        });
    };

    EmbyScrollButtonsPrototype.detachedCallback = function () {
        const parent = this.scroller;
        this.scroller = null;

        const scrollHandler = this.scrollHandler;
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

/* eslint-enable indent */
