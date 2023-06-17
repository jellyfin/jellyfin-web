import escapeHTML from 'escape-html';

import datetime from '../../scripts/datetime';
import loading from '../../components/loading/loading';
import dom from '../../scripts/dom';
import globalize from '../../scripts/globalize';
import '../../elements/emby-button/emby-button';
import confirm from '../../components/confirm/confirm';
import { pageIdOn } from '../../utils/dashboard';

function revoke(page, key) {
    confirm(globalize.translate('MessageConfirmRevokeApiKey'), globalize.translate('HeaderConfirmRevokeApiKey')).then(function () {
        loading.show();
        ApiClient.ajax({
            type: 'DELETE',
            url: ApiClient.getUrl('Auth/Keys/' + key)
        }).then(function () {
            loadData(page);
        });
    });
}

function renderKeys(page, keys) {
    const rows = keys.map(function (item) {
        let html = '';
        html += '<tr class="detailTableBodyRow detailTableBodyRow-shaded">';
        html += '<td class="detailTableBodyCell">';
        html += '<button type="button" is="emby-button" data-token="' + escapeHTML(item.AccessToken) + '" class="raised raised-mini btnRevoke" data-mini="true" title="' + globalize.translate('ButtonRevoke') + '" style="margin:0;">' + globalize.translate('ButtonRevoke') + '</button>';
        html += '</td>';
        html += '<td class="detailTableBodyCell" style="vertical-align:middle;">';
        html += escapeHTML(item.AccessToken);
        html += '</td>';
        html += '<td class="detailTableBodyCell" style="vertical-align:middle;">';
        html += escapeHTML(item.AppName) || '';
        html += '</td>';
        html += '<td class="detailTableBodyCell" style="vertical-align:middle;">';
        const date = datetime.parseISO8601Date(item.DateCreated, true);
        html += datetime.toLocaleDateString(date) + ' ' + datetime.getDisplayTime(date);
        html += '</td>';
        html += '</tr>';
        return html;
    }).join('');
    page.querySelector('.resultBody').innerHTML = rows;
    loading.hide();
}

function loadData(page) {
    loading.show();
    ApiClient.getJSON(ApiClient.getUrl('Auth/Keys')).then(function (result) {
        renderKeys(page, result.Items);
    });
}

function showNewKeyPrompt(page) {
    import('../../components/prompt/prompt').then(({ default: prompt }) => {
        prompt({
            title: globalize.translate('HeaderNewApiKey'),
            label: globalize.translate('LabelAppName'),
            description: globalize.translate('LabelAppNameExample')
        }).then(function (value) {
            ApiClient.ajax({
                type: 'POST',
                url: ApiClient.getUrl('Auth/Keys', {
                    App: value
                })
            }).then(function () {
                loadData(page);
            });
        });
    });
}

pageIdOn('pageinit', 'apiKeysPage', function () {
    const page = this;
    page.querySelector('.btnNewKey').addEventListener('click', function () {
        showNewKeyPrompt(page);
    });
    page.querySelector('.tblApiKeys').addEventListener('click', function (e) {
        const btnRevoke = dom.parentWithClass(e.target, 'btnRevoke');

        if (btnRevoke) {
            revoke(page, btnRevoke.getAttribute('data-token'));
        }
    });
});
pageIdOn('pagebeforeshow', 'apiKeysPage', function () {
    loadData(this);
});

