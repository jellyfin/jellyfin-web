define(['require', 'dialogHelper', 'loading', 'apphost', 'layoutManager', 'connectionManager', 'appRouter', 'globalize', 'userSettings', 'emby-checkbox', 'emby-input', 'paper-icon-button-light', 'emby-select', 'material-icons', 'css!./../formdialog', 'emby-button', 'flexStyles'], function (require, dialogHelper, loading, appHost, layoutManager, connectionManager, appRouter, globalize, userSettings) {
    'use strict';

    function onSubmit(e) {
        e.preventDefault();
        return false;
    }

    function initEditor(context, settings) {
        context.querySelector('form').addEventListener('submit', onSubmit);

        const elems = context.querySelectorAll('.viewSetting-checkboxContainer');

        for (let i = 0, length = elems.length; i < length; i++) {
            elems[i].querySelector('input').checked = settings[elems[i].getAttribute('data-settingname')] || false;
        }

        context.querySelector('.selectImageType').value = settings.imageType || 'primary';
    }

    function saveValues(context, settings, settingsKey) {
        const elems = context.querySelectorAll('.viewSetting-checkboxContainer');
        for (let i = 0, length = elems.length; i < length; i++) {
            userSettings.set(settingsKey + '-' + elems[i].getAttribute('data-settingname'), elems[i].querySelector('input').checked);
        }

        userSettings.set(settingsKey + '-imageType', context.querySelector('.selectImageType').value);
    }

    function centerFocus(elem, horiz, on) {
        require(['scrollHelper'], function (scrollHelper) {
            const fn = on ? 'on' : 'off';
            scrollHelper.centerFocus[fn](elem, horiz);
        });
    }

    function showIfAllowed(context, selector, visible) {
        const elem = context.querySelector(selector);

        if (visible && !elem.classList.contains('hiddenFromViewSettings')) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }
    }

    function ViewSettings() {

    }

    ViewSettings.prototype.show = function (options) {
        return new Promise(function (resolve, reject) {
            require(['text!./viewSettings.template.html'], function (template) {
                const dialogOptions = {
                    removeOnClose: true,
                    scrollY: false
                };

                if (layoutManager.tv) {
                    dialogOptions.size = 'fullscreen';
                } else {
                    dialogOptions.size = 'small';
                }

                const dlg = dialogHelper.createDialog(dialogOptions);

                dlg.classList.add('formDialog');

                let html = '';

                html += '<div class="formDialogHeader">';
                html += '<button is="paper-icon-button-light" class="btnCancel hide-mouse-idle-tv" tabindex="-1"><span class="material-icons arrow_back"></span></button>';
                html += '<h3 class="formDialogHeaderTitle">${Settings}</h3>';

                html += '</div>';

                html += template;

                dlg.innerHTML = globalize.translateHtml(html, 'core');

                const settingElements = dlg.querySelectorAll('.viewSetting');
                for (let i = 0, length = settingElements.length; i < length; i++) {
                    if (options.visibleSettings.indexOf(settingElements[i].getAttribute('data-settingname')) === -1) {
                        settingElements[i].classList.add('hide');
                        settingElements[i].classList.add('hiddenFromViewSettings');
                    } else {
                        settingElements[i].classList.remove('hide');
                        settingElements[i].classList.remove('hiddenFromViewSettings');
                    }
                }

                initEditor(dlg, options.settings);

                dlg.querySelector('.selectImageType').addEventListener('change', function () {
                    showIfAllowed(dlg, '.chkTitleContainer', this.value !== 'list');
                    showIfAllowed(dlg, '.chkYearContainer', this.value !== 'list');
                });

                dlg.querySelector('.btnCancel').addEventListener('click', function () {
                    dialogHelper.close(dlg);
                });

                if (layoutManager.tv) {
                    centerFocus(dlg.querySelector('.formDialogContent'), false, true);
                }

                let submitted;

                dlg.querySelector('.selectImageType').dispatchEvent(new CustomEvent('change', {}));

                dlg.querySelector('form').addEventListener('change', function () {
                    submitted = true;
                }, true);

                dialogHelper.open(dlg).then(function () {
                    if (layoutManager.tv) {
                        centerFocus(dlg.querySelector('.formDialogContent'), false, false);
                    }

                    if (submitted) {
                        saveValues(dlg, options.settings, options.settingsKey);
                        resolve();
                        return;
                    }

                    reject();
                });
            });
        });
    };

    return ViewSettings;
});
