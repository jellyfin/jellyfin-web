import { appRouter } from '../router/appRouter';
import browser from '../../scripts/browser';
import dialog from '../dialog/dialog';
import globalize from '../../scripts/globalize';

interface OptionItem {
    id: string,
    name: string,
    type: 'cancel' | 'delete' | 'submit'
}

interface ConfirmOptions {
    title: string,
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
        && !(browser.tizenVersion && browser.tizenVersion < 3)
        && browser.tv
        && window.confirm;
}

async function nativeConfirm(options: string | ConfirmOptions) {
    if (typeof options === 'string') {
        options = {
            title: '',
            text: options
        } as ConfirmOptions;
    }

    const text = (options.text ?? '').replace('<br/>', '\n');
    await appRouter.ready();
    const result = window.confirm(text);

    if (result) {
        return Promise.resolve();
    } else {
        return Promise.reject();
    }
}

async function customConfirm(options: string | ConfirmOptions, title: string) {
    if (typeof options === 'string') {
        options = {
            title: title,
            text: options
        };
    }

    const items: OptionItem[] = [];

    items.push({
        name: options.cancelText ?? globalize.translate('ButtonCancel'),
        id: 'cancel',
        type: 'cancel'
    });

    items.push({
        name: options.confirmText ?? globalize.translate('ButtonOk'),
        id: 'ok',
        type: options.primary === 'delete' ? 'delete' : 'submit'
    });

    options.buttons = items;

    await appRouter.ready();

    return dialog.show(options).then(result => {
        if (result === 'ok') {
            return Promise.resolve();
        }

        return Promise.reject();
    });
}

export default function confirm(options: string | ConfirmOptions, title?: string) {
    if (shouldUseNativeConfirm()) {
        return nativeConfirm(options);
    }
    return customConfirm(options, title ?? '');
}
