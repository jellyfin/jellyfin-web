import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { initWizardStep } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep, parsePort } from 'apps/wizard/controllers/wizardSteps';
import { validatePort } from 'apps/wizard/controllers/wizardPortValidation';
import { getWizardDraft } from 'apps/wizard/controllers/wizardDraft';

import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

function save(page) {
    const draft = getWizardDraft();

    draft.remoteAccess.EnableRemoteAccess = page.querySelector('#chkRemoteAccess').checked;

    draft.network.EnableUPnP = page.querySelector('#chkEnableUPnP').checked;
    draft.network.EnableHttps = page.querySelector('#chkEnableHttps').checked;
    draft.network.CertificatePath = page.querySelector('#txtCertificatePath').value || null;

    // Leave the stored password untouched when the field is blank, so it isn't cleared on revisit.
    const certPassword = page.querySelector('#txtCertificatePassword').value;
    if (certPassword) {
        draft.network.CertificatePassword = certPassword;
    }

    const httpsPort = parsePort(page.querySelector('#txtHttpsPort').value);
    if (!Number.isNaN(httpsPort)) {
        draft.network.InternalHttpsPort = httpsPort;
    }

    goToNextWizardStep('remoteaccess');
}

function reload(page) {
    loading.show();
    const draft = getWizardDraft();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getNamedConfiguration('network').then(function (config) {
        // EnableRemoteAccess lives in NetworkConfiguration, not the startup endpoint; prefer the draft if set.
        page.querySelector('#chkRemoteAccess').checked = draft.remoteAccess.EnableRemoteAccess ?? (config.EnableRemoteAccess !== false);
        page.querySelector('#chkEnableUPnP').checked = draft.network.EnableUPnP ?? config.EnableUPnP;
        page.querySelector('#chkEnableHttps').checked = draft.network.EnableHttps ?? config.EnableHttps;
        page.querySelector('#txtHttpsPort').value = draft.network.InternalHttpsPort || config.InternalHttpsPort || '';
        page.querySelector('#txtCertificatePath').value = (draft.network.CertificatePath ?? config.CertificatePath) || '';
        // Remember the HTTP port (set on the next step) so we can reject a port collision here.
        page.dataset.httpPort = draft.network.InternalHttpPort || config.InternalHttpPort || '';
        updateHttpsVisibility(page);
        updateUPnPState(page);
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Remote] failed to load configuration', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function updateHttpsVisibility(page) {
    const enabled = page.querySelector('#chkEnableHttps').checked;
    page.querySelector('.httpsFields').classList.toggle('hide', !enabled);
}

function updateUPnPState(page) {
    // UPnP is only relevant when remote access is allowed.
    const enableRemoteAccess = page.querySelector('#chkRemoteAccess').checked;
    const enableUPnP = page.querySelector('#chkEnableUPnP');
    enableUPnP.disabled = !enableRemoteAccess;
    if (!enableRemoteAccess) {
        enableUPnP.checked = false;
    }
}

function onSubmit(e) {
    e.preventDefault();
    const page = e.currentTarget;

    // HTTPS will silently fail to bind on the server without a certificate.
    if (page.querySelector('#chkEnableHttps').checked
        && !page.querySelector('#txtCertificatePath').value.trim()) {
        toast(globalize.translate('MessageHttpsCertificateRequired'));
        return;
    }

    // The HTTP port is set on the next step; both servers can't share a port.
    validatePort(page.querySelector('#txtHttpsPort').value, page.dataset.httpPort).then(function (valid) {
        if (valid) {
            save(page);
        }
    });
}

function onUPnPChange() {
    if (this.checked) {
        confirm({
            title: globalize.translate('HeaderUPnPSecurityWarning'),
            text: globalize.translate('MessageUPnPSecurityWarning'),
            primary: 'delete'
        }).catch(() => {
            this.checked = false;
        });
    }
}

export default function (view) {
    view.querySelector('.wizardSettingsForm').addEventListener('submit', onSubmit);
    view.querySelector('#chkEnableUPnP').addEventListener('change', onUPnPChange);
    view.querySelector('#chkRemoteAccess').addEventListener('change', function () {
        updateUPnPState(view);
    });
    view.querySelector('#chkEnableHttps').addEventListener('change', function () {
        updateHttpsVisibility(view);
    });
    initWizardStep(view, 'remoteaccess', {
        onShow() { reload(this); }
    });
}
