import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';
import { renderWizardProgress } from 'apps/wizard/controllers/wizardProgress';

import 'styles/dashboard.scss';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

function nextWizardPage() {
    Dashboard.navigate('wizard/users')
        .catch(err => {
            console.error('[Wizard > User] error navigating to additional users', err);
        });
}

function onUpdateUserComplete(result) {
    console.debug('[Wizard > User] user update complete:', result);
    loading.hide();
    nextWizardPage();
}

async function onUpdateUserError(result) {
    // Authentication can reject with a non-Response error, so guard the body read.
    const message = result && typeof result.text === 'function' ? await result.text() : result;
    console.warn('[Wizard > User] user update failed:', message);
    toast(globalize.translate('ErrorDefault'));
    loading.hide();
}

function submit(form) {
    loading.show();
    const name = form.querySelector('#txtUsername').value.trim();
    const password = form.querySelector('#txtManualPassword').value;
    const apiClient = ServerConnections.currentApiClient();
    apiClient
        .ajax({
            type: 'POST',
            data: JSON.stringify({
                Name: name,
                Password: password
            }),
            url: apiClient.getUrl('Startup/User'),
            contentType: 'application/json'
        })
        // Authenticate as the new admin so later steps have the rights they need.
        // Skip re-auth if already logged in with the same account.
        .then(function () {
            return apiClient.getCurrentUser()
                .then(function (currentUser) {
                    if (currentUser.Name !== name) {
                        return apiClient.authenticateUserByName(name, password);
                    }
                })
                .catch(function () {
                    return apiClient.authenticateUserByName(name, password);
                });
        })
        .then(onUpdateUserComplete)
        .catch(onUpdateUserError);
}

function onSubmit(e) {
    const form = this;
    const password = form.querySelector('#txtManualPassword').value;

    e.preventDefault();

    if (password && password !== form.querySelector('#txtPasswordConfirm').value) {
        toast(globalize.translate('PasswordMatchError'));
        return false;
    }

    if (!password) {
        confirm({
            title: globalize.translate('HeaderAdminPasswordWarning'),
            text: globalize.translate('MessageAdminPasswordBlankWarning'),
            primary: 'delete'
        }).then(function () {
            submit(form);
        }).catch(function () {
            // User chose to set a password instead
        });
        return false;
    }

    submit(form);
    return false;
}

function onViewShow() {
    loading.show();
    document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    const page = this;
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getJSON(apiClient.getUrl('Startup/User')).then(function (user) {
        const password = user.Password || '';
        page.querySelector('#txtUsername').value = user.Name || '';
        page.querySelector('#txtManualPassword').value = password;
        // Keep the confirm field in sync so revisiting and pressing Next still works.
        page.querySelector('#txtPasswordConfirm').value = password;
        loading.hide();
    });
}

export default function (view) {
    view.querySelector('.wizardUserForm').addEventListener('submit', onSubmit);
    view.querySelector('.btnWizardPrev').addEventListener('click', function () {
        window.history.back();
    });
    renderWizardProgress(view);
    view.addEventListener('viewshow', onViewShow);
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
