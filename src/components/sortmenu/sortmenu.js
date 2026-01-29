/**
 * @deprecated This file is deprecated in favor of React + ui-primitives.
 *
 * Migration:
 * - Dialog-based UI → Radix UI Dialog
 * - Template-based rendering → React rendering
 * - imperative show() → React component with onSubmit callback
 *
 * @see src/ui-primitives/Dialog
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import '../../elements/emby-button/emby-button';
import template from './sortmenu.template.html?raw';

function onSubmit(e) {
    e.preventDefault();
    return false;
}

function initEditor(context, settings) {
    context.querySelector('form').addEventListener('submit', onSubmit);

    context.querySelector('.selectSortOrder').value = settings.sortOrder;
    context.querySelector('.selectSortBy').value = settings.sortBy;
}

function centerFocus(elem, horiz, on) {
    import('../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function fillSortBy(context, options) {
    const selectSortBy = context.querySelector('.selectSortBy');

    selectSortBy.innerHTML = options
        .map((o) => {
            return '<option value="' + o.value + '">' + o.name + '</option>';
        })
        .join('');
}

function saveValues(context, settingsKey) {
    userSettings.setFilter(
        settingsKey + '-sortorder',
        context.querySelector('.selectSortOrder').value
    );
    userSettings.setFilter(settingsKey + '-sortby', context.querySelector('.selectSortBy').value);
}

class SortMenu {
    show(options) {
        return new Promise((resolve, reject) => {
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
            html += '<h3 class="formDialogHeaderTitle">${Sort}</h3>';

            html += '</div>';

            html += template;

            dlg.innerHTML = globalize.translateHtml(html, 'core');

            fillSortBy(dlg, options.sortOptions);
            initEditor(dlg, options.settings);

            dlg.querySelector('.btnCancel').addEventListener('click', () => {
                dialogHelper.close(dlg);
            });

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, true);
            }

            let submitted;

            dlg.querySelector('form').addEventListener(
                'change',
                () => {
                    submitted = true;
                },
                true
            );

            dialogHelper.open(dlg).then(() => {
                if (layoutManager.tv) {
                    centerFocus(dlg.querySelector('.formDialogContent'), false, false);
                }

                if (submitted) {
                    saveValues(dlg, options.settingsKey);
                    resolve();
                    return;
                }

                reject();
            });
        });
    }
}

export default SortMenu;
