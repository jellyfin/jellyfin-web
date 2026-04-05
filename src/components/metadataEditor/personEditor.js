import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';
import { getPersonsApi } from '@jellyfin/sdk/lib/utils/api/persons-api';

import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import { toApi } from '../../utils/jellyfin-apiclient/compat';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { setupAutocomplete } from './autocompleteHelper';
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

function searchPersons(searchTerm, suggestionsContainer) {
    if (!searchTerm || searchTerm.length < 2) {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.innerHTML = '';
        return;
    }

    const apiClient = ServerConnections.currentApiClient();
    if (!apiClient) return;

    const api = toApi(apiClient);

    getPersonsApi(api).getPersons({
        searchTerm: searchTerm,
        limit: 10,
        fields: ['PrimaryImageAspectRatio'],
        enableImages: false
    }).then(response => {
        const items = response.data.Items || [];

        if (items.length === 0) {
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.innerHTML = '';
            return;
        }

        let html = '';
        items.forEach(item => {
            html += `<div class="suggestionItem" data-person-name="${item.Name || ''}" style="padding:0.8em;cursor:pointer;border-bottom:1px solid var(--jf-palette-divider);">`;
            html += `<div style="font-weight:500;">${item.Name || ''}</div>`;
            html += '</div>';
        });

        suggestionsContainer.innerHTML = html;
        suggestionsContainer.style.display = 'block';
    }).catch(() => {
        suggestionsContainer.style.display = 'none';
        suggestionsContainer.innerHTML = '';
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

        const txtPersonName = dlg.querySelector('.txtPersonName');
        const suggestionsContainer = dlg.querySelector('.personSuggestionsContainer');

        // Setup autocomplete behavior
        const cleanupAutocomplete = setupAutocomplete(
            txtPersonName,
            suggestionsContainer,
            searchPersons,
            {
                dataAttribute: 'data-person-name',
                boundaryElement: dlg
            }
        );

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
        }

        dialogHelper.open(dlg);

        dlg.addEventListener('close', function () {
            cleanupAutocomplete();

            if (layoutManager.tv) {
                centerFocus(dlg.querySelector('.formDialogContent'), false, false);
            }

            if (submitted) {
                resolve(person);
            } else {
                reject();
            }
        });

        let selectPersonTypeOptions = '';
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

