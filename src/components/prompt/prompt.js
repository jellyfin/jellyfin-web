import browser from '../../scripts/browser';
import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import scrollHelper from '../../scripts/scrollHelper';
import globalize from '../../scripts/globalize';
import dom from '../../scripts/dom';
import 'material-design-icons-iconfont';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-input/emby-input';
import '../formdialog.scss';
import template from './prompt.template.html';

export default (() => {
    function setInputProperties(dlg, options) {
        const txtInput = dlg.querySelector('#txtInput');

        if (txtInput.label) {
            txtInput.label(options.label || '');
        } else {
            txtInput.setAttribute('label', options.label || '');
        }
        txtInput.value = options.value || '';
    }

    function showDialog(options) {
        const dialogOptions = {
            removeOnClose: true,
            scrollY: false
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        }

        const dlg = dialogHelper.createDialog(dialogOptions);

        dlg.classList.add('formDialog');

        dlg.innerHTML = globalize.translateHtml(template, 'core');

        if (layoutManager.tv) {
            scrollHelper.centerFocus.on(dlg.querySelector('.formDialogContent'), false);
        } else {
            dlg.querySelector('.dialogContentInner').classList.add('dialogContentInner-mini');
            dlg.classList.add('dialog-fullscreen-lowres');
        }

        dlg.querySelector('.btnCancel').addEventListener('click', () => {
            dialogHelper.close(dlg);
        });

        dlg.querySelector('.formDialogHeaderTitle').innerText = options.title || '';

        if (options.description) {
            dlg.querySelector('.fieldDescription').innerText = options.description;
        } else {
            dlg.querySelector('.fieldDescription').classList.add('hide');
        }

        setInputProperties(dlg, options);

        let submitValue;

        dlg.querySelector('form').addEventListener('submit', e => {
            submitValue = dlg.querySelector('#txtInput').value;
            e.preventDefault();
            e.stopPropagation();

            // Important, don't close the dialog until after the form has completed submitting, or it will cause an error in Chrome
            setTimeout(() => {
                dialogHelper.close(dlg);
            }, 300);

            return false;
        });

        dlg.querySelector('.submitText').innerText = options.confirmText || globalize.translate('ButtonOk');

        dlg.style.minWidth = `${Math.min(400, dom.getWindowSize().innerWidth - 50)}px`;

        return dialogHelper.open(dlg).then(() => {
            if (layoutManager.tv) {
                scrollHelper.centerFocus.off(dlg.querySelector('.formDialogContent'), false);
            }

            if (submitValue) {
                return submitValue;
            } else {
                return Promise.reject();
            }
        });
    }

    if ((browser.tv || browser.xboxOne) && window.confirm) {
        return options => {
            if (typeof options === 'string') {
                options = {
                    label: '',
                    text: options
                };
            }

            const label = (options.label || '').replaceAll('<br/>', '\n');
            const result = prompt(label, options.text || '');

            if (result) {
                return Promise.resolve(result);
            } else {
                return Promise.reject(result);
            }
        };
    } else {
        return options => {
            if (typeof options === 'string') {
                options = {
                    title: '',
                    text: options
                };
            }
            return showDialog(options);
        };
    }
})();
