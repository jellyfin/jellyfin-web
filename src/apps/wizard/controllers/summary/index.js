import escapeHtml from 'escape-html';

import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import { initWizardStep } from 'apps/wizard/controllers/wizardProgress';
import { getWizardDraft, applyWizardDraft, markWizardCompleted } from 'apps/wizard/controllers/wizardDraft';

import 'elements/emby-button/emby-button';

// Maps wizardDraft.js apply-stage names to a translatable label for error messages.
const STAGE_LABEL_KEYS = {
    config: 'WizardSummaryServer',
    users: 'WizardSummaryAdditionalUsers',
    remoteAccess: 'WizardSummaryRemoteAccess',
    libraries: 'WizardSummaryLibraries',
    network: 'WizardSummaryNetwork',
    complete: 'WizardSummaryFinish'
};

function renderSummaryRow(label, value, route) {
    return '<button type="button" class="wizardSummaryRow" data-route="' + route + '">'
        + '<span class="wizardSummaryLabel">' + escapeHtml(label) + '</span>'
        + '<span class="wizardSummaryValue">' + escapeHtml(value) + '</span>'
        + '<span class="material-icons wizardSummaryEditIcon edit" aria-hidden="true"></span>'
        + '</button>';
}

function loadSummary(view) {
    loading.show();
    const draft = getWizardDraft();
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getJSON(apiClient.getUrl('Startup/User')),
        apiClient.getCultures()
    ]).then(function ([adminUser, cultures]) {
        const yes = globalize.translate('Yes');
        const no = globalize.translate('No');
        const metadataCulture = cultures.find(c => c.TwoLetterISOLanguageName === draft.config.PreferredMetadataLanguage);
        const metadataLanguage = metadataCulture ? metadataCulture.DisplayName : (draft.config.PreferredMetadataLanguage || '');
        const hardwareAcceleration = draft.encoding.HardwareAccelerationType && draft.encoding.HardwareAccelerationType !== 'none' ?
            draft.encoding.HardwareAccelerationType.toUpperCase() :
            globalize.translate('None');

        const html = renderSummaryRow(globalize.translate('WizardSummaryServer'), draft.config.ServerName || '', 'wizard/start')
            + renderSummaryRow(globalize.translate('WizardSummaryAdmin'), adminUser.Name || '', 'wizard/user')
            + renderSummaryRow(globalize.translate('WizardSummaryAdditionalUsers'), String(draft.users.length), 'wizard/users')
            + renderSummaryRow(globalize.translate('WizardSummaryMetadataLanguage'), metadataLanguage, 'wizard/metadata')
            + renderSummaryRow(globalize.translate('WizardSummaryLibraries'), String(draft.libraries.length), 'wizard/library')
            + renderSummaryRow(globalize.translate('WizardSummaryRemoteAccess'), draft.remoteAccess.EnableRemoteAccess !== false ? yes : no, 'wizard/remoteaccess')
            + renderSummaryRow(globalize.translate('WizardSummaryHttps'), draft.network.EnableHttps ? yes : no, 'wizard/remoteaccess')
            + renderSummaryRow(globalize.translate('WizardSummaryUpnp'), draft.network.EnableUPnP ? yes : no, 'wizard/remoteaccess')
            + renderSummaryRow(globalize.translate('WizardSummaryHttpPort'), String(draft.network.InternalHttpPort || ''), 'wizard/advanced')
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
    applyWizardDraft(apiClient).then(function () {
        markWizardCompleted();
        loading.hide();
        // Setup completion changes auth state; replace history so back doesn't re-enter the wizard.
        window.location.replace(window.location.pathname);
    }).catch(function (err) {
        console.error('[Wizard > Summary] failed to complete setup', err);
        console.error('[Wizard > Summary] failed wizard stage', err.wizardStage);
        const labelKey = STAGE_LABEL_KEYS[err.wizardStage];
        const message = labelKey ?
            globalize.translate('WizardErrorStageFailed', globalize.translate(labelKey)) :
            globalize.translate('ErrorDefault');
        toast(message);
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
