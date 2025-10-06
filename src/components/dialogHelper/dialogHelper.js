import focusManager from '../focusManager';
import browser from '../../scripts/browser';
import layoutManager from '../layoutManager';
import inputManager from '../../scripts/inputManager';
import { toBoolean } from '../../utils/string.ts';
import { hide } from '../loading/loading.ts';
import dom from '../../utils/dom';

import { history } from 'RootAppRouter';

import './dialoghelper.scss';
import '../../styles/scrollstyles.scss';

let globalOnOpenCallback;

function enableAnimation() {
    // too slow
    if (browser.tv) {
        return false;
    }

    return browser.supportsCssAnimation();
}

function removeCenterFocus(dlg) {
    if (layoutManager.tv) {
        if (dlg.classList.contains('scrollX')) {
            centerFocus(dlg, true, false);
        } else if (dlg.classList.contains('smoothScrollY')) {
            centerFocus(dlg, false, false);
        }
    }
}

function tryRemoveElement(elem) {
    const parentNode = elem.parentNode;
    if (parentNode) {
        // Seeing crashes in edge webview
        try {
            parentNode.removeChild(elem);
        } catch (err) {
            console.error('[dialogHelper] error removing dialog element: ' + err);
        }
    }
}

function DialogHashHandler(dlg, hash, resolve) {
    const self = this;
    self.originalUrl = window.location.href;
    const activeElement = document.activeElement;
    let removeScrollLockOnClose = false;
    let unlisten;

    function onHashChange({ location }) {
        const dialogs = location.state?.dialogs || [];
        const shouldClose = !dialogs.includes(hash);

        if ((shouldClose || !isOpened(dlg)) && unlisten) {
            unlisten();
            unlisten = null;
        }

        if (shouldClose) {
            close(dlg);
        }
    }

    function finishClose() {
        if (unlisten) {
            unlisten();
            unlisten = null;
        }

        dlg.dispatchEvent(new CustomEvent('close', {
            bubbles: false,
            cancelable: false
        }));

        resolve({
            element: dlg
        });
    }

    function onBackCommand(e) {
        if (e.detail.command === 'back') {
            e.preventDefault();
            e.stopPropagation();
            close(dlg);
        }
    }

    function onDialogClosed() {
        if (!isHistoryEnabled(dlg)) {
            inputManager.off(dlg, onBackCommand);
        }

        if (unlisten) {
            unlisten();
            unlisten = null;
        }

        removeBackdrop(dlg);
        hide();

        dlg.classList.remove('opened');

        if (removeScrollLockOnClose) {
            document.body.classList.remove('noScroll');
        }

        if (isHistoryEnabled(dlg)) {
            const state = history.location.state || {};
            if (state.dialogs?.length > 0) {
                if (state.dialogs[state.dialogs.length - 1] === hash) {
                    unlisten = history.listen(finishClose);
                    history.back();
                } else if (state.dialogs.includes(hash)) {
                    console.warn('[dialogHelper] dialog "%s" was closed, but is not the last dialog opened', hash);

                    unlisten = history.listen(finishClose);

                    // Remove the closed dialog hash from the history state
                    history.replace(
                        `${history.location.pathname}${history.location.search}`,
                        {
                            ...state,
                            dialogs: state.dialogs.filter(dialog => dialog !== hash)
                        }
                    );
                }
            }
        }

        if (layoutManager.tv) {
            focusManager.focus(activeElement);
        }

        if (toBoolean(dlg.dataset.removeonclose, true)) {
            removeCenterFocus(dlg);

            const dialogContainer = dlg.dialogContainer;
            if (dialogContainer) {
                tryRemoveElement(dialogContainer);
                dlg.dialogContainer = null;
            } else {
                tryRemoveElement(dlg);
            }
        }

        if (!unlisten) {
            finishClose();
        }
    }

    dlg.addEventListener('_close', onDialogClosed);

    const center = !dlg.classList.contains('dialog-fixedSize');
    if (center) {
        dlg.classList.add('centeredDialog');
    }

    dlg.classList.remove('hide');

    addBackdropOverlay(dlg);

    dlg.classList.add('opened');
    dlg.dispatchEvent(new CustomEvent('open', {
        bubbles: false,
        cancelable: false
    }));

    if (dlg.dataset.lockscroll === 'true' && !document.body.classList.contains('noScroll')) {
        document.body.classList.add('noScroll');
        removeScrollLockOnClose = true;
    }

    animateDialogOpen(dlg);

    if (isHistoryEnabled(dlg)) {
        const state = history.location.state || {};
        const dialogs = state.dialogs || [];
        // Add new dialog to the list of open dialogs
        dialogs.push(hash);

        history.push(
            `${history.location.pathname}${history.location.search}`,
            {
                ...state,
                dialogs
            }
        );

        unlisten = history.listen(onHashChange);
    } else {
        inputManager.on(dlg, onBackCommand);
    }
}

