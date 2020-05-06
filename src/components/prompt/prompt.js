define(['browser', 'dialogHelper', 'layoutManager', 'scrollHelper', 'globalize', 'dom', 'require', 'material-icons', 'emby-button', 'paper-icon-button-light', 'emby-input', 'formDialogStyle'], function(browser, dialogHelper, layoutManager, scrollHelper, globalize, dom, require) {
    'use strict';

    function replaceAll(str, find, replace) {
        return str.split(find).join(replace);
    }

    function setInputProperties(dlg, options) {
        var txtInput = dlg.querySelector('#txtInput');

        if (txtInput.label) {
            txtInput.label(options.label || '');
        } else {
            txtInput.setAttribute('label', options.label || '');
        }
        txtInput.value = options.value || '';
    }

    function showDialog(options, template) {
        var dialogOptions = {
            removeOnClose: true,
            scrollY: false
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        }

        var dlg = dialogHelper.createDialog(dialogOptions);

        dlg.classList.add('formDialog');

        dlg.innerHTML = globalize.translateHtml(template, 'core');

        if (layoutManager.tv) {
            scrollHelper.centerFocus.on(dlg.querySelector('.formDialogContent'), false);
        } else {
            dlg.querySelector('.dialogContentInner').classList.add('dialogContentInner-mini');
            dlg.classList.add('dialog-fullscreen-lowres');
        }

        dlg.querySelector('.btnCancel').addEventListener('click', function (e) {
            dialogHelper.close(dlg);
        });

        dlg.querySelector('.formDialogHeaderTitle').innerHTML = options.title || '';

        if (options.description) {
            dlg.querySelector('.fieldDescription').innerHTML = options.description;
        } else {
            dlg.querySelector('.fieldDescription').classList.add('hide');
        }

        setInputProperties(dlg, options);

        var submitValue;

        dlg.querySelector('form').addEventListener('submit', function (e) {

            submitValue = dlg.querySelector('#txtInput').value;
            e.preventDefault();
            e.stopPropagation();

            // Important, don't close the dialog until after the form has completed submitting, or it will cause an error in Chrome
            setTimeout(function () {
                dialogHelper.close(dlg);
            }, 300);

            return false;
        });

        dlg.querySelector('.submitText').innerHTML = options.confirmText || globalize.translate('ButtonOk');

        dlg.style.minWidth = (Math.min(400, dom.getWindowSize().innerWidth - 50)) + 'px';

        return dialogHelper.open(dlg).then(function () {
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
        return function (options) {
            if (typeof options === 'string') {
                options = {
                    label: '',
                    text: options
                };
            }

            var label = replaceAll(options.label || '', '<br/>', '\n');
            var result = prompt(label, options.text || '');

            if (result) {
                return Promise.resolve(result);
            } else {
                return Promise.reject(result);
            }
        };
    } else {
        return function (options) {
            return new Promise(function (resolve, reject) {
                require(['text!./prompt.template.html'], function (template) {
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
});
