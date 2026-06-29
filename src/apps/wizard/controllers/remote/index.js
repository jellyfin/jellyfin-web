import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep, goToPreviousWizardStep } from 'apps/wizard/controllers/wizardSteps';

import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

function validate(page) {
    // HTTPS will silently fail to bind on the server without a certificate.
    if (page.querySelector('#chkEnableHttps').checked
        && !page.querySelector('#txtCertificatePath').value.trim()) {
        toast(globalize.translate('MessageHttpsCertificateRequired'));
        return Promise.resolve(false);
    }

    const httpsPort = parseInt(page.querySelector('#txtHttpsPort').value, 10);
    if (!Number.isNaN(httpsPort) && (httpsPort < 1 || httpsPort > 65535)) {
        toast(globalize.translate('MessageInvalidPortNumber'));
        return Promise.resolve(false);
    }

    // The HTTP port is set on the next step; both servers can't share a port.
    const httpPort = parseInt(page.dataset.httpPort, 10);
    if (!Number.isNaN(httpsPort) && httpsPort === httpPort) {
        toast(globalize.translate('MessagePortConflict'));
        return Promise.resolve(false);
    }

    if (!Number.isNaN(httpsPort) && httpsPort < 1024) {
        return confirm({
            title: globalize.translate('HeaderPrivilegedPortWarning'),
            text: globalize.translate('MessagePrivilegedPortWarning'),
            primary: 'delete'
        }).then(function () {
            return true;
        }).catch(function () {
            return false;
        });
    }

    return Promise.resolve(true);
}

function save(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    const enableRemoteAccess = page.querySelector('#chkRemoteAccess').checked;

    apiClient.ajax({
        type: 'POST',
        data: JSON.stringify({
            EnableRemoteAccess: enableRemoteAccess
        }),
        url: apiClient.getUrl('Startup/RemoteAccess'),
        contentType: 'application/json'
    }).then(function () {
        return apiClient.getNamedConfiguration('network').then(function (networkConfig) {
            networkConfig.EnableUPnP = page.querySelector('#chkEnableUPnP').checked;
            networkConfig.EnableHttps = page.querySelector('#chkEnableHttps').checked;
            networkConfig.CertificatePath = page.querySelector('#txtCertificatePath').value || null;

            // Leave the stored password untouched when the field is blank, so it isn't cleared on revisit.
            const certPassword = page.querySelector('#txtCertificatePassword').value;
            if (certPassword) {
                networkConfig.CertificatePassword = certPassword;
            }

            const httpsPort = parseInt(page.querySelector('#txtHttpsPort').value, 10);
            if (!Number.isNaN(httpsPort)) {
                networkConfig.InternalHttpsPort = httpsPort;
            }

            return apiClient.updateNamedConfiguration('network', networkConfig);
        });
    }).then(function () {
        loading.hide();
        goToNextWizardStep('remoteaccess');
    }).catch(function (err) {
        console.error('[Wizard > Remote] failed to save remote access settings', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function reload(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getNamedConfiguration('network').then(function (config) {
        // EnableRemoteAccess lives in NetworkConfiguration, not the startup endpoint.
        page.querySelector('#chkRemoteAccess').checked = config.EnableRemoteAccess !== false;
        page.querySelector('#chkEnableUPnP').checked = config.EnableUPnP;
        page.querySelector('#chkEnableHttps').checked = config.EnableHttps;
        page.querySelector('#txtHttpsPort').value = config.InternalHttpsPort || '';
        page.querySelector('#txtCertificatePath').value = config.CertificatePath || '';
        // Remember the HTTP port (set on the next step) so we can reject a port collision here.
        page.dataset.httpPort = config.InternalHttpPort || '';
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
    const page = this;
    validate(page).then(function (valid) {
        if (valid) {
            save(page);
        }
    });
    return false;
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
    view.querySelector('.btnWizardPrev').addEventListener('click', function () {
        goToPreviousWizardStep('remoteaccess');
    });
    renderWizardProgress(view, 'remoteaccess');
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(this);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
