import DOMPurify from 'dompurify';
import escapeHtml from 'escape-html';
import dialogHelper from '../dialogHelper/dialogHelper';
import dom from '../../scripts/dom';
import layoutManager from '../layoutManager';
import scrollHelper from '../../scripts/scrollHelper';
import globalize from '../../lib/globalize';
import 'material-design-icons-iconfont';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-input/emby-input';
import '../formdialog.scss';
import '../../styles/flexstyles.scss';
import template from './dialog.template.html';

function showDialog(options = { dialogOptions: {}, buttons: [] }) {
    const dialogOptions = {
        removeOnClose: true,
        scrollY: false,
        ...options.dialogOptions
    };

    const enableTvLayout = layoutManager.tv;

    if (enableTvLayout) {
        dialogOptions.size = 'fullscreen';
    }

    const dlg = dialogHelper.createDialog(dialogOptions);

    dlg.classList.add('formDialog');

    dlg.innerHTML = globalize.translateHtml(template, 'core');

    dlg.classList.add('align-items-center');
    dlg.classList.add('justify-content-center');
    const formDialogContent = dlg.querySelector('.formDialogContent');
    formDialogContent.classList.add('no-grow');

    if (enableTvLayout) {
        formDialogContent.style['max-width'] = '50%';
        formDialogContent.style['max-height'] = '60%';
        scrollHelper.centerFocus.on(formDialogContent, false);
    } else {
        formDialogContent.style.maxWidth = `${Math.min((options.buttons.length * 150) + 200, dom.getWindowSize().innerWidth - 50)}px`;
        dlg.classList.add('dialog-fullscreen-lowres');
    }

    if (options.title) {
        dlg.querySelector('.formDialogHeaderTitle').innerText = options.title || '';
    } else {
        dlg.querySelector('.formDialogHeaderTitle').classList.add('hide');
    }

    const displayText = options.html || options.text || '';
    dlg.querySelector('.text').innerHTML = DOMPurify.sanitize(displayText);

    if (!displayText) {
        dlg.querySelector('.dialogContentInner').classList.add('hide');
    }

    let i;
    let length;
    let html = '';
    let hasDescriptions = false;

    for (i = 0, length = options.buttons.length; i < length; i++) {
        const item = options.buttons[i];
        const autoFocus = i === 0 ? ' autofocus' : '';

        let buttonClass = 'btnOption raised formDialogFooterItem formDialogFooterItem-autosize';

        if (item.type) {
            buttonClass += ` button-${item.type}`;
        }

        if (item.description) {
            hasDescriptions = true;
        }

        if (hasDescriptions) {
            buttonClass += ' formDialogFooterItem-vertical formDialogFooterItem-nomarginbottom';
        }

        html += `<button is="emby-button" type="button" class="${buttonClass}" data-id="${item.id}"${autoFocus}>${escapeHtml(item.name)}</button>`;

        if (item.description) {
            html += `<div class="formDialogFooterItem formDialogFooterItem-autosize fieldDescription" style="margin-top:.25em!important;margin-bottom:1.25em!important;">${item.description}</div>`;
        }
    }

    dlg.querySelector('.formDialogFooter').innerHTML = html;

    if (hasDescriptions) {
        dlg.querySelector('.formDialogFooter').classList.add('formDialogFooter-vertical');
    }

    let dialogResult;
    function onButtonClick() {
        dialogResult = this.getAttribute('data-id');
        dialogHelper.close(dlg);
    }

    const buttons = dlg.querySelectorAll('.btnOption');
    for (i = 0, length = buttons.length; i < length; i++) {
        buttons[i].addEventListener('click', onButtonClick);
    }

    return dialogHelper.open(dlg).then(() => {
        if (enableTvLayout) {
            scrollHelper.centerFocus.off(dlg.querySelector('.formDialogContent'), false);
        }

        if (dialogResult) {
            return dialogResult;
        } else {
            return Promise.reject();
        }
    });
}

export function show(text, title ?: any) {
    let options;
    if (typeof text === 'string') {
        options = {
            title: title,
            text: text
        };
    } else {
        options = text;
    }

    return showDialog(options);
}

export default {
    show
};
