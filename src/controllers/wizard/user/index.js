import loading from 'loading';
import globalize from 'globalize';
import 'dashboardcss';
import 'emby-input';
import 'emby-button';

function getApiClient() {
    return ApiClient;
}

function nextWizardPage() {
    Dashboard.navigate('wizardlibrary.html');
}

function onUpdateUserComplete(result) {
    console.debug('user update complete: ' + result);
    loading.hide();
    nextWizardPage();
}

function submit(form) {
    loading.show();
    const apiClient = getApiClient();
    apiClient.ajax({
        type: 'POST',
        data: JSON.stringify({
            Name: form.querySelector('#txtUsername').value,
            Password: form.querySelector('#txtManualPassword').value
        }),
        url: apiClient.getUrl('Startup/User'),
        contentType: 'application/json'
    }).then(onUpdateUserComplete);
}

function onSubmit(e) {
    const form = this;

    if (form.querySelector('#txtManualPassword').value != form.querySelector('#txtPasswordConfirm').value) {
        import('toast').then(({default: toast}) => {
            toast(globalize.translate('PasswordMatchError'));
        });
    } else {
        submit(form);
    }

    e.preventDefault();
    return false;
}

function onViewShow() {
    loading.show();
    const page = this;
    const apiClient = getApiClient();
    apiClient.getJSON(apiClient.getUrl('Startup/User')).then(function (user) {
        page.querySelector('#txtUsername').value = user.Name || '';
        page.querySelector('#txtManualPassword').value = user.Password || '';
        loading.hide();
    });
}

export default function (view, params) {
    view.querySelector('.wizardUserForm').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
    view.addEventListener('viewshow', onViewShow);
}
