import dialog from 'components/dialog/dialog';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';
import browser from 'scripts/browser';

interface OptionItem {
    id: string,
    name: string,
    type: 'cancel' | 'delete' | 'submit'
}

interface ConfirmOptions {
    title?: string,
    text: string
    cancelText?: string,
    confirmText?: string,
    primary?: string
    buttons?: OptionItem[]
}

function shouldUseNativeConfirm() {
    // webOS seems to block modals
    // Tizen 2.x seems to block modals
    return !browser.web0s
        && !(browser.tizenVersion && (browser.tizenVersion < 3 || browser.tizenVersion >= 8))
        && browser.tv
        && !!window.confirm;
}

async function nativeConfirm(options: string | ConfirmOptions) {
    if (typeof options === 'string') {
        options = {
            text: options
        } as ConfirmOptions;
    }

    const text = (options.text || '').replace(/<br\/>/g, '\n');
    await appRouter.ready();
    const result = window.confirm(text);

    if (result) {
        return Promise.resolve();
    } else {
        return Promise.reject(new Error('Confirm dialog rejected'));
    }
}

async function customConfirm(options: string | ConfirmOptions, title: string = '') {
    if (typeof options === 'string') {
        options = {
            title,
            text: options
        };
    }

    const items: OptionItem[] = [];

    items.push({
        name: options.cancelText || globalize.translate('ButtonCancel'),
        id: 'cancel',
        type: 'cancel'
    });

    items.push({
        name: options.confirmText || globalize.translate('ButtonOk'),
        id: 'ok',
        type: options.primary === 'delete' ? 'delete' : 'submit'
    });

    options.buttons = items;

    await appRouter.ready();

    return dialog.show(options).then(result => {
        if (result === 'ok') {
            return Promise.resolve();
        }

        return Promise.reject(new Error('Confirm dialog rejected'));
    });
}

const confirm = shouldUseNativeConfirm() ? nativeConfirm : customConfirm;

export default confirm;
