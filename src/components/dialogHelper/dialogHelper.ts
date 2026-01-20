import focusManager from '../focusManager';
import browser from '../../scripts/browser';
import layoutManager from '../layoutManager';
import inputManager from '../../scripts/inputManager';
import { toBoolean } from '../../utils/string';
import { hide } from '../loading/loading';
import dom from '../../utils/dom';
import { logger } from '../../utils/logger';
import { getAppHistory } from '../router/appHistory';

import './dialoghelper.scss';

let globalOnOpenCallback: ((dlg: HTMLElement) => void) | undefined;

export interface DialogOptions {
    id?: string;
    removeOnClose?: boolean;
    scrollY?: boolean;
    scrollX?: boolean;
    size?: 'fullscreen' | 'small' | 'medium' | 'large' | string;
    entryAnimation?: string;
    exitAnimation?: string;
    entryAnimationDuration?: number;
    exitAnimationDuration?: number;
    enableHistory?: boolean;
    modal?: boolean;
    autoFocus?: boolean;
    lockScroll?: boolean;
}

function enableAnimation(): boolean {
    return !browser.tv && !!browser.supportsCssAnimation?.();
}

function removeCenterFocus(dlg: HTMLElement): void {
    if (layoutManager.tv) {
        const fn = 'off';
        import('../../scripts/scrollHelper').then((scrollHelper) => {
            if (dlg.classList.contains('scrollX')) scrollHelper.default.centerFocus[fn](dlg, true);
            else if (dlg.classList.contains('smoothScrollY')) scrollHelper.default.centerFocus[fn](dlg, false);
        });
    }
}

function tryRemoveElement(elem: HTMLElement): void {
    elem.parentNode?.removeChild(elem);
}

class DialogHashHandler {
    private originalUrl: string;
    private unlisten: (() => void) | null = null;

