import { appRouter } from './router/appRouter';
import dialog from './dialog/dialog';
import globalize from '@/lib/globalize';

export default async function (text, title) {
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
