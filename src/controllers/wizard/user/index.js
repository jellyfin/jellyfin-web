import loading from '../../../components/loading/loading';
import globalize from '../../../scripts/globalize';
import '../../../styles/dashboard.scss';
import '../../../elements/emby-input/emby-input';
import '../../../elements/emby-button/emby-button';
import Dashboard from '../../../utils/dashboard';
import toast from '../../../components/toast/toast';

function getApiClient() {
    return ApiClient;
}

function nextWizardPage() {
    Dashboard.navigate('wizardlibrary.html')
        .catch(err => {
            console.error('[Wizard > User] error navigating to library setup', err);
        });
}

function onUpdateUserComplete(result) {
    console.debug('[Wizard > User] user update complete:', result);
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
    const apiClient = getApiClient();
    apiClient
        .ajax({
            type: 'POST',
            data: JSON.stringify({
                Name: form.querySelector('#txtUsername').value,
                Password: form.querySelector('#txtManualPassword').value
            }),
            url: apiClient.getUrl('Startup/User'),
            contentType: 'application/json'
        })
        .then(onUpdateUserComplete)
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
    const apiClient = getApiClient();
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