function addBackdropOverlay(dlg) {
    const backdrop = document.createElement('div');
    backdrop.classList.add('dialogBackdrop');

    const backdropParent = dlg.dialogContainer || dlg;
    backdropParent.parentNode.insertBefore(backdrop, backdropParent);
    dlg.backdrop = backdrop;

    // trigger reflow or the backdrop will not animate
    void backdrop.offsetWidth;
    backdrop.classList.add('dialogBackdropOpened');

    let clickedElement;

    dom.addEventListener((dlg.dialogContainer || backdrop), 'mousedown', e => {
        clickedElement = e.target;
    });

    dom.addEventListener((dlg.dialogContainer || backdrop), 'click', e => {
        if (e.target === dlg.dialogContainer && e.target == clickedElement) {
            close(dlg);
        }
    }, {
        passive: true
    });

    dom.addEventListener((dlg.dialogContainer || backdrop), 'contextmenu', e => {
        if (e.target === dlg.dialogContainer) {
            // Close the application dialog menu
            close(dlg);
            // Prevent the default browser context menu from appearing
            e.preventDefault();
        }
    });
}

function isHistoryEnabled(dlg) {
    return dlg.dataset.history === 'true';
}

export function open(dlg) {
    if (globalOnOpenCallback) {
        globalOnOpenCallback(dlg);
    }

    const parent = dlg.parentNode;
    if (parent) {
        parent.removeChild(dlg);
    }

    const dialogContainer = document.createElement('div');
    dialogContainer.classList.add('dialogContainer');
    dialogContainer.appendChild(dlg);
    dlg.dialogContainer = dialogContainer;
    document.body.appendChild(dialogContainer);

    return new Promise((resolve) => {
        new DialogHashHandler(dlg, `dlg${new Date().getTime()}`, resolve);
    });
}

function isOpened(dlg) {
    return !dlg.classList.contains('hide');
}

export function close(dlg) {
    if (!dlg.classList.contains('hide')) {
        dlg.dispatchEvent(new CustomEvent('closing', {
            bubbles: false,
            cancelable: false
        }));

        const onAnimationFinish = () => {
            focusManager.popScope(dlg);

            dlg.classList.add('hide');
            dlg.dispatchEvent(new CustomEvent('_close', {
                bubbles: false,
                cancelable: false
            }));
        };

        animateDialogClose(dlg, onAnimationFinish);
    }
}

const getAnimationEndHandler = (dlg, callback) => function handler() {
    dom.removeEventListener(dlg, dom.whichAnimationEvent(), handler, { once: true });
    callback();
};

function animateDialogOpen(dlg) {
    const onAnimationFinish = () => {
        focusManager.pushScope(dlg);

        if (dlg.dataset.autofocus === 'true') {
            focusManager.autoFocus(dlg);
        }

        if (document.activeElement && !dlg.contains(document.activeElement)) {
            // Blur foreign element to prevent triggering of an action from the previous scope
            document.activeElement.blur();
        }
    };

    if (enableAnimation()) {
        dom.addEventListener(
            dlg,
            dom.whichAnimationEvent(),
            getAnimationEndHandler(dlg, onAnimationFinish),
            { once: true });

        return;
    }

    onAnimationFinish();
}

function animateDialogClose(dlg, onAnimationFinish) {
    if (enableAnimation()) {
        let animated = true;

        switch (dlg.animationConfig.exit.name) {
            case 'fadeout':
                dlg.style.animation = `fadeout ${dlg.animationConfig.exit.timing.duration}ms ease-out normal both`;
                break;
            case 'scaledown':
                dlg.style.animation = `scaledown ${dlg.animationConfig.exit.timing.duration}ms ease-out normal both`;
                break;
            case 'slidedown':
                dlg.style.animation = `slidedown ${dlg.animationConfig.exit.timing.duration}ms ease-out normal both`;
                break;
            default:
                animated = false;
                break;
        }

        dom.addEventListener(
            dlg,
            dom.whichAnimationEvent(),
            getAnimationEndHandler(dlg, onAnimationFinish),
            { once: true });

        if (animated) {
            return;
        }
    }

    onAnimationFinish();
}

