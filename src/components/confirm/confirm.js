import browser from '../../scripts/browser';
import dialog from '../dialog/dialog';
import globalize from '../../scripts/globalize';

function replaceAll(str, find, replace) {
    return str.split(find).join(replace);
}

function nativeConfirm(options) {
    if (typeof options === 'string') {
        options = {
            title: '',
            text: options
        };
    }

    const text = replaceAll(options.text || '', '<br/>', '\n');
    const result = window.confirm(text);

    if (result) {
        return Promise.resolve();
    } else {
        return Promise.reject();
    }
}

function customConfirm(text, title) {
    let options;
    if (typeof text === 'string') {
        options = {
            title: title,
            text: text
        };
    } else {
        options = text;
    }

    const items = [];

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

    return dialog.show(options).then(result => {
        if (result === 'ok') {
            return Promise.resolve();
        }

        return Promise.reject();
    });
}

const confirm = browser.tv && window.confirm ? nativeConfirm : customConfirm;

export default confirm;
