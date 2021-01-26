/* Cleaning this file properly is not neecessary, since it's an outdated library
 * and will be replaced soon by a Vue component.
 */

/* eslint-disable no-var */
import browser from '../../scripts/browser';
import dom from '../../scripts/dom';
import './navdrawer.scss';
import '../../assets/css/scrollstyles.scss';

export function NavigationDrawer(options) {
    function getTouches(e) {
        return e.changedTouches || e.targetTouches || e.touches;
    }

    function onMenuTouchStart(e) {
        options.target.classList.remove('transition');
        const touches = getTouches(e);
        const touch = touches[0] || {};
        menuTouchStartX = touch.clientX;
        menuTouchStartY = touch.clientY;
        menuTouchStartTime = new Date().getTime();
    }

    function setVelocity(deltaX) {
        const time = new Date().getTime() - (menuTouchStartTime || 0);
        velocity = Math.abs(deltaX) / time;
    }

    function onMenuTouchMove(e) {
        const isOpen = self.visible;
        const touches = getTouches(e);
        const touch = touches[0] || {};
        const endX = touch.clientX || 0;
        const endY = touch.clientY || 0;
        const deltaX = endX - (menuTouchStartX || 0);
        const deltaY = endY - (menuTouchStartY || 0);
        setVelocity(deltaX);

        if (isOpen && dragMode !== 1 && deltaX > 0) {
            dragMode = 2;
        }

        if (dragMode === 0 && (!isOpen || Math.abs(deltaX) >= 10) && Math.abs(deltaY) < 5) {
            dragMode = 1;
            scrollContainer.addEventListener('scroll', disableEvent);
            self.showMask();
        } else if (dragMode === 0 && Math.abs(deltaY) >= 5) {
            dragMode = 2;
        }

        if (dragMode === 1) {
            newPos = currentPos + deltaX;
            self.changeMenuPos();
        }
    }

    function onMenuTouchEnd(e) {
        options.target.classList.add('transition');
        scrollContainer.removeEventListener('scroll', disableEvent);
        dragMode = 0;
        const touches = getTouches(e);
        const touch = touches[0] || {};
        const endX = touch.clientX || 0;
        const endY = touch.clientY || 0;
        const deltaX = endX - (menuTouchStartX || 0);
        const deltaY = endY - (menuTouchStartY || 0);
        currentPos = deltaX;
        self.checkMenuState(deltaX, deltaY);
    }

    function onEdgeTouchStart(e) {
        if (isPeeking) {
            onMenuTouchMove(e);
        } else {
            if (((getTouches(e)[0] || {}).clientX || 0) <= options.handleSize) {
                isPeeking = true;

                if (e.type === 'touchstart') {
                    dom.removeEventListener(edgeContainer, 'touchmove', onEdgeTouchMove, {});
                    dom.addEventListener(edgeContainer, 'touchmove', onEdgeTouchMove, {});
                }

                onMenuTouchStart(e);
            }
        }
    }

    function onEdgeTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        onEdgeTouchStart(e);
    }

    function onEdgeTouchEnd(e) {
        if (isPeeking) {
            isPeeking = false;
            dom.removeEventListener(edgeContainer, 'touchmove', onEdgeTouchMove, {});
            onMenuTouchEnd(e);
        }
    }

    function disableEvent(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function onBackgroundTouchStart(e) {
        const touches = getTouches(e);
        const touch = touches[0] || {};
        backgroundTouchStartX = touch.clientX;
        backgroundTouchStartTime = new Date().getTime();
    }

    function onBackgroundTouchMove(e) {
        const touches = getTouches(e);
        const touch = touches[0] || {};
        const endX = touch.clientX || 0;

        if (endX <= options.width && self.isVisible) {
            countStart++;
            const deltaX = endX - (backgroundTouchStartX || 0);

            if (countStart == 1) {
                startPoint = deltaX;
            }
            if (deltaX < 0 && dragMode !== 2) {
                dragMode = 1;
                newPos = deltaX - startPoint + options.width;
                self.changeMenuPos();
                const time = new Date().getTime() - (backgroundTouchStartTime || 0);
                velocity = Math.abs(deltaX) / time;
            }
        }

        e.preventDefault();
        e.stopPropagation();
    }

    function onBackgroundTouchEnd(e) {
        const touches = getTouches(e);
        const touch = touches[0] || {};
        const endX = touch.clientX || 0;
        const deltaX = endX - (backgroundTouchStartX || 0);
        self.checkMenuState(deltaX);
        countStart = 0;
    }

    function onMaskTransitionEnd() {
        const classList = mask.classList;

        if (!classList.contains('backdrop')) {
            classList.add('hide');
        }
    }

    let self;
    let defaults;
    let mask;
    var newPos = 0;
    var currentPos = 0;
    var startPoint = 0;
    var countStart = 0;
    var velocity = 0;
    options.target.classList.add('transition');
    var dragMode = 0;
    var scrollContainer = options.target.querySelector('.mainDrawer-scrollContainer');
    scrollContainer.classList.add('scrollY');

    const TouchMenuLA = function () {
        self = this;
        defaults = {
            width: 260,
            handleSize: 10,
            disableMask: false,
            maxMaskOpacity: 0.5
        };
        this.isVisible = false;
        this.initialize();
    };

    TouchMenuLA.prototype.initElements = function () {
        options.target.classList.add('touch-menu-la');
        options.target.style.width = options.width + 'px';
        options.target.style.left = -options.width + 'px';

        if (!options.disableMask) {
            mask = document.createElement('div');
            mask.className = 'tmla-mask hide';
            document.body.appendChild(mask);
            dom.addEventListener(mask, dom.whichTransitionEvent(), onMaskTransitionEnd, {
                passive: true
            });
        }
    };

    let menuTouchStartX;
    let menuTouchStartY;
    let menuTouchStartTime;
    var edgeContainer = document.querySelector('.mainDrawerHandle');
    var isPeeking = false;

    TouchMenuLA.prototype.animateToPosition = function (pos) {
        requestAnimationFrame(function () {
            options.target.style.transform = pos ? 'translateX(' + pos + 'px)' : 'none';
        });
    };

    TouchMenuLA.prototype.changeMenuPos = function () {
        if (newPos <= options.width) {
            this.animateToPosition(newPos);
        }
    };

    TouchMenuLA.prototype.clickMaskClose = function () {
        mask.addEventListener('click', function () {
            self.close();
        });
    };

    TouchMenuLA.prototype.checkMenuState = function (deltaX, deltaY) {
        if (velocity >= 0.4) {
            if (deltaX >= 0 || Math.abs(deltaY || 0) >= 70) {
                self.open();
            } else {
                self.close();
            }
        } else {
            if (newPos >= 100) {
                self.open();
            } else {
                if (newPos) {
                    self.close();
                }
            }
        }
    };

    TouchMenuLA.prototype.open = function () {
        this.animateToPosition(options.width);
        currentPos = options.width;
        this.isVisible = true;
        options.target.classList.add('drawer-open');
        self.showMask();
        self.invoke(options.onChange);
    };

    TouchMenuLA.prototype.close = function () {
        this.animateToPosition(0);
        currentPos = 0;
        self.isVisible = false;
        options.target.classList.remove('drawer-open');
        self.hideMask();
        self.invoke(options.onChange);
    };

    TouchMenuLA.prototype.toggle = function () {
        if (self.isVisible) {
            self.close();
        } else {
            self.open();
        }
    };

    let backgroundTouchStartX;
    let backgroundTouchStartTime;

    TouchMenuLA.prototype.showMask = function () {
        mask.classList.remove('hide');
        mask.classList.add('backdrop');
    };

    TouchMenuLA.prototype.hideMask = function () {
        mask.classList.add('hide');
        mask.classList.remove('backdrop');
    };

    TouchMenuLA.prototype.invoke = function (fn) {
        if (fn) {
            fn.apply(self);
        }
    };

    let _edgeSwipeEnabled;

    TouchMenuLA.prototype.setEdgeSwipeEnabled = function (enabled) {
        if (!options.disableEdgeSwipe) {
            if (browser.touch) {
                if (enabled) {
                    if (!_edgeSwipeEnabled) {
                        _edgeSwipeEnabled = true;
                        dom.addEventListener(edgeContainer, 'touchstart', onEdgeTouchStart, {
                            passive: true
                        });
                        dom.addEventListener(edgeContainer, 'touchend', onEdgeTouchEnd, {
                            passive: true
                        });
                        dom.addEventListener(edgeContainer, 'touchcancel', onEdgeTouchEnd, {
                            passive: true
                        });
                    }
                } else {
                    if (_edgeSwipeEnabled) {
                        _edgeSwipeEnabled = false;
                        dom.removeEventListener(edgeContainer, 'touchstart', onEdgeTouchStart, {
                            passive: true
                        });
                        dom.removeEventListener(edgeContainer, 'touchend', onEdgeTouchEnd, {
                            passive: true
                        });
                        dom.removeEventListener(edgeContainer, 'touchcancel', onEdgeTouchEnd, {
                            passive: true
                        });
                    }
                }
            }
        }
    };

    TouchMenuLA.prototype.initialize = function () {
        options = Object.assign(defaults, options || {});

        if (browser.edge) {
            options.disableEdgeSwipe = true;
        }

        self.initElements();

        if (browser.touch) {
            dom.addEventListener(options.target, 'touchstart', onMenuTouchStart, {
                passive: true
            });
            dom.addEventListener(options.target, 'touchmove', onMenuTouchMove, {
                passive: true
            });
            dom.addEventListener(options.target, 'touchend', onMenuTouchEnd, {
                passive: true
            });
            dom.addEventListener(options.target, 'touchcancel', onMenuTouchEnd, {
                passive: true
            });
            dom.addEventListener(mask, 'touchstart', onBackgroundTouchStart, {
                passive: true
            });
            dom.addEventListener(mask, 'touchmove', onBackgroundTouchMove, {});
            dom.addEventListener(mask, 'touchend', onBackgroundTouchEnd, {
                passive: true
            });
            dom.addEventListener(mask, 'touchcancel', onBackgroundTouchEnd, {
                passive: true
            });
        }

        self.clickMaskClose();
    };

    return new TouchMenuLA();
}
/* eslint-enable no-var */
