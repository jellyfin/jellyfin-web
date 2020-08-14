import loading from '../../../components/loading/loading';
import '../../../elements/emby-checkbox/emby-checkbox';
import '../../../elements/emby-button/emby-button';
import '../../../elements/emby-select/emby-select';

function save(page) {
    loading.show();
    const apiClient = ApiClient;
    const config = {};
    config.EnableRemoteAccess = page.querySelector('#chkRemoteAccess').checked;
    config.EnableAutomaticPortMapping = page.querySelector('#chkEnableUpnp').checked;
    apiClient.ajax({
        type: 'POST',
        data: JSON.stringify(config),
        url: apiClient.getUrl('Startup/RemoteAccess')
    }).then(function () {
        loading.hide();
        navigateToNextPage();
    });
}

function navigateToNextPage() {
    Dashboard.navigate('wizardfinish.html');
}

function onSubmit(e) {
    save(this);
    e.preventDefault();
    return false;
}

export default function (view, params) {
    view.querySelector('.wizardSettingsForm').addEventListener('submit', onSubmit);
    view.addEventListener('viewshow', function () {
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    });
    view.addEventListener('viewhide', function () {
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    });
}
