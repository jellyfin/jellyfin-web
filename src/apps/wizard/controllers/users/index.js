import escapeHtml from 'escape-html';

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
import 'elements/emby-button/paper-icon-button-light';

// Adding users is optional, so the forward button reads "Skip" until at least one exists.
function updateNextLabel(page) {
    const nextLabel = page.querySelector('.btnNextLabel');
    const hasUsers = !!page.querySelector('.addedUsers li');
    nextLabel.textContent = globalize.translate(hasUsers ? 'Next' : 'Skip');
}

function appendAddedUser(page, user) {
    let list = page.querySelector('.addedUsers ul');
    if (!list) {
        list = document.createElement('ul');
        page.querySelector('.addedUsers').appendChild(list);
    }

    const item = document.createElement('li');
    item.dataset.userId = user.Id;
    item.innerHTML = '<span class="addedUserName"></span>'
        + '<button type="button" is="paper-icon-button-light" class="btnRemoveUser" title="' + escapeHtml(globalize.translate('Delete')) + '">'
        + '<span class="material-icons delete" aria-hidden="true"></span>'
        + '</button>';
    // Set the user-supplied name via textContent to avoid HTML injection.
    item.querySelector('.addedUserName').textContent = user.Name;
    list.appendChild(item);
    updateNextLabel(page);
}

// The server may explain why creation failed (e.g. a duplicate name); surface that text.
async function getErrorMessage(err) {
    if (err && typeof err.text === 'function') {
        const text = await err.text().catch(() => '');
        if (text) return text;
    }
    return globalize.translate('ErrorDefault');
}

function createUser(form) {
    const page = form.closest('.page');
    const nameElem = form.querySelector('#txtNewUsername');
    const passwordElem = form.querySelector('#txtNewUserPassword');
    const passwordConfirmElem = form.querySelector('#txtNewUserPasswordConfirm');
    const submitButton = form.querySelector('button[type="submit"]');

    loading.show();
    submitButton.disabled = true;
    const apiClient = ServerConnections.currentApiClient();
    apiClient.createUser({
        Name: nameElem.value.trim(),
        Password: passwordElem.value
    }).then(function (user) {
        appendAddedUser(page, user);
        nameElem.value = '';
        passwordElem.value = '';
        passwordConfirmElem.value = '';
    }).catch(async function (err) {
        console.error('[Wizard > Users] failed to create user', err);
        toast(await getErrorMessage(err));
    }).finally(function () {
        submitButton.disabled = false;
        loading.hide();
    });
}

function addUser(form) {
    const passwordElem = form.querySelector('#txtNewUserPassword');
    const passwordConfirmElem = form.querySelector('#txtNewUserPasswordConfirm');
    const submitButton = form.querySelector('button[type="submit"]');
    const name = form.querySelector('#txtNewUsername').value.trim();

    // Ignore empty names and guard against a double submit.
    if (!name || submitButton.disabled) return;

    if (passwordElem.value !== passwordConfirmElem.value) {
        toast(globalize.translate('PasswordMatchError'));
        return;
    }

    if (!passwordElem.value) {
        confirm({
            title: globalize.translate('HeaderUserPasswordWarning'),
            text: globalize.translate('MessageUserPasswordBlankWarning'),
            primary: 'delete'
        }).then(function () {
            createUser(form);
        }).catch(function () {
            // User chose to set a password instead
        });
        return;
    }

    createUser(form);
}

function removeUser(page, item) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.deleteUser(item.dataset.userId).then(function () {
        item.remove();
        updateNextLabel(page);
    }).catch(function (err) {
        console.error('[Wizard > Users] failed to remove user', err);
        toast(globalize.translate('ErrorDefault'));
    }).finally(function () {
        loading.hide();
    });
}

function onAddUserSubmit(e) {
    addUser(this);
    e.preventDefault();
    return false;
}

function onAddedUsersClick(e) {
    const removeButton = e.target.closest('.btnRemoveUser');
    if (removeButton) {
        removeUser(removeButton.closest('.page'), removeButton.closest('li'));
    }
}

function onShow() {
    const page = this;
    // Clear any stale list so we always reflect current server state on revisit.
    const existingList = page.querySelector('.addedUsers ul');
    if (existingList) existingList.remove();
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.getJSON(apiClient.getUrl('Users')).then(function (users) {
        users.filter(u => !u.Policy.IsAdministrator).forEach(u => {
            appendAddedUser(page, u);
        });
        updateNextLabel(page);
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Users] failed to load existing users', err);
        updateNextLabel(page);
        loading.hide();
    });
}

export default function (view) {
    view.querySelector('.wizardAddUserForm').addEventListener('submit', onAddUserSubmit);
    view.querySelector('.addedUsers').addEventListener('click', onAddedUsersClick);
    view.querySelector('.btnWizardNext').addEventListener('click', function () {
        goToNextWizardStep('users');
    });
    initWizardStep(view, 'users', { onShow });
}
