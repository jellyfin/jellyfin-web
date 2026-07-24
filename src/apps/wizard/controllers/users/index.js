import escapeHtml from 'escape-html';

import confirm from 'components/confirm/confirm';
import toast from 'components/toast/toast';
import globalize from 'lib/globalize';
import { initWizardStep, updateNextButtonLabel } from 'apps/wizard/controllers/wizardProgress';
import { goToNextWizardStep } from 'apps/wizard/controllers/wizardSteps';
import { getWizardDraft } from 'apps/wizard/controllers/wizardDraft';

import 'styles/dashboard.scss';
import 'elements/emby-input/emby-input';
import 'elements/emby-button/emby-button';
import 'elements/emby-button/paper-icon-button-light';

function renderAddedUsers(page) {
    const draft = getWizardDraft();
    let list = page.querySelector('.addedUsers ul');
    if (!list) {
        list = document.createElement('ul');
        page.querySelector('.addedUsers').appendChild(list);
    }

    list.innerHTML = draft.users.map(function (user, index) {
        return '<li data-index="' + index + '">'
            + '<span class="addedUserName"></span>'
            + '<button type="button" is="paper-icon-button-light" class="btnRemoveUser" title="' + escapeHtml(globalize.translate('Delete')) + '">'
            + '<span class="material-icons delete" aria-hidden="true"></span>'
            + '</button>'
            + '</li>';
    }).join('');

    // Set the user-supplied name via textContent to avoid HTML injection.
    list.querySelectorAll('li').forEach(function (item, index) {
        item.querySelector('.addedUserName').textContent = draft.users[index].Name;
    });

    updateNextButtonLabel(page, draft.users.length > 0);
}

function addUser(form) {
    const draft = getWizardDraft();
    const page = form.closest('.page');
    const nameElem = form.querySelector('#txtNewUsername');
    const passwordElem = form.querySelector('#txtNewUserPassword');
    const passwordConfirmElem = form.querySelector('#txtNewUserPasswordConfirm');
    const name = nameElem.value.trim();

    if (!name) return;

    passwordConfirmElem.setCustomValidity('');

    if (passwordElem.value !== passwordConfirmElem.value) {
        passwordConfirmElem.setCustomValidity(globalize.translate('PasswordMatchError'));
        form.reportValidity();
        return;
    }

    const addNow = function () {
        if (draft.users.some(u => u.Name.toLowerCase() === name.toLowerCase())) {
            toast(globalize.translate('ErrorDefault'));
            return;
        }

        draft.users.push({ Name: name, Password: passwordElem.value });
        renderAddedUsers(page);
        nameElem.value = '';
        passwordElem.value = '';
        passwordConfirmElem.value = '';
    };

    if (!passwordElem.value) {
        confirm({
            title: globalize.translate('HeaderUserPasswordWarning'),
            text: globalize.translate('MessageUserPasswordBlankWarning'),
            primary: 'delete'
        }).then(addNow).catch(function () {
            // User chose to set a password instead
        });
        return;
    }

    addNow();
}

function removeUser(page, item) {
    const draft = getWizardDraft();
    const index = Number.parseInt(item.dataset.index, 10);
    draft.users.splice(index, 1);
    renderAddedUsers(page);
}

function onAddUserSubmit(e) {
    e.preventDefault();
    addUser(this);
}

function onPasswordConfirmInput(e) {
    e.target.setCustomValidity('');
}

function onAddedUsersClick(e) {
    const removeButton = e.target.closest('.btnRemoveUser');
    if (removeButton) {
        removeUser(removeButton.closest('.page'), removeButton.closest('li'));
    }
}

function onShow() {
    renderAddedUsers(this);
}

export default function initUsersView(view) {
    view.querySelector('.wizardAddUserForm').addEventListener('submit', onAddUserSubmit);
    view.querySelector('#txtNewUserPasswordConfirm').addEventListener('input', onPasswordConfirmInput);
    view.querySelector('.addedUsers').addEventListener('click', onAddedUsersClick);
    view.querySelector('.btnWizardNext').addEventListener('click', function () {
        goToNextWizardStep('users');
    });
    initWizardStep(view, 'users', { onShow });
}
