import confirm from 'components/confirm/confirm';
import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { initWizardStep } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep } from 'apps/wizard/controllers/wizardSteps';

import 'styles/dashboard.scss';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

function onUpdateUserComplete(result) {
    console.debug('[Wizard > User] user update complete:', result);
    loading.hide();
    goToNextWizardStep('user');
}

async function onUpdateUserError(form, result) {
    form.querySelector('button[type="submit"]').disabled = false;
    // Authentication can reject with a non-Response error, so guard the body read.
    const message = result && typeof result.text === 'function' ? await result.text() : result;
    console.warn('[Wizard > User] user update failed:', message);
    toast(globalize.translate('ErrorDefault'));
    loading.hide();
}

function submit(form) {
    form.querySelector('button[type="submit"]').disabled = true;
    loading.show();
    const name = form.querySelector('#txtUsername').value.trim();
    const password = form.querySelector('#txtManualPassword').value;
    const apiClient = ServerConnections.currentApiClient();
    apiClient
        .ajax({
            type: 'POST',
            data: JSON.stringify({ Name: name, Password: password }),
            url: apiClient.getUrl('Startup/User'),
            contentType: 'application/json'
        })
        // Authenticate as the new admin so later steps have the rights they need.
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
        .catch(error => onUpdateUserError(form, error));
}

function onSubmit(e) {
    const form = this;
    const password = form.querySelector('#txtManualPassword').value;
    const confirmElem = form.querySelector('#txtPasswordConfirm');

    e.preventDefault();

    confirmElem.setCustomValidity('');

    if (password && password !== confirmElem.value) {
        confirmElem.setCustomValidity(globalize.translate('PasswordMatchError'));
        form.reportValidity();
        return;
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
        return;
    }

    submit(form);
}

function onViewShow() {
    loading.show();
    const page = this;
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getJSON(apiClient.getUrl('Startup/User')).then(function (user) {
        // Don't pull the password back into the DOM; only the username is safe to restore.
        page.querySelector('#txtUsername').value = user.Name || '';
        loading.hide();
    });
}

function onPasswordConfirmInput(e) {
    e.target.setCustomValidity('');
}

export default function (view) {
    view.querySelector('.wizardUserForm').addEventListener('submit', onSubmit);
    view.querySelector('#txtPasswordConfirm').addEventListener('input', onPasswordConfirmInput);
    initWizardStep(view, 'user', { onShow: onViewShow });
}
