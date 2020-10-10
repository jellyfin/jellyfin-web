import dialogHelper from 'dialogHelper';
import layoutManager from 'layoutManager';
import globalize from 'globalize';
import * as userSettings from 'userSettings';
import 'emby-checkbox';
import 'emby-input';
import 'paper-icon-button-light';
import 'emby-select';
import 'material-icons';
import 'css!./../formdialog';
import 'emby-button';
import 'flexStyles';

function onSubmit(e) {
    e.preventDefault();
    return false;
}

function initEditor(context, settings) {
    context.querySelector('form').addEventListener('submit', onSubmit);

    const elems = context.querySelectorAll('.viewSetting-checkboxContainer');

    for (const elem of elems) {
        elem.querySelector('input').checked = settings[elem.getAttribute('data-settingname')] || false;
    }

    context.querySelector('.selectImageType').value = settings.imageType || 'primary';
}

function saveValues(context, settings, settingsKey) {
    const elems = context.querySelectorAll('.viewSetting-checkboxContainer');
    for (const elem of elems) {
        userSettings.set(settingsKey + '-' + elem.getAttribute('data-settingname'), elem.querySelector('input').checked);
    }

    userSettings.set(settingsKey + '-imageType', context.querySelector('.selectImageType').value);
}

function centerFocus(elem, horiz, on) {
    import('scrollHelper').then(({default: scrollHelper}) => {
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

class ViewSettings {
    constructor() {
    }
    show(options) {
        return new Promise(function (resolve, reject) {
            import('text!./viewSettings.template.html').then(({default: template}) => {
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
                for (const settingElement of settingElements) {
                    if (options.visibleSettings.indexOf(settingElement.getAttribute('data-settingname')) === -1) {
                        settingElement.classList.add('hide');
                        settingElement.classList.add('hiddenFromViewSettings');
                    } else {
                        settingElement.classList.remove('hide');
                        settingElement.classList.remove('hiddenFromViewSettings');
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
    }
}

export default ViewSettings;
