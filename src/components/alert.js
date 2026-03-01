import { appRouter } from './router/appRouter';
import dialog from './dialog/dialog';
import globalize from '../lib/globalize';

/**
 * @typedef {import('./dialog/dialog').ShowDialogOptions} ShowDialogOptions
 */

/**
 * @overload
 * @param {ShowDialogOptions} text
 * @returns {Promise<any>}
 */

/**
 * @overload
 * @param {string} text
 * @param {string} title
 * @returns {Promise<any>}
 */
export default async function(text, title) {
    /** @type {ShowDialogOptions} */
    const options = typeof text === 'string' ? { title, text } : text;

    await appRouter.ready();

    options.buttons = [
        {
            name: globalize.translate('ButtonGotIt'),
            id: 'ok',
            type: 'submit'
        }
    ];

    return dialog.show(options);
}
