import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';

import loading from 'components/loading/loading';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';

import 'elements/emby-checkbox/emby-checkbox';
import 'elements/emby-button/emby-button';
import 'elements/emby-select/emby-select';

function save(page) {
    loading.show();
    const systemApi = getSystemApi(ServerConnections.getApi());

    systemApi.getNamedConfiguration({ key: 'network' }).then(function ({ data }) {
        data.EnableRemoteAccess = page.querySelector('#chkRemoteAccess').checked;
        return systemApi.updateNamedConfiguration({ key: 'network', body: data });
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
