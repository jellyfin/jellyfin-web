import scroller from '../../libraries/scroller';
import dom from '../../scripts/dom';
import layoutManager from '../../components/layoutManager';
import inputManager from '../../scripts/inputManager';
import focusManager from '../../components/focusManager';
import browser from '../../scripts/browser';
import './emby-scroller.css';

function initCenterFocus(elem, scrollerInstance) {
    dom.addEventListener(elem, 'focus', function (e) {
        const focused = focusManager.focusableParent(e.target);
        if (focused) {
            scrollerInstance.toCenter(focused);
        }
    }, {
        capture: true,
        passive: true
    });
}

function onInputCommand(e) {
    const cmd = e.detail.command;
    if (cmd === 'end') {
        focusManager.focusLast(this, '.' + this.getAttribute('data-navcommands'));
        e.preventDefault();
        e.stopPropagation();
    } else if (cmd === 'pageup') {
        focusManager.moveFocus(e.target, this, '.' + this.getAttribute('data-navcommands'), -12);
        e.preventDefault();
        e.stopPropagation();
    } else if (cmd === 'pagedown') {
        focusManager.moveFocus(e.target, this, '.' + this.getAttribute('data-navcommands'), 12);
        e.preventDefault();
        e.stopPropagation();
    }
}

function loadScrollButtons(scroller) {
    import('../emby-scrollbuttons/emby-scrollbuttons').then(() => {
        scroller.insertAdjacentHTML('beforebegin', '<div is="emby-scrollbuttons" class="emby-scrollbuttons padded-right"></div>');
    });
}
class Scroller extends HTMLDivElement {
    constructor() {
        super();
        this.classList.add('emby-scroller');
    }

    scrollToBeginning() {
        if (this.scroller) {
            this.scroller.slideTo(0, true);
        }
    }

    toStart(elem, immediate) {
        if (this.scroller) {
            this.scroller.toStart(elem, immediate);
        }
    }

    toCenter(elem, immediate) {
        if (this.scroller) {
            this.scroller.toCenter(elem, immediate);
        }
    }

    scrollToPosition(pos, immediate) {
        if (this.scroller) {
            this.scroller.slideTo(pos, immediate);
        }
    }

    getScrollPosition() {
        if (this.scroller) {
            return this.scroller.getScrollPosition();
        }
    }

    getScrollSize() {
        if (this.scroller) {
            return this.scroller.getScrollSize();
        }
    }

    getScrollEventName() {
        if (this.scroller) {
            return this.scroller.getScrollEventName();
        }
    }

    getScrollSlider() {
        if (this.scroller) {
            return this.scroller.getScrollSlider();
        }
    }

    addScrollEventListener(fn, options) {
        if (this.scroller) {
            dom.addEventListener(this.scroller.getScrollFrame(), this.scroller.getScrollEventName(), fn, options);
        }
    }

    removeScrollEventListener(fn, options) {
        if (this.scroller) {
            dom.removeEventListener(this.scroller.getScrollFrame(), this.scroller.getScrollEventName(), fn, options);
        }
    }

    connectedCallback() {
        if (this.getAttribute('data-navcommands')) {
            inputManager.on(this, onInputCommand);
        }

        const horizontal = this.getAttribute('data-horizontal') !== 'false';

        const slider = this.querySelector('.scrollSlider');

        if (horizontal) {
            slider.style['white-space'] = 'nowrap';
        }

        const scrollFrame = this;
        const enableScrollButtons = layoutManager.desktop && horizontal && this.getAttribute('data-scrollbuttons') !== 'false';

        const options = {
            horizontal: horizontal,
            mouseDragging: 1,
            mouseWheel: this.getAttribute('data-mousewheel') !== 'false',
            touchDragging: 1,
            slidee: slider,
            scrollBy: 200,
            speed: horizontal ? 270 : 240,
            elasticBounds: 1,
            dragHandle: 1,
            autoImmediate: true,
            skipSlideToWhenVisible: this.getAttribute('data-skipfocuswhenvisible') === 'true',
            dispatchScrollEvent: enableScrollButtons || this.getAttribute('data-scrollevent') === 'true',
            hideScrollbar: enableScrollButtons || this.getAttribute('data-hidescrollbar') === 'true',
            allowNativeSmoothScroll: this.getAttribute('data-allownativesmoothscroll') === 'true' && !enableScrollButtons,
            allowNativeScroll: !enableScrollButtons,
            forceHideScrollbars: enableScrollButtons,
            // In edge, with the native scroll, the content jumps around when hovering over the buttons
            requireAnimation: enableScrollButtons && browser.edge
        };

        // If just inserted it might not have any height yet - yes this is a hack
        this.scroller = new scroller(scrollFrame, options);
        this.scroller.init();
        this.scroller.reload();

        if (layoutManager.tv && this.getAttribute('data-centerfocus')) {
            initCenterFocus(this, this.scroller);
        }

        if (enableScrollButtons) {
            loadScrollButtons(this);
        }
    }

    pause() {
        const headroom = this.headroom;
        if (headroom) {
            headroom.pause();
        }
    }

    resume() {
        const headroom = this.headroom;
        if (headroom) {
            headroom.resume();
        }
    }

    disconnectedCallback() {
        if (this.getAttribute('data-navcommands')) {
            inputManager.off(this, onInputCommand);
        }

        const headroom = this.headroom;
        if (headroom) {
            headroom.destroy();
            this.headroom = null;
        }

        const scrollerInstance = this.scroller;
        if (scrollerInstance) {
            scrollerInstance.destroy();
            this.scroller = null;
        }
    }
}

customElements.define('emby-scroller', Scroller, {
    extends: 'div'
});

