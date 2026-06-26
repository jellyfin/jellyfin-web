import escapeHtml from 'escape-html';

import loading from 'components/loading/loading';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Dashboard from 'utils/dashboard';

import 'styles/dashboard.scss';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';

const addedUsers = [];

function renderAddedUsers(page) {
    const container = page.querySelector('.addedUsers');

    if (!addedUsers.length) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '<ul>' + addedUsers.map(function (name) {
        return '<li>' + escapeHtml(name) + '</li>';
    }).join('') + '</ul>';
}

function addUser(form) {
    const page = form.closest('.page');
    const nameElem = form.querySelector('#txtNewUsername');
    const passwordElem = form.querySelector('#txtNewUserPassword');
    const name = nameElem.value.trim();

    if (!name) {
        return;
    }

    loading.show();
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
        addedUsers.push(name);
        renderAddedUsers(page);
        nameElem.value = '';
        passwordElem.value = '';
        loading.hide();
    }).catch(function (err) {
        console.error('[Wizard > Users] failed to create user', err);
        toast(globalize.translate('ErrorDefault'));
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
        renderAddedUsers(this);
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
