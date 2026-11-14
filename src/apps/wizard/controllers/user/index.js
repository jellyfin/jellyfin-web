import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';

import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import Dashboard from 'utils/dashboard';

import 'styles/dashboard.scss';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

function nextWizardPage() {
    Dashboard.navigate('wizard/library')
        .catch(err => {
            console.error('[Wizard > User] error navigating to library setup', err);
        });
}

async function onUpdateUserComplete(result, apiClient, username, password, culture) {
    console.debug('[Wizard > User] user update complete:', result);
    const api = ServerConnections.getApi(apiClient.serverId());

    const { data: loginResult } = await getAuthenticationApi(api).authenticateUserByName({
        authenticateUserByName: {
            Username: username,
            Pw: password
        }
    });

    await apiClient.onAuthenticated(apiClient, loginResult);
    userSettings.language(culture);
    globalize.updateCurrentCulture();

    const systemApi = getSystemApi(api);
    const { data } = await systemApi.getConfiguration();

    await systemApi.updateConfiguration({ serverConfiguration: { ...data, UICulture: culture } });
    loading.hide();
    nextWizardPage();
}

async function onUpdateUserError(result) {
    const message = await result.text();
    console.warn('[Wizard > User] user update failed:', message);
    toast(globalize.translate('ErrorDefault'));
    loading.hide();
}

function submit(form) {
    loading.show();
    const username = form.querySelector('#txtUsername').value.trim();
    const password = form.querySelector('#txtManualPassword').value;
    const culture = userSettings.language();
    const apiClient = ServerConnections.currentApiClient();
    apiClient
        .ajax({
            type: 'POST',
            data: JSON.stringify({
                Name: username,
                Password: password
            }),
            url: apiClient.getUrl('Startup/User'),
            contentType: 'application/json'
        })
        .then((result) => onUpdateUserComplete(result, apiClient, username, password, culture))
        .catch(onUpdateUserError);
}

function onSubmit(e) {
    const form = this;

    if (form.querySelector('#txtManualPassword').value != form.querySelector('#txtPasswordConfirm').value) {
        toast(globalize.translate('PasswordMatchError'));
    } else {
        submit(form);
    }

    e.preventDefault();
    return false;
}

export default function (view) {
    view.querySelector('.wizardUserForm').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
