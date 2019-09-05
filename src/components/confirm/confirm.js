define(['dialog', 'globalize'], function (dialog, globalize) {
    'use strict';

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
});
