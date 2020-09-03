import browser from 'browser';
import dialogHelper from 'dialogHelper';
import layoutManager from 'layoutManager';
import scrollHelper from 'scrollHelper';
import globalize from 'globalize';
import dom from 'dom';
import 'material-icons';
import 'emby-button';
import 'paper-icon-button-light';
import 'emby-input';
import 'formDialogStyle';

/* eslint-disable indent */
export default (() => {
    function replaceAll(str, find, replace) {
        return str.split(find).join(replace);
    }

    function setInputProperties(dlg, options) {
        const txtInput = dlg.querySelector('#txtInput');

        if (txtInput.label) {
            txtInput.label(options.label || '');
        } else {
            txtInput.setAttribute('label', options.label || '');
        }
        txtInput.value = options.value || '';
    }

    function showDialog(options, template) {
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

        dlg.querySelector('.formDialogHeaderTitle').innerHTML = options.title || '';

        if (options.description) {
            dlg.querySelector('.fieldDescription').innerHTML = options.description;
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

        dlg.querySelector('.submitText').innerHTML = options.confirmText || globalize.translate('ButtonOk');

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

            const label = replaceAll(options.label || '', '<br/>', '\n');
            const result = prompt(label, options.text || '');

            if (result) {
                return Promise.resolve(result);
            } else {
                return Promise.reject(result);
            }
        };
    } else {
        return options => {
            return new Promise((resolve, reject) => {
                import('text!./prompt.template.html').then(({default: template}) => {
                    if (typeof options === 'string') {
                        options = {
                            title: '',
                            text: options
                        };
                    }
                    showDialog(options, template).then(resolve, reject);
                });
            });
        };
    }
})();
/* eslint-enable indent */
