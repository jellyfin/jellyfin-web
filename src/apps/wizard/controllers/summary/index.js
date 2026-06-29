import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';

import 'elements/emby-button/emby-button';

function renderSummaryRow(label, value) {
    return '<div class="wizardSummaryRow"><dt class="wizardSummaryLabel">'
        + label
        + '</dt><dd class="wizardSummaryValue">'
        + value
        + '</dd></div>';
}

function loadSummary(view) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getJSON(apiClient.getUrl('Startup/Configuration')),
        apiClient.getJSON(apiClient.getUrl('Startup/User')),
        apiClient.getJSON(apiClient.getUrl('Users')),
        apiClient.getNamedConfiguration('network'),
        apiClient.getVirtualFolders()
    ]).then(function ([startupConfig, adminUser, users, networkConfig, virtualFolders]) {
        const remoteAccess = networkConfig.EnableRemoteAccess !== false ?
            globalize.translate('Yes') :
            globalize.translate('No');
        const additionalUsers = users.filter(function (u) {
            return !u.Policy.IsAdministrator;
        }).length;

        const html = renderSummaryRow(globalize.translate('WizardSummaryServer'), startupConfig.ServerName || '')
            + renderSummaryRow(globalize.translate('WizardSummaryAdmin'), adminUser.Name || '')
            + renderSummaryRow(globalize.translate('WizardSummaryAdditionalUsers'), String(additionalUsers))
            + renderSummaryRow(globalize.translate('WizardSummaryRemoteAccess'), remoteAccess)
            + renderSummaryRow(globalize.translate('WizardSummaryLibraries'), String(virtualFolders.length));

        view.querySelector('.wizardSummaryList').innerHTML = html;
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Summary] failed to load summary data', err);
        loading.hide();
    });
}

function finish() {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.ajax({
        url: apiClient.getUrl('Startup/Complete'),
        type: 'POST'
    }).then(function () {
        loading.hide();
        window.location.href = '';
    }).catch(function (err) {
        console.error('[Wizard > Summary] failed to complete setup', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

export default function (view) {
    view.querySelector('.btnWizardFinish').addEventListener('click', finish);
    view.querySelector('.btnWizardPrev').addEventListener('click', function () {
        window.history.back();
    });
    renderWizardProgress(view);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        loadSummary(view);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
