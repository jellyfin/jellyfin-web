import globalize from '../lib/globalize';
import dialog from './dialog/dialog';
import { appRouter } from './router/appRouter';

export interface AlertOptions {
    title?: string;
    text?: string;
    html?: string;
}

export default async function alert(text: string | AlertOptions, title?: string): Promise<string> {
    const options: any = typeof text === 'string' ? { title, text } : text;

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
