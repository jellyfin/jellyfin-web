import loading from '@/components/loading/loading';
import { ServerConnections } from '@/lib/jellyfin-apiclient';
import Dashboard from '@/utils/dashboard';

import '@/elements/emby-checkbox/emby-checkbox';
import '@/elements/emby-button/emby-button';
import '@/elements/emby-select/emby-select';

function save(page) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    const config = {
        EnableRemoteAccess: page.querySelector('#chkRemoteAccess').checked
    };

    apiClient.ajax({
        type: 'POST',
        data: JSON.stringify(config),
        url: apiClient.getUrl('Startup/RemoteAccess'),
        contentType: 'application/json'
    }).then(function () {
        loading.hide();
        navigateToNextPage();
    });
}

function navigateToNextPage() {
    Dashboard.navigate('wizard/finish');
}

function onSubmit(e) {
    save(this);
    e.preventDefault();
    return false;
}

export default function (view) {
    view.querySelector('.wizardSettingsForm').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
