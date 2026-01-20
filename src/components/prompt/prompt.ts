import dialogHelper, { DialogOptions } from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import dom from '../../utils/dom';

export interface PromptOptions {
    title?: string;
    label?: string;
    value?: string;
    description?: string;
    confirmText?: string;
}

async function showDialog(options: PromptOptions): Promise<string> {
    const dialogOptions: DialogOptions = {
        removeOnClose: true,
        scrollY: false
    };

    if (layoutManager.tv) dialogOptions.size = 'fullscreen';

    const dlg = dialogHelper.createDialog(dialogOptions);
    dlg.classList.add('formDialog');

    let html = `
        <div class="formDialogHeader">
            <button is="paper-icon-button-light" class="btnCancel" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back"></span></button>
            <h3 class="formDialogHeaderTitle">${escape(options.title || '')}</h3>
        </div>
        <div class="formDialogContent">
            <div class="dialogContentInner">
                <form>
                    <div class="fieldDescription hide"></div>
                    <div class="inputContainer">
                        <input is="emby-input" id="txtInput" label="${options.label || ''}" value="${options.value || ''}" />
                    </div>
                    <div class="formDialogFooter">
                        <button is="emby-button" type="submit" class="raised btnOk"><span class="submitText"></span></button>
                    </div>
                </form>
            </div>
        </div>
    `;

    dlg.innerHTML = html;
    if (options.description) {
        const desc = dlg.querySelector('.fieldDescription') as HTMLElement;
        desc.innerText = options.description;
        desc.classList.remove('hide');
    }

    dlg.querySelector('.submitText')!.textContent = options.confirmText || globalize.translate('ButtonOk');
    dlg.querySelector('.btnCancel')!.addEventListener('click', () => dialogHelper.close(dlg));

    let submitValue: string | undefined;
    dlg.querySelector('form')!.addEventListener('submit', (e) => {
        submitValue = (dlg.querySelector('#txtInput') as HTMLInputElement).value;
        e.preventDefault();
        setTimeout(() => dialogHelper.close(dlg), 300);
    });

    await dialogHelper.open(dlg);
    if (submitValue !== undefined) return submitValue;
    throw new Error('Prompt cancelled');
}

export default function prompt(options: PromptOptions | string): Promise<string> {
    if (typeof options === 'string') {
        return showDialog({ title: '', label: options });
    }
    return showDialog(options);
}
