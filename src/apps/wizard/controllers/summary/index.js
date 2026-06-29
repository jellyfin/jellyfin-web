import escapeHtml from 'escape-html';

import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';
import { goToPreviousWizardStep } from 'apps/wizard/controllers/wizardSteps';

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
        const additionalUsers = users.filter(function (u) {
            return !u.Policy.IsAdministrator;
        }).length;
        const metadataCulture = cultures.find(function (c) {
            return c.TwoLetterISOLanguageName === startupConfig.PreferredMetadataLanguage;
        });
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
        loading.hide();
    });
}

// Setup completion changes the server's auth state, so reload from the app root rather than re-enter the wizard route.
function reloadToAppRoot() {
    const href = window.location.href;
    const index = href.toLowerCase().lastIndexOf('/web');
    window.location.href = index !== -1 ? href.substring(0, index + 4) + '/' : window.location.origin;
}

function finish() {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.ajax({
        url: apiClient.getUrl('Startup/Complete'),
        type: 'POST'
    }).then(function () {
        loading.hide();
        reloadToAppRoot();
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
    view.querySelector('.btnWizardPrev').addEventListener('click', function () {
        goToPreviousWizardStep('summary');
    });
    renderWizardProgress(view, 'summary');
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        loadSummary(view);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
