import './emby-scrollbuttons.scss';
import 'webcomponents.js/webcomponents-lite';
import '../emby-button/paper-icon-button-light';
import globalize from 'lib/globalize';
import { scrollerItemSlideIntoView } from './utils';

const EmbyScrollButtonsPrototype = Object.create(HTMLDivElement.prototype);

EmbyScrollButtonsPrototype.createdCallback = function () {
    // no-op
};

function getScrollButtonHtml(direction) {
    let html = '';
    const icon = direction === 'left' ? 'chevron_left' : 'chevron_right';
    const title = direction === 'left' ? globalize.translate('Previous') : globalize.translate('Next') ;

    html += `<button type="button" is="paper-icon-button-light" data-ripple="false" data-direction="${direction}" title="${title}" class="emby-scrollbuttons-button">`;
    html += '<span class="material-icons ' + icon + '" aria-hidden="true"></span>';
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
    let localeAwarePos = scrollPos;
    if (globalize.getIsElementRTL(scrollButtons)) {
        localeAwarePos *= -1;
    }

    // TODO: Check if hack is really needed
    // hack alert add twenty for rounding errors
    if (scrollWidth <= scrollSize + 20) {
        scrollButtons.scrollButtonsLeft.classList.add('hide');
        scrollButtons.scrollButtonsRight.classList.add('hide');
    } else {
        scrollButtons.scrollButtonsLeft.classList.remove('hide');
        scrollButtons.scrollButtonsRight.classList.remove('hide');
    }

    if (localeAwarePos > 0) {
        scrollButtons.scrollButtonsLeft.disabled = false;
    } else {
        scrollButtons.scrollButtonsLeft.disabled = true;
    }

    const scrollPosEnd = localeAwarePos + scrollSize;
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

    value = parseInt(value, 10);
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
    const direction = this.getAttribute('data-direction');
    const scroller = this.parentNode.nextSibling;
    const scrollPosition = getScrollPosition(scroller);
    scrollerItemSlideIntoView({
        direction,
        scroller,
        scrollState: {
            scrollPos: scrollPosition
        }
    });
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

    requestAnimationFrame(() => {
        this.scrollHandler();
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

