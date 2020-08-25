import browser from 'browser';
import dialog from 'dialog';
import globalize from 'globalize';

/* eslint-disable indent */
export default (() => {
    function replaceAll(str, find, replace) {
        return str.split(find).join(replace);
    }

    if (browser.tv && window.confirm) {
        // Use the native confirm dialog
        return options => {
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
        };
    } else {
        // Use our own dialog
        return (text, title) => {
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
        };
    }
})();
/* eslint-enable indent */
