import { appRouter } from './router/appRouter';
import browser from '../scripts/browser';
import dialog from './dialog/dialog';
import globalize from '../lib/globalize';

export default async function (text: string, title?: string) {
    // Modals seem to be blocked on Web OS and Tizen 2.x
    const canUseNativeAlert = !!(
        !browser.web0s
        && !(browser.tizenVersion && (browser.tizenVersion < 3 || browser.tizenVersion >= 8))
        && browser.tv
        && window.alert
    );

    const options: {title?: string, text?: string, buttons?: any[]} = typeof text === 'string' ? { title, text } : text;

    await appRouter.ready();

    if (canUseNativeAlert) {
        alert((options.text || '').replaceAll('<br/>', '\n'));

        return Promise.resolve();
    }

    options.buttons = [
        {
            name: globalize.translate('ButtonGotIt'),
            id: 'ok',
            type: 'submit'
        }
    ];

    return dialog.show(options);
}