    constructor(private dlg: HTMLElement & { dialogContainer?: HTMLElement | null, backdrop?: HTMLElement | null, animationConfig?: any }, private hash: string, resolve: (val: any) => void) {
        this.originalUrl = window.location.href;
        const history = getAppHistory();
        const historyEnabled = history && dlg.getAttribute('data-history') === 'true';
        const activeElement = document.activeElement as HTMLElement | null;
        let removeScrollLockOnClose = false;

        const onDialogClosed = () => {
            if (!historyEnabled) inputManager.off(dlg, onBackCommand);
            if (this.unlisten) { this.unlisten(); this.unlisten = null; }

            if (dlg.backdrop) {
                const backdrop = dlg.backdrop;
                dlg.backdrop = null;
                if (enableAnimation()) {
                    backdrop.classList.remove('dialogBackdropOpened');
                    setTimeout(() => tryRemoveElement(backdrop), 300);
                } else tryRemoveElement(backdrop);
            }

            hide();
            dlg.classList.remove('opened');
            if (removeScrollLockOnClose) document.body.classList.remove('noScroll');

            if (historyEnabled) {
                const state = history.location.state || {};
                if (state.dialogs?.[state.dialogs.length - 1] === hash) {
                    this.unlisten = history.listen(() => finishClose());
                    history.back();
                }
            }

            if (layoutManager.tv) focusManager.focus(activeElement);
            if (toBoolean(dlg.getAttribute('data-removeonclose'), true)) {
                removeCenterFocus(dlg);
                if (dlg.dialogContainer) { tryRemoveElement(dlg.dialogContainer); dlg.dialogContainer = null; }
                else tryRemoveElement(dlg);
            }
            if (!this.unlisten) finishClose();
        };

        const finishClose = () => {
            if (this.unlisten) { this.unlisten(); this.unlisten = null; }
            dlg.dispatchEvent(new CustomEvent('close'));
            resolve({ element: dlg });
        };

        const onBackCommand = (e: any) => {
            if (e.detail.command === 'back') {
                e.preventDefault(); e.stopPropagation();
                close(dlg);
            }
        };

        dlg.addEventListener('_close', onDialogClosed);
        if (!dlg.classList.contains('dialog-fixedSize')) dlg.classList.add('centeredDialog');
        dlg.classList.remove('hide');

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.classList.add('dialogBackdrop');
        const backdropParent = dlg.dialogContainer || dlg;
        backdropParent.parentNode?.insertBefore(backdrop, backdropParent);
        dlg.backdrop = backdrop;
        void backdrop.offsetWidth;
        backdrop.classList.add('dialogBackdropOpened');

        dom.addEventListener(dlg.dialogContainer || backdrop, 'click', (e) => {
            if (e.target === dlg.dialogContainer) close(dlg);
        }, { passive: true });

        dlg.classList.add('opened');
        dlg.dispatchEvent(new CustomEvent('open'));

        if (dlg.getAttribute('data-lockscroll') === 'true' && !document.body.classList.contains('noScroll')) {
            document.body.classList.add('noScroll');
            removeScrollLockOnClose = true;
        }

        // Animate open
        const onOpenAnimFinish = () => {
            focusManager.pushScope(dlg);
            if (dlg.getAttribute('data-autofocus') === 'true') focusManager.autoFocus(dlg);
            if (document.activeElement && !dlg.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
        };

        if (enableAnimation()) dom.addEventListener(dlg, dom.whichAnimationEvent(), onOpenAnimFinish, { once: true });
        else onOpenAnimFinish();

        if (historyEnabled) {
            const state = history.location.state || {};
            const dialogs = [...(state.dialogs || []), hash];
            history.push(history.location.pathname + history.location.search, { ...state, dialogs });
            this.unlisten = history.listen(({ location }) => {
                if (!(location.state?.dialogs || []).includes(hash)) close(dlg);
            });
        } else inputManager.on(dlg, onBackCommand);
    }
}

export function open(dlg: HTMLElement): Promise<any> {
    globalOnOpenCallback?.(dlg);
    dlg.parentNode?.removeChild(dlg);
    const container = document.createElement('div');
    container.classList.add('dialogContainer');
    container.appendChild(dlg);
    (dlg as any).dialogContainer = container;
    document.body.appendChild(container);
    return new Promise((resolve) => new DialogHashHandler(dlg, `dlg${Date.now()}`, resolve));
}

export function close(dlg: HTMLElement): void {
    if (dlg.classList.contains('hide')) return;
    dlg.dispatchEvent(new CustomEvent('closing'));
    const finish = () => {
        focusManager.popScope();
        dlg.classList.add('hide');
        dlg.dispatchEvent(new CustomEvent('_close'));
    };

    if (enableAnimation() && (dlg as any).animationConfig) {
        const cfg = (dlg as any).animationConfig.exit;
        dlg.style.animation = `${cfg.name} ${cfg.timing.duration}ms ease-out normal both`;
        dom.addEventListener(dlg, dom.whichAnimationEvent(), finish, { once: true });
    } else finish();
}

export function createDialog(options: DialogOptions = {}): HTMLElement {
    const dlg = document.createElement('div') as any;
    if (options.id) dlg.id = options.id;
    dlg.classList.add('focuscontainer', 'hide', 'dialog');

    if (options.size === 'fullscreen' || options.lockScroll) dlg.setAttribute('data-lockscroll', 'true');
    if (options.enableHistory !== false) dlg.setAttribute('data-history', 'true');
    if (options.modal !== false) dlg.setAttribute('modal', 'modal');
    if (options.autoFocus !== false) dlg.setAttribute('data-autofocus', 'true');

    const durationEntry = options.entryAnimationDuration || (options.size !== 'fullscreen' ? 180 : 280);
    const durationExit = options.exitAnimationDuration || (options.size !== 'fullscreen' ? 120 : 220);

    dlg.animationConfig = {
        entry: { name: options.entryAnimation || 'scaleup', timing: { duration: durationEntry } },
        exit: { name: options.exitAnimation || 'scaledown', timing: { duration: durationExit } }
    };

    if (options.scrollX) dlg.classList.add('scrollX', 'smoothScrollX');
    else if (options.scrollY !== false) dlg.classList.add('smoothScrollY');

    if (options.removeOnClose) dlg.setAttribute('data-removeonclose', 'true');
    if (options.size) dlg.classList.add('dialog-fixedSize', `dialog-${options.size}`);

    if (enableAnimation()) {
        const name = dlg.animationConfig.entry.name;
        dlg.style.animation = `${name} ${durationEntry}ms ease-out normal both`;
    }

    return dlg;
}

export function setOnOpen(val: (dlg: HTMLElement) => void): void {
    globalOnOpenCallback = val;
}

const dialogHelper = { open, close, createDialog, setOnOpen };
export default dialogHelper;
