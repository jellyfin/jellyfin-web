
import browser from '../scripts/browser';
import dialog from './dialog/dialog';
import globalize from '../scripts/globalize';

/* eslint-disable indent */

    function replaceAll(originalString, strReplace, strWith) {
        const reg = new RegExp(strReplace, 'ig');
        return originalString.replace(reg, strWith);
    }

    export default function (text, title) {
        let options;
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
            const items = [];

            items.push({
                name: globalize.translate('ButtonGotIt'),
                id: 'ok',
                type: 'submit'
            });

            options.buttons = items;
            return dialog.show(options);
        }

        return Promise.resolve();
    }

/* eslint-enable indent */
