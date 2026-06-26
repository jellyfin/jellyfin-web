import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';

import 'styles/dashboard.scss';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

// The rendered list is the source of truth, so a recreated view starts clean.
function appendAddedUser(page, name) {
    let list = page.querySelector('.addedUsers ul');
    if (!list) {
        list = document.createElement('ul');
        page.querySelector('.addedUsers').appendChild(list);
    }

    const item = document.createElement('li');
    item.textContent = name;
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
    apiClient.ajax({
        type: 'POST',
        data: JSON.stringify({
            Name: name,
            Password: passwordElem.value
        }),
        url: apiClient.getUrl('Users/New'),
        contentType: 'application/json'
    }).then(function () {
        appendAddedUser(page, name);
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

function onAddUserSubmit(e) {
    addUser(this);
    e.preventDefault();
    return false;
}

function navigateToNextPage() {
    Dashboard.navigate('wizard/ffmpeg');
}

export default function (view) {
    view.querySelector('.wizardAddUserForm').addEventListener('submit', onAddUserSubmit);
    view.querySelector('.btnWizardNext').addEventListener('click', navigateToNextPage);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
