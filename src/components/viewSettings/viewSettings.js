import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-select/emby-select';
import 'material-design-icons-iconfont';
import '../formdialog.scss';
import '../../styles/flexstyles.scss';
import template from './viewSettings.template.html';

function onSubmit(e) {
    e.preventDefault();
    return false;
}

function initEditor(context, settings) {
    context.querySelector('form').addEventListener('submit', onSubmit);

    const elems = context.querySelectorAll('.viewSetting-checkboxContainer');

    for (const elem of elems) {
        elem.querySelector('input').checked = settings[elem.dataset.settingname] || false;
    }

    context.querySelector('.selectImageType').value = settings.imageType || 'primary';
}

function saveValues(context, settings, settingsKey) {
    const elems = context.querySelectorAll('.viewSetting-checkboxContainer');
    for (const elem of elems) {
        userSettings.set(settingsKey + '-' + elem.dataset.settingname, elem.querySelector('input').checked);
    }

    userSettings.set(settingsKey + '-imageType', context.querySelector('.selectImageType').value);
}

function centerFocus(elem, horiz, on) {
    import('../../scripts/scrollHelper').then((scrollHelper) => {
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
    show(options) {
        return new Promise(function (resolve) {
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
            html += `<button is="paper-icon-button-light" class="btnCancel hide-mouse-idle-tv" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
            html += '<h3 class="formDialogHeaderTitle">${Settings}</h3>';

            html += '</div>';

            html += template;

            dlg.innerHTML = globalize.translateHtml(html, 'core');

            const settingElements = dlg.querySelectorAll('.viewSetting');
            for (const settingElement of settingElements) {
                if (options.visibleSettings.indexOf(settingElement.dataset.settingname) === -1) {
                    settingElement.classList.add('hide');
                    settingElement.classList.add('hiddenFromViewSettings');
                } else {
                    settingElement.classList.remove('hide');
                    settingElement.classList.remove('hiddenFromViewSettings');
                }
            }

            initEditor(dlg, options.settings);

            dlg.querySelector('.selectImageType').addEventListener('change', function () {
                showIfAllowed(dlg, '.chkTitleContainer', this.value !== 'list' && this.value !== 'banner');
                showIfAllowed(dlg, '.chkYearContainer', this.value !== 'list' && this.value !== 'banner');
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
                    return resolve();
                }

                return resolve();
            });
        });
    }
}

export default ViewSettings;
