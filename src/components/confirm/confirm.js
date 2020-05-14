define(['browser', 'dialog', 'globalize'], function(browser, dialog, globalize) {
    'use strict';

    function replaceAll(str, find, replace) {
        return str.split(find).join(replace);
    }

    if (browser.tv && window.confirm) {
        // Use the native confirm dialog
        return function (options) {
            if (typeof options === 'string') {
                options = {
                    title: '',
                    text: options
                };
            }

            var text = replaceAll(options.text || '', '<br/>', '\n');
            var result = confirm(text);

            if (result) {
                return Promise.resolve();
            } else {
                return Promise.reject();
            }
        };
    } else {
        // Use our own dialog
        return function (text, title) {
            var options;
            if (typeof text === 'string') {
                options = {
                    title: title,
                    text: text
                };
            } else {
                options = text;
            }

            var items = [];

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

            return dialog(options).then(function (result) {
                if (result === 'ok') {
                    return Promise.resolve();
                }

                return Promise.reject();
            });
        };
    }
});
