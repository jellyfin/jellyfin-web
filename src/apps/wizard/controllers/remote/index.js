import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';

import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

function validate(page) {
    // HTTPS will silently fail to bind on the server without a certificate.
    if (page.querySelector('#chkEnableHttps').checked
        && !page.querySelector('#txtCertificatePath').value.trim()) {
        toast(globalize.translate('MessageHttpsCertificateRequired'));
        return false;
    }

    const httpsPort = parseInt(page.querySelector('#txtHttpsPort').value, 10);
    if (!Number.isNaN(httpsPort) && (httpsPort < 1 || httpsPort > 65535)) {
        toast(globalize.translate('MessageInvalidPortNumber'));
        return false;
    }

    return true;
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

            const httpsPort = parseInt(page.querySelector('#txtHttpsPort').value, 10);
            if (!Number.isNaN(httpsPort)) {
                networkConfig.InternalHttpsPort = httpsPort;
            }

            return apiClient.updateNamedConfiguration('network', networkConfig);
        });
    }).then(function () {
        loading.hide();
        Dashboard.navigate('wizard/advanced');
    }).catch(function (err) {
        console.error('[Wizard > Remote] failed to save remote access settings', err);
        toast(globalize.translate('ErrorDefault'));
        loading.hide();
    });
}

function reload(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    Promise.all([
        apiClient.getNamedConfiguration('network'),
        apiClient.getJSON(apiClient.getUrl('Startup/RemoteAccess'))
    ]).then(function ([config, remoteConfig]) {
        page.querySelector('#chkRemoteAccess').checked = remoteConfig.EnableRemoteAccess !== false;
        page.querySelector('#chkEnableUPnP').checked = config.EnableUPnP;
        page.querySelector('#chkEnableHttps').checked = config.EnableHttps;
        page.querySelector('#txtHttpsPort').value = config.InternalHttpsPort || '';
        page.querySelector('#txtCertificatePath').value = config.CertificatePath || '';
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
    if (validate(this)) {
        save(this);
    }
    return false;
}

function onUPnPChange() {
    // Warn the user about the security implications before enabling UPnP.
    if (this.checked) {
        confirm({
            title: globalize.translate('HeaderUPnPSecurityWarning'),
            text: globalize.translate('MessageUPnPSecurityWarning')
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
        Dashboard.navigate('wizard/users');
    });
    renderWizardProgress(view);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(this);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
