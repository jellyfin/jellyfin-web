import dialog, { DialogButton } from 'components/dialog/dialog';
import { appRouter } from 'components/router/appRouter';
import globalize from 'lib/globalize';

interface ConfirmOptions {
    title?: string;
    text: string;
    cancelText?: string;
    confirmText?: string;
    primary?: string;
    buttons?: DialogButton[];
}

async function confirm(options: string | ConfirmOptions, title: string = '') {
    if (typeof options === 'string') {
        options = {
            title,
            text: options
        };
    }

    const items: DialogButton[] = [];

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

    await appRouter.ready();

    return dialog.show(options as any).then(result => {
        if (result === 'ok') {
            return Promise.resolve();
        }

        return Promise.reject(new Error('Confirm dialog rejected'));
    });
}

export default confirm;
