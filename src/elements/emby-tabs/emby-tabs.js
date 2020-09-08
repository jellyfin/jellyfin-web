import dom from '../../scripts/dom';
import scroller from '../../libraries/scroller';
import browser from '../../scripts/browser';
import focusManager from '../../components/focusManager';
import 'webcomponents.js/webcomponents-lite';
import './emby-tabs.css';
import '../../assets/css/scrollstyles.css';

/* eslint-disable indent */
    const buttonClass = 'emby-tab-button';
    const activeButtonClass = buttonClass + '-active';

    function setActiveTabButton(newButton) {
        newButton.classList.add(activeButtonClass);
    }

    function getTabPanel(tabs, index) {
        return null;
    }

    function removeActivePanelClass(tabs, index) {
        const tabPanel = getTabPanel(tabs, index);
        if (tabPanel) {
            tabPanel.classList.remove('is-active');
        }
    }

    function fadeInRight(elem) {
        const pct = browser.mobile ? '4%' : '0.5%';

        const keyframes = [
            { opacity: '0', transform: 'translate3d(' + pct + ', 0, 0)', offset: 0 },
            { opacity: '1', transform: 'none', offset: 1 }];

        elem.animate(keyframes, {
            duration: 160,
            iterations: 1,
            easing: 'ease-out'
        });
    }

    function triggerBeforeTabChange(tabs, index, previousIndex) {
        tabs.dispatchEvent(new CustomEvent('beforetabchange', {
            detail: {
                selectedTabIndex: index,
                previousIndex: previousIndex
            }
        }));
        if (previousIndex != null && previousIndex !== index) {
            removeActivePanelClass(tabs, previousIndex);
        }

        const newPanel = getTabPanel(tabs, index);

        if (newPanel) {
            // animate new panel ?
            if (newPanel.animate) {
                fadeInRight(newPanel);
            }

            newPanel.classList.add('is-active');
        }
    }

    function onClick(e) {
        const tabs = this;

        const current = tabs.querySelector('.' + activeButtonClass);
        const tabButton = dom.parentWithClass(e.target, buttonClass);

        if (tabButton && tabButton !== current) {
            if (current) {
                current.classList.remove(activeButtonClass);
            }

            const previousIndex = current ? parseInt(current.getAttribute('data-index')) : null;

            setActiveTabButton(tabButton);

            const index = parseInt(tabButton.getAttribute('data-index'));

            triggerBeforeTabChange(tabs, index, previousIndex);

            // If toCenter is called syncronously within the click event, it sometimes ends up canceling it
            setTimeout(function () {
                tabs.selectedTabIndex = index;

                tabs.dispatchEvent(new CustomEvent('tabchange', {
                    detail: {
                        selectedTabIndex: index,
                        previousIndex: previousIndex
                    }
                }));
            }, 120);

            if (tabs.scroller) {
                tabs.scroller.toCenter(tabButton, false);
            }
        }
    }

    function onFocusOut(e) {
        const parentContainer = e.target.parentNode;
        const previousFocus = parentContainer.querySelector('.lastFocused');
        if (previousFocus) {
            previousFocus.classList.remove('lastFocused');
        }
        e.target.classList.add('lastFocused');
    }

    function initScroller(tabs) {
        if (tabs.scroller) {
            return;
        }

        const contentScrollSlider = tabs.querySelector('.emby-tabs-slider');
        if (contentScrollSlider) {
            tabs.scroller = new scroller(tabs, {
                horizontal: 1,
                itemNav: 0,
                mouseDragging: 1,
                touchDragging: 1,
                slidee: contentScrollSlider,
                smart: true,
                releaseSwing: true,
                scrollBy: 200,
                speed: 120,
                elasticBounds: 1,
                dragHandle: 1,
                dynamicHandle: 1,
                clickBar: 1,
                hiddenScroll: true,

                // In safari the transform is causing the headers to occasionally disappear or flicker
                requireAnimation: !browser.safari,
                allowNativeSmoothScroll: true
            });
            tabs.scroller.init();
        } else {
            tabs.classList.add('scrollX');
            tabs.classList.add('hiddenScrollX');
            tabs.classList.add('smoothScrollX');
        }
    }

    class EmbyTabs extends HTMLDivElement {
        createdCallback() {
            if (this.classList.contains('emby-tabs')) {
                return;
            }
            this.classList.add('emby-tabs');
            this.classList.add('focusable');

            dom.addEventListener(this, 'click', onClick, {
                passive: true
            });

            dom.addEventListener(this, 'focusout', onFocusOut);
        }

        focus() {
            const selected = this.querySelector('.' + activeButtonClass);

            if (this.lastFocused) {
                focusManager.focus(this.lastFocused);
            } else if (this.selectedTab) {
                focusManager.focus(this.selectedTab);
            } else {
                focusManager.autoFocus(this);
            }
        }

        refresh() {
            if (this.scroller) {
                this.scroller.reload();
            }
        }

        attachedCallback() {
            console.warn(this);
            initScroller(this);

            const current = this.querySelector('.' + activeButtonClass);
            const currentIndex = current ? parseInt(current.getAttribute('data-index')) : parseInt(this.getAttribute('data-index') || '0');

            if (currentIndex !== -1) {
                this.selectedTabIndex = currentIndex;

                const tabButtons = this.querySelectorAll('.' + buttonClass);

                const newTabButton = tabButtons[currentIndex];

                if (newTabButton) {
                    setActiveTabButton(newTabButton);
                }
            }

            if (!this.readyFired) {
                this.readyFired = true;
                this.dispatchEvent(new CustomEvent('ready', {}));
            }
        }

        detachedCallback() {
            if (this.scroller) {
                this.scroller.destroy();
                this.scroller = null;
            }

            dom.removeEventListener(this, 'click', onClick, {
                passive: true
            });
        }

        getSelectedTabButton(elem) {
            return elem.querySelector('.' + activeButtonClass);
        }

        selectedIndex(selected, triggerEvent) {
            const tabs = this;

            if (selected == null) {
                return tabs.selectedTabIndex || 0;
            }

            const current = tabs.selectedIndex();

            tabs.selectedTabIndex = selected;

            const tabButtons = tabs.querySelectorAll('.' + buttonClass);

            if (current === selected || triggerEvent === false) {
                triggerBeforeTabChange(tabs, selected, current);

                tabs.dispatchEvent(new CustomEvent('tabchange', {
                    detail: {
                        selectedTabIndex: selected
                    }
                }));

                const currentTabButton = tabButtons[current];
                setActiveTabButton(tabButtons[selected]);

                if (current !== selected && currentTabButton) {
                    currentTabButton.classList.remove(activeButtonClass);
                }
            } else {
                onClick.call(tabs, {
                    target: tabButtons[selected]
                });
            }
        }

        getSibling(elem, method) {
            let sibling = elem[method];

            while (sibling) {
                if (sibling.classList.contains(buttonClass)) {
                    if (!sibling.classList.contains('hide')) {
                        return sibling;
                    }
                }

                sibling = sibling[method];
            }

            return null;
        }

        selectNext() {
            const current = this.getSelectedTabButton(this);

            const sibling = this.getSibling(current, 'nextSibling');

            if (sibling) {
                onClick.call(this, {
                    target: sibling
                });
            }
        }

        selectPrevious() {
            const current = this.getSelectedTabButton(this);

            const sibling = this.getSibling(current, 'previousSibling');

            if (sibling) {
                onClick.call(this, {
                    target: sibling
                });
            }
        }

        triggerBeforeTabChange(selected) {
            const tabs = this;

            triggerBeforeTabChange(tabs, tabs.selectedIndex());
        }

        triggerTabChange(selected) {
            const tabs = this;

            tabs.dispatchEvent(new CustomEvent('tabchange', {
                detail: {
                    selectedTabIndex: tabs.selectedIndex()
                }
            }));
        }

        setTabEnabled(index, enabled) {
            const btn = this.querySelector('.emby-tab-button[data-index="' + index + '"]');

            if (enabled) {
                btn.classList.remove('hide');
            } else {
                btn.classList.remove('add');
            }
        }
    }

    customElements.define('emby-tabs', EmbyTabs, { extends: 'div' });

/* eslint-enable indent */
