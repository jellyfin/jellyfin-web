import { escapeHtml } from 'utils/html';
import dom from '../../utils/dom';
import dialogHelper, { DialogOptions } from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';

export interface DialogButton {
    id: string;
    name: string;
    type?: string;
    description?: string;
}

export interface ShowDialogOptions {
    title?: string;
    text?: string;
    html?: string;
    buttons: DialogButton[];
    dialogOptions?: DialogOptions;
}

async function showDialog(options: ShowDialogOptions): Promise<string> {
    const dialogOptions: DialogOptions = {
        removeOnClose: true,
        scrollY: false,
        ...options.dialogOptions
    };

    if (layoutManager.tv) dialogOptions.size = 'fullscreen';

    const dlg = dialogHelper.createDialog(dialogOptions);
    dlg.classList.add('formDialog', 'align-items-center', 'justify-content-center');

    const html = `
        <div class="formDialogHeader">
            <h3 class="formDialogHeaderTitle">${escapeHtml(options.title || '')}</h3>
        </div>
        <div class="formDialogContent no-grow">
            <div class="dialogContentInner">
                <div class="text"></div>
            </div>
            <div class="formDialogFooter"></div>
        </div>
    `;

    dlg.innerHTML = html;
    const textElem = dlg.querySelector('.text') as HTMLElement;
    textElem.innerHTML = escapeHtml(options.html || options.text || '').replace(/\n/g, '<br>');

    const footer = dlg.querySelector('.formDialogFooter') as HTMLElement;
    let buttonsHtml = '';
    options.buttons.forEach((btn, i) => {
        const autoFocus = i === 0 ? ' autofocus' : '';
        buttonsHtml += `<button type="button" class="btnOption raised" data-id="${btn.id}"${autoFocus}>${escapeHtml(btn.name)}</button>`;
    });
    footer.innerHTML = buttonsHtml;

    let result: string | undefined;
    const onButtonClick = (e: Event) => {
        result = (e.currentTarget as HTMLElement).getAttribute('data-id') || undefined;
        dialogHelper.close(dlg);
    };

    dlg.querySelectorAll('.btnOption').forEach((btn) =>
        btn.addEventListener('click', onButtonClick)
    );

    await dialogHelper.open(dlg);
    if (result) return result;
    throw new Error('Dialog cancelled');
}

export function show(options: ShowDialogOptions | string, title?: string): Promise<string> {
    if (typeof options === 'string') {
        return showDialog({ title, text: options, buttons: [{ id: 'ok', name: 'OK' }] });
    }
    return showDialog(options);
}

const dialog = { show };
export default dialog;
