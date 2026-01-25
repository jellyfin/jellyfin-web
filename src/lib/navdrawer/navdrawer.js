/**
 * NOTE: This file should not be modified.
 * It is a legacy library that should be replaced at some point.
 */

import browser from '../../scripts/browser';
import dom from '../../utils/dom';
import './navdrawer.scss';
import globalize from '../globalize';

function getTouches(e) {
    return e.changedTouches || e.targetTouches || e.touches;
}

function disableEvent(e) {
    e.preventDefault();
    e.stopPropagation();
}

class NavDrawer {
    mask;
    newPos = 0;
    currentPos = 0;
    startPoint = 0;
    countStart = 0;
    velocity = 0;
    dragMode = 0;
    menuTouchStartX;
    menuTouchStartY;
    menuTouchStartTime;
    edgeContainer = document.querySelector('.mainDrawerHandle');
    isPeeking = false;
    backgroundTouchStartX;
    backgroundTouchStartTime;
    _edgeSwipeEnabled;

    constructor(options) {
        this.options = options;
        this.defaults = {
            width: 260,
            handleSize: 10,
            disableMask: false,
            maxMaskOpacity: 0.5
        };
        options.target.classList.add('transition');
        this.scrollContainer = options.target.querySelector('.mainDrawer-scrollContainer');
        this.scrollContainer.classList.add('scrollY');
        this.isVisible = false;
        this.initialize();
    }

    setVelocity(deltaX) {
        const time = new Date().getTime() - (this.menuTouchStartTime || 0);
        this.velocity = Math.abs(deltaX) / time;
    }

    onMenuTouchStart = e => {
        const options = this.options;

        options.target.classList.remove('transition');
        const touches = getTouches(e);
        const touch = touches[0] || {};
        this.menuTouchStartX = touch.clientX;
        this.menuTouchStartY = touch.clientY;
        this.menuTouchStartTime = new Date().getTime();
    };

    onMenuTouchMove = e => {
        const scrollContainer = this.scrollContainer;

        const isOpen = this.visible;
        const touches = getTouches(e);
        const touch = touches[0] || {};
        const endX = touch.clientX || 0;
        const endY = touch.clientY || 0;
        let deltaX = endX - (this.menuTouchStartX || 0);
        if (globalize.getIsRTL()) {
            deltaX *= -1;
        }
        const deltaY = endY - (this.menuTouchStartY || 0);
        this.setVelocity(deltaX);

        if (isOpen && this.dragMode !== 1 && deltaX > 0) {
            this.dragMode = 2;
        }

        if (this.dragMode === 0 && (!isOpen || Math.abs(deltaX) >= 10) && Math.abs(deltaY) < 5) {
            this.dragMode = 1;
            scrollContainer.addEventListener('scroll', disableEvent);
            this.showMask();
        } else if (this.dragMode === 0 && Math.abs(deltaY) >= 5) {
            this.dragMode = 2;
        }

        if (this.dragMode === 1) {
            this.newPos = this.currentPos + deltaX;
            this.changeMenuPos();
        }
    };

    onMenuTouchEnd = e => {
        const options = this.options;
        const scrollContainer = this.scrollContainer;

        options.target.classList.add('transition');
        scrollContainer.removeEventListener('scroll', disableEvent);
        this.dragMode = 0;
        const touches = getTouches(e);
        const touch = touches[0] || {};
        const endX = touch.clientX || 0;
        const endY = touch.clientY || 0;
        let deltaX = endX - (this.menuTouchStartX || 0);
        if (globalize.getIsRTL()) {
            deltaX *= -1;
        }
        const deltaY = endY - (this.menuTouchStartY || 0);
        this.currentPos = deltaX;
        this.checkMenuState(deltaX, deltaY);
    };

    onEdgeTouchMove = e => {
        e.preventDefault();
        e.stopPropagation();
        this.onEdgeTouchStart(e);
    };

    onEdgeTouchStart = e => {
        const options = this.options;

        if (this.isPeeking) {
            this.onMenuTouchMove(e);
        } else if ((getTouches(e)[0]?.clientX || 0) <= options.handleSize) {
            this.isPeeking = true;

            if (e.type === 'touchstart') {
                dom.removeEventListener(this.edgeContainer, 'touchmove', this.onEdgeTouchMove, {});
                dom.addEventListener(this.edgeContainer, 'touchmove', this.onEdgeTouchMove, {});
            }

            this.onMenuTouchStart(e);
        }
    };

    onEdgeTouchEnd = e => {
        if (this.isPeeking) {
            this.isPeeking = false;
            dom.removeEventListener(this.edgeContainer, 'touchmove', this.onEdgeTouchMove, {});
            this.onMenuTouchEnd(e);
        }
    };

    onBackgroundTouchStart = e => {
        const touches = getTouches(e);
        const touch = touches[0] || {};
        this.backgroundTouchStartX = touch.clientX;
        this.backgroundTouchStartTime = new Date().getTime();
    };

    onBackgroundTouchMove = e => {
        const options = this.options;

        const touches = getTouches(e);
        const touch = touches[0] || {};
        const endX = touch.clientX || 0;

        if (endX <= options.width && this.isVisible) {
            this.countStart++;
            let deltaX = endX - (this.backgroundTouchStartX || 0);
            if (globalize.getIsRTL()) {
                deltaX *= -1;
            }

            if (this.countStart == 1) {
                this.startPoint = deltaX;
            }
            if (deltaX < 0 && this.dragMode !== 2) {
                this.dragMode = 1;
                this.newPos = deltaX - this.startPoint + options.width;
                this.changeMenuPos();
                const time = new Date().getTime() - (this.backgroundTouchStartTime || 0);
                this.velocity = Math.abs(deltaX) / time;
            }
        }

        e.preventDefault();
        e.stopPropagation();
    };

