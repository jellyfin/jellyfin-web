import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';

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

            const httpPort = parseInt(page.querySelector('#txtPortNumber').value, 10);
            if (!Number.isNaN(httpPort)) {
                networkConfig.InternalHttpPort = httpPort;
            }

            const httpsPort = parseInt(page.querySelector('#txtHttpsPort').value, 10);
            if (!Number.isNaN(httpsPort)) {
                networkConfig.InternalHttpsPort = httpsPort;
            }

            return apiClient.updateNamedConfiguration('network', networkConfig);
        });
    }).then(function () {
        return apiClient.ajax({
            url: apiClient.getUrl('Startup/Complete'),
            type: 'POST'
        });
    }).then(function () {
        loading.hide();
        window.location.href = '';
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
        page.querySelector('#chkEnableUPnP').checked = config.EnableUPnP;
        page.querySelector('#chkEnableHttps').checked = config.EnableHttps;
        page.querySelector('#txtPortNumber').value = config.InternalHttpPort || '';
        page.querySelector('#txtHttpsPort').value = config.InternalHttpsPort || '';
        page.querySelector('#txtCertificatePath').value = config.CertificatePath || '';
        updateHttpsVisibility(page);
        updateUPnPState(page);
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Remote] failed to load network configuration', err);
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
    save(this);
    e.preventDefault();
    return false;
}

function onUPnPChange() {
    // Warn the user about the security implications before enabling UPnP.
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
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
        reload(this);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
