import escapeHtml from 'escape-html';

import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import { initWizardStep } from 'apps/wizard/controllers/wizardProgress';

import 'elements/emby-button/emby-button';

function renderSummaryRow(label, value, route) {
    return '<button type="button" class="wizardSummaryRow" data-route="' + route + '">'
        + '<span class="wizardSummaryLabel">' + escapeHtml(label) + '</span>'
        + '<span class="wizardSummaryValue">' + escapeHtml(value) + '</span>'
        + '<span class="material-icons wizardSummaryEditIcon edit" aria-hidden="true"></span>'
        + '</button>';
}

function loadSummary(view) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getJSON(apiClient.getUrl('Startup/Configuration')),
        apiClient.getJSON(apiClient.getUrl('Startup/User')),
        apiClient.getJSON(apiClient.getUrl('Users')),
        apiClient.getNamedConfiguration('network'),
        apiClient.getNamedConfiguration('encoding'),
        apiClient.getVirtualFolders(),
        apiClient.getCultures()
    ]).then(function ([startupConfig, adminUser, users, networkConfig, encodingConfig, virtualFolders, cultures]) {
        const yes = globalize.translate('Yes');
        const no = globalize.translate('No');
        const additionalUsers = users.filter(u => !u.Policy.IsAdministrator).length;
        const metadataCulture = cultures.find(c => c.TwoLetterISOLanguageName === startupConfig.PreferredMetadataLanguage);
        const metadataLanguage = metadataCulture ? metadataCulture.DisplayName : (startupConfig.PreferredMetadataLanguage || '');
        const hardwareAcceleration = encodingConfig.HardwareAccelerationType && encodingConfig.HardwareAccelerationType !== 'none' ?
            encodingConfig.HardwareAccelerationType.toUpperCase() :
            globalize.translate('None');

        const html = renderSummaryRow(globalize.translate('WizardSummaryServer'), startupConfig.ServerName || '', 'wizard/start')
            + renderSummaryRow(globalize.translate('WizardSummaryAdmin'), adminUser.Name || '', 'wizard/user')
            + renderSummaryRow(globalize.translate('WizardSummaryAdditionalUsers'), String(additionalUsers), 'wizard/users')
            + renderSummaryRow(globalize.translate('WizardSummaryMetadataLanguage'), metadataLanguage, 'wizard/metadata')
            + renderSummaryRow(globalize.translate('WizardSummaryLibraries'), String(virtualFolders.length), 'wizard/library')
            + renderSummaryRow(globalize.translate('WizardSummaryRemoteAccess'), networkConfig.EnableRemoteAccess !== false ? yes : no, 'wizard/remoteaccess')
            + renderSummaryRow(globalize.translate('WizardSummaryHttps'), networkConfig.EnableHttps ? yes : no, 'wizard/remoteaccess')
            + renderSummaryRow(globalize.translate('WizardSummaryUpnp'), networkConfig.EnableUPnP ? yes : no, 'wizard/remoteaccess')
            + renderSummaryRow(globalize.translate('WizardSummaryHttpPort'), String(networkConfig.InternalHttpPort || ''), 'wizard/advanced')
            + renderSummaryRow(globalize.translate('WizardSummaryHardwareAcceleration'), hardwareAcceleration, 'wizard/advanced');

        view.querySelector('.wizardSummaryList').innerHTML = html;
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Summary] failed to load summary data', err);
        toast(globalize.translate('ErrorDefault'));
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
        // Setup completion changes auth state; replace history so back doesn't re-enter the wizard.
        window.location.replace(window.location.pathname);
    }).catch(function (err) {
        console.error('[Wizard > Summary] failed to complete setup', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function onSummaryClick(e) {
    const row = e.target.closest('.wizardSummaryRow');
    if (row?.dataset.route) {
        Dashboard.navigate(row.dataset.route);
    }
}

export default function (view) {
    view.querySelector('.btnWizardFinish').addEventListener('click', finish);
    view.querySelector('.wizardSummaryList').addEventListener('click', onSummaryClick);
    initWizardStep(view, 'summary', {
        onShow() { loadSummary(view); }
    });
}