    onBackgroundTouchEnd = e => {
        const touches = getTouches(e);
        const touch = touches[0] || {};
        const endX = touch.clientX || 0;
        let deltaX = endX - (this.backgroundTouchStartX || 0);
        if (globalize.getIsRTL()) {
            deltaX *= -1;
        }
        this.checkMenuState(deltaX);
        this.countStart = 0;
    };

    initElements() {
        const options = this.options;

        options.target.classList.add('touch-menu-la');
        options.target.style.width = options.width + 'px';
        if (globalize.getIsRTL()) {
            options.target.style.right = -options.width + 'px';
        } else {
            options.target.style.left = -options.width + 'px';
        }

        if (!options.disableMask) {
            this.mask = document.createElement('div');
            this.mask.className = 'tmla-mask hide';
            document.body.appendChild(this.mask);
        }
    }

    animateToPosition(pos) {
        const options = this.options;
        const languageAwarePos = globalize.getIsRTL() ? -pos : pos;
        requestAnimationFrame(() => {
            options.target.style.transform = pos ? 'translateX(' + languageAwarePos + 'px)' : 'none';
        });
    }

    changeMenuPos() {
        const options = this.options;
        if (this.newPos <= options.width) {
            this.animateToPosition(this.newPos);
        }
    }

    clickMaskClose() {
        this.mask.addEventListener('click', () => {
            this.close();
        });
    }

    checkMenuState(deltaX, deltaY) {
        if (this.velocity >= 0.4) {
            if (deltaX >= 0 || Math.abs(deltaY || 0) >= 70) {
                this.open();
            } else {
                this.close();
            }
        } else if (this.newPos >= 100) {
            this.open();
        } else if (this.newPos) {
            this.close();
        }
    }

    open() {
        const options = this.options;

        this.animateToPosition(options.width);
        this.currentPos = options.width;
        this.isVisible = true;
        options.target.classList.add('drawer-open');
        this.showMask();
        this.invoke(options.onChange);
    }

    close() {
        const options = this.options;

        this.animateToPosition(0);
        this.currentPos = 0;
        this.isVisible = false;
        options.target.classList.remove('drawer-open');
        this.hideMask();
        this.invoke(options.onChange);
    }

    toggle() {
        if (this.isVisible) {
            this.close();
        } else {
            this.open();
        }
    }

    showMask() {
        this.mask.classList.remove('hide');
        this.mask.classList.add('backdrop');
    }

    hideMask() {
        this.mask.classList.add('hide');
        this.mask.classList.remove('backdrop');
    }

    invoke(fn) {
        if (fn) {
            fn.apply(this);
        }
    }

    setEdgeSwipeEnabled(enabled) {
        const options = this.options;

        if (!options.disableEdgeSwipe && browser.touch) {
            if (enabled) {
                if (!this._edgeSwipeEnabled) {
                    this._edgeSwipeEnabled = true;
                    dom.addEventListener(this.edgeContainer, 'touchstart', this.onEdgeTouchStart, {
                        passive: true
                    });
                    dom.addEventListener(this.edgeContainer, 'touchend', this.onEdgeTouchEnd, {
                        passive: true
                    });
                    dom.addEventListener(this.edgeContainer, 'touchcancel', this.onEdgeTouchEnd, {
                        passive: true
                    });
                }
            } else if (this._edgeSwipeEnabled) {
                this._edgeSwipeEnabled = false;
                dom.removeEventListener(this.edgeContainer, 'touchstart', this.onEdgeTouchStart, {
                    passive: true
                });
                dom.removeEventListener(this.edgeContainer, 'touchend', this.onEdgeTouchEnd, {
                    passive: true
                });
                dom.removeEventListener(this.edgeContainer, 'touchcancel', this.onEdgeTouchEnd, {
                    passive: true
                });
            }
        }
    }

    initialize() {
        const options = Object.assign({}, this.defaults, this.options || {});
        this.options = options;

        if (browser.edge) {
            options.disableEdgeSwipe = true;
        }

        this.initElements();

        if (browser.touch) {
            dom.addEventListener(options.target, 'touchstart', this.onMenuTouchStart, {
                passive: true
            });
            dom.addEventListener(options.target, 'touchmove', this.onMenuTouchMove, {
                passive: true
            });
            dom.addEventListener(options.target, 'touchend', this.onMenuTouchEnd, {
                passive: true
            });
            dom.addEventListener(options.target, 'touchcancel', this.onMenuTouchEnd, {
                passive: true
            });
            dom.addEventListener(this.mask, 'touchstart', this.onBackgroundTouchStart, {
                passive: true
            });
            dom.addEventListener(this.mask, 'touchmove', this.onBackgroundTouchMove, {});
            dom.addEventListener(this.mask, 'touchend', this.onBackgroundTouchEnd, {
                passive: true
            });
            dom.addEventListener(this.mask, 'touchcancel', this.onBackgroundTouchEnd, {
                passive: true
            });
        }

        this.clickMaskClose();
    }
}

export default NavDrawer;
