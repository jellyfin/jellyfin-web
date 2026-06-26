import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';

function save(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    const enableRemoteAccess = page.querySelector('#chkRemoteAccess').checked;
    const enableUPnP = page.querySelector('#chkEnableUPnP').checked;

    apiClient.ajax({
        type: 'POST',
        data: JSON.stringify({
            EnableRemoteAccess: enableRemoteAccess
        }),
        url: apiClient.getUrl('Startup/RemoteAccess'),
        contentType: 'application/json'
    }).then(function () {
        return apiClient.getNamedConfiguration('network').then(function (networkConfig) {
            networkConfig.EnableUPnP = enableUPnP;
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
    });
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

function onRemoteAccessChange() {
    // UPnP is only relevant when remote access is allowed.
    const enableUPnP = document.querySelector('#chkEnableUPnP');
    enableUPnP.disabled = !this.checked;
    if (!this.checked) {
        enableUPnP.checked = false;
    }
}

export default function (view) {
    view.querySelector('.wizardSettingsForm').addEventListener('submit', onSubmit);
    view.querySelector('#chkEnableUPnP').addEventListener('change', onUPnPChange);
    view.querySelector('#chkRemoteAccess').addEventListener('change', onRemoteAccessChange);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
