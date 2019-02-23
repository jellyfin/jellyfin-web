define(['browser', 'dialog', 'globalize'], function (browser, dialog, globalize) {
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

        if (browser.tv && window.alert) {
            alert(replaceAll(options.text || '', '<br/>', '\n'));
        } else {
            var items = [];

            items.push({
                name: globalize.translate('ButtonGotIt'),
                id: 'ok',
                type: 'submit'
            });

            options.buttons = items;

            return dialog(options).then(function (result) {
                if (result === 'ok') {
                    return Promise.resolve();
                }
    
                return Promise.reject();
            });
        }

        return Promise.resolve();
    };
});