import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';

import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-select/emby-select';
import '../formdialog.scss';
import template from './personEditor.template.html';

function centerFocus(elem, horiz, on) {
    import('../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function show(person) {
    return new Promise(function (resolve, reject) {
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
        let submitted = false;

        html += globalize.translateHtml(template, 'core');

        dlg.innerHTML = html;

        dlg.querySelector('.txtPersonName', dlg).value = person.Name || '';
        dlg.querySelector('.selectPersonType', dlg).value = person.Type || '';
        dlg.querySelector('.txtPersonRole', dlg).value = person.Role || '';

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
        }

        dialogHelper.open(dlg);

        dlg.addEventListener('close', function () {
            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            if (submitted) {
                resolve(person);
            } else {
                reject();
            }
        });

        let selectPersonTypeOptions = '<option value=""></option>';
        for (const type of Object.values(PersonKind)) {
            if (type === PersonKind.Unknown) {
                continue;
            }
            const selected = person.Type === type ? 'selected' : '';
            selectPersonTypeOptions += `<option value="${type}" ${selected}>\${${type}}</option>`;
        }
        dlg.querySelector('.selectPersonType').innerHTML = globalize.translateHtml(selectPersonTypeOptions);

        dlg.querySelector('.selectPersonType').addEventListener('change', function () {
            dlg.querySelector('.fldRole').classList.toggle(
                'hide',
                ![ PersonKind.Actor, PersonKind.GuestStar ].includes(this.value));
        });

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });

        dlg.querySelector('form').addEventListener('submit', function (e) {
            submitted = true;

            person.Name = dlg.querySelector('.txtPersonName', dlg).value;
            person.Type = dlg.querySelector('.selectPersonType', dlg).value;
            person.Role = dlg.querySelector('.txtPersonRole', dlg).value || null;

            dialogHelper.close(dlg);

            e.preventDefault();
            return false;
        });

        dlg.querySelector('.selectPersonType').dispatchEvent(new CustomEvent('change', {
            bubbles: true
        }));
    });
}

export default {
    show: show
};