const supportsOverscrollBehavior = 'overscroll-behavior-y' in document.body.style;

function shouldLockDocumentScroll(options) {
    if (options.lockScroll != null) {
        return options.lockScroll;
    }

    if (options.size === 'fullscreen') {
        return true;
    }

    if (supportsOverscrollBehavior && (options.size || !browser.touch)) {
        return false;
    }

    if (options.size) {
        return true;
    }

    return browser.touch;
}

function removeBackdrop(dlg) {
    const backdrop = dlg.backdrop;

    if (!backdrop) {
        return;
    }

    dlg.backdrop = null;

    const onAnimationFinish = () => {
        tryRemoveElement(backdrop);
    };

    if (enableAnimation()) {
        backdrop.classList.remove('dialogBackdropOpened');

        // this is not firing animationend
        setTimeout(onAnimationFinish, 300);
        return;
    }

    onAnimationFinish();
}

function centerFocus(elem, horiz, on) {
    import('../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

export function createDialog(options = {}) {
    // If there's no native dialog support, use a plain div
    // Also not working well in samsung tizen browser, content inside not clickable
    // Just go ahead and always use a plain div because we're seeing issues overlaying absoltutely positioned content over a modal dialog
    const dlg = document.createElement('div');

    // Add an id so we can access the dialog element
    if (options.id) {
        dlg.id = options.id;
    }

    dlg.classList.add('focuscontainer');
    dlg.classList.add('hide');

    if (shouldLockDocumentScroll(options)) {
        dlg.dataset.lockscroll = 'true';
    }

    if (options.enableHistory !== false) {
        dlg.dataset.history = 'true';
    }

    // without this safari will scroll the background instead of the dialog contents
    // but not needed here since this is already on top of an existing dialog
    // but skip it in IE because it's causing the entire browser to hang
    // Also have to disable for firefox because it's causing select elements to not be clickable
    if (options.modal !== false) {
        dlg.setAttribute('modal', 'modal');
    }

    if (options.autoFocus !== false) {
        dlg.dataset.autofocus = 'true';
    }

    const defaultEntryAnimation = 'scaleup';
    const defaultExitAnimation = 'scaledown';
    const entryAnimation = options.entryAnimation || defaultEntryAnimation;
    const exitAnimation = options.exitAnimation || defaultExitAnimation;

    // If it's not fullscreen then lower the default animation speed to make it open really fast
    const entryAnimationDuration = options.entryAnimationDuration || (options.size !== 'fullscreen' ? 180 : 280);
    const exitAnimationDuration = options.exitAnimationDuration || (options.size !== 'fullscreen' ? 120 : 220);

    dlg.animationConfig = {
        // scale up
        'entry': {
            name: entryAnimation,
            timing: {
                duration: entryAnimationDuration,
                easing: 'ease-out'
            }
        },
        // fade out
        'exit': {
            name: exitAnimation,
            timing: {
                duration: exitAnimationDuration,
                easing: 'ease-out',
                fill: 'both'
            }
        }
    };

    dlg.classList.add('dialog');

    if (options.scrollX) {
        dlg.classList.add('scrollX');
        dlg.classList.add('smoothScrollX');

        if (layoutManager.tv) {
            centerFocus(dlg, true, true);
        }
    } else if (options.scrollY !== false) {
        dlg.classList.add('smoothScrollY');

        if (layoutManager.tv) {
            centerFocus(dlg, false, true);
        }
    }

    if (options.removeOnClose) {
        dlg.dataset.removeonclose = 'true';
    }

    if (options.size) {
        dlg.classList.add('dialog-fixedSize');
        dlg.classList.add(`dialog-${options.size}`);
    }

    if (enableAnimation()) {
        switch (dlg.animationConfig.entry.name) {
            case 'fadein':
                dlg.style.animation = `fadein ${entryAnimationDuration}ms ease-out normal`;
                break;
            case 'scaleup':
                dlg.style.animation = `scaleup ${entryAnimationDuration}ms ease-out normal both`;
                break;
            case 'slideup':
                dlg.style.animation = `slideup ${entryAnimationDuration}ms ease-out normal`;
                break;
            case 'slidedown':
                dlg.style.animation = `slidedown ${entryAnimationDuration}ms ease-out normal`;
                break;
            default:
                break;
        }
    }

    return dlg;
}

export function setOnOpen(val) {
    globalOnOpenCallback = val;
}

export default {
    open: open,
    close: close,
    createDialog: createDialog,
    setOnOpen: setOnOpen
};
