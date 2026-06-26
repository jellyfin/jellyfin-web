import escapeHtml from 'escape-html';

import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';

import 'styles/dashboard.scss';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';
import 'elements/emby-button/paper-icon-button-light';

// The rendered list is the source of truth, so a recreated view starts clean.
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
}

function addUser(form) {
    const page = form.closest('.page');
    const nameElem = form.querySelector('#txtNewUsername');
    const passwordElem = form.querySelector('#txtNewUserPassword');
    const submitButton = form.querySelector('button[type="submit"]');
    const name = nameElem.value.trim();

    // Ignore empty names and guard against a double submit.
    if (!name || submitButton.disabled) {
        return;
    }

    loading.show();
    submitButton.disabled = true;
    const apiClient = ServerConnections.currentApiClient();
    apiClient.createUser({
        Name: name,
        Password: passwordElem.value
    }).then(function (user) {
        appendAddedUser(page, user);
        nameElem.value = '';
        passwordElem.value = '';
    }).catch(function (err) {
        console.error('[Wizard > Users] failed to create user', err);
        toast(globalize.translate('ErrorDefault'));
    }).finally(function () {
        submitButton.disabled = false;
        loading.hide();
    });
}

function removeUser(item) {
    loading.show();
    const apiClient = ServerConnections.currentApiClient();
    apiClient.deleteUser(item.dataset.userId).then(function () {
        item.remove();
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
        removeUser(removeButton.closest('li'));
    }
}

function navigateToNextPage() {
    Dashboard.navigate('wizard/remoteaccess');
}

export default function (view) {
    view.querySelector('.wizardAddUserForm').addEventListener('submit', onAddUserSubmit);
    view.querySelector('.addedUsers').addEventListener('click', onAddedUsersClick);
    view.querySelector('.btnWizardNext').addEventListener('click', navigateToNextPage);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
