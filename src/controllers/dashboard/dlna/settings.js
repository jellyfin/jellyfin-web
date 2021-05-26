import loading from '../../../components/loading/loading';
import libraryMenu from '../../../scripts/libraryMenu';
import globalize from '../../../scripts/globalize';
import Dashboard from '../../../scripts/clientUtils';

function loadPage(page, config, users) {
    page.querySelector('#chkEnablePlayTo').checked = config.EnablePlayTo;
    page.querySelector('#chkEnableDlnaDebugLogging').checked = config.EnableDebugLog;
    page.querySelector('#txtClientDiscoveryInterval').value = config.ClientDiscoveryIntervalSeconds;
    page.querySelector('#chkEnableServer').checked = config.EnableServer;
    page.querySelector('#chkBlastAliveMessages').checked = config.BlastAliveMessages;
    page.querySelector('#txtBlastInterval').value = config.BlastAliveMessageIntervalSeconds;
    const usersHtml = users.map(function (u) {
        return '<option value="' + u.Id + '">' + u.Name + '</option>';
    }).join('');
    const elem = page.querySelector('#selectUser');
    elem.innerHTML = usersHtml;
    elem.value = config.DefaultUserId || '';
    loading.hide();
}

function onSubmit(e) {
    loading.show();
    const form = this;
    ApiClient.getNamedConfiguration('dlna').then(function (config) {
        config.EnablePlayTo = form.querySelector('#chkEnablePlayTo').checked;
        config.EnableDebugLog = form.querySelector('#chkEnableDlnaDebugLogging').checked;
        config.ClientDiscoveryIntervalSeconds = form.querySelector('#txtClientDiscoveryInterval').value;
        config.EnableServer = form.querySelector('#chkEnableServer').matches(':checked');
        config.BlastAliveMessages = form.querySelector('#chkBlastAliveMessages').matches(':checked');
        config.BlastAliveMessageIntervalSeconds = form.querySelector('#txtBlastInterval').value;
        config.DefaultUserId = form.querySelector('#selectUser').value;
        ApiClient.updateNamedConfiguration('dlna', config).then(Dashboard.processServerConfigurationUpdateResult);
    });
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function getTabs() {
    return [{
        href: '#!/dlnasettings.html',
        name: globalize.translate('Settings')
    }, {
        href: '#!/dlnaprofiles.html',
        name: globalize.translate('TabProfiles')
    }];
}
export default function (view) {
    view.querySelector('form').addEventListener('submit', onSubmit);

    view.addEventListener('viewshow', function () {
        libraryMenu.setTabs('dlna', 0, getTabs);
        loading.show();
        const page = this;
        const promise1 = ApiClient.getNamedConfiguration('dlna');
        const promise2 = ApiClient.getUsers();
        Promise.all([promise1, promise2]).then(function (responses) {
            loadPage(page, responses[0], responses[1]);
        });
    });
}
