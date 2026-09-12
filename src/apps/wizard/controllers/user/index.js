import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import saveStartupUser from './saveStartupUser';

import 'styles/dashboard.scss';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

function nextWizardPage() {
    Dashboard.navigate('wizard/library')
        .catch(err => {
            console.error('[Wizard > User] error navigating to library setup', err);
        });
}

function onUpdateUserComplete() {
    loading.hide();
    nextWizardPage();
}

function onUpdateUserError(result) {
    toast(globalize.translate([401, 403].includes(result?.response?.status) ? 'MessageInvalidUser' : 'ErrorDefault'));
    loading.hide();
}

function submit(form) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    saveStartupUser(
        toApi(apiClient),
        form.querySelector('#txtUsername').value.trim(),
        form.querySelector('#txtManualPassword').value
    )
        .then(async result => {
            if (result) {
                await apiClient.onAuthenticated(apiClient, result);
            }
            onUpdateUserComplete();
        })
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

function onViewShow() {
    loading.show();
    const page = this;
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getJSON(apiClient.getUrl('Startup/User')).then(function (user) {
        page.querySelector('#txtUsername').value = user.Name || '';
        page.querySelector('#txtManualPassword').value = user.Password || '';
        loading.hide();
    });
}

export default function (view) {
    view.querySelector('.wizardUserForm').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
    view.addEventListener('viewshow', onViewShow);
}
