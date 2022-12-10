import escapeHtml from 'escape-html';
import 'jquery';
import loading from '../../../components/loading/loading';
import libraryMenu from '../../../scripts/libraryMenu';
import globalize from '../../../scripts/globalize';
import Dashboard from '../../../utils/dashboard';

/* eslint-disable indent */

    function loadPage(page, config, users) {
        page.querySelector('#chkEnablePlayTo').checked = config.EnablePlayTo;
        page.querySelector('#chkEnableDlnaDebugLogging').checked = config.EnableDebugLog;
        $('#txtClientDiscoveryInterval', page).val(config.ClientDiscoveryIntervalSeconds);
        $('#chkEnableServer', page).prop('checked', config.EnableServer);
        $('#chkBlastAliveMessages', page).prop('checked', config.BlastAliveMessages);
        $('#txtBlastInterval', page).val(config.BlastAliveMessageIntervalSeconds);
        const usersHtml = users.map(function (u) {
            return '<option value="' + u.Id + '">' + escapeHtml(u.Name) + '</option>';
        }).join('');
        $('#selectUser', page).html(usersHtml).val(config.DefaultUserId || '');
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        const form = this;
        ApiClient.getNamedConfiguration('dlna').then(function (config) {
            config.EnablePlayTo = form.querySelector('#chkEnablePlayTo').checked;
            config.EnableDebugLog = form.querySelector('#chkEnableDlnaDebugLogging').checked;
            config.ClientDiscoveryIntervalSeconds = $('#txtClientDiscoveryInterval', form).val();
            config.EnableServer = $('#chkEnableServer', form).is(':checked');
            config.BlastAliveMessages = $('#chkBlastAliveMessages', form).is(':checked');
            config.BlastAliveMessageIntervalSeconds = $('#txtBlastInterval', form).val();
            config.DefaultUserId = $('#selectUser', form).val();
            ApiClient.updateNamedConfiguration('dlna', config).then(Dashboard.processServerConfigurationUpdateResult);
        });
        return false;
    }

    function getTabs() {
        return [{
            href: '#/dlnasettings.html',
            name: globalize.translate('Settings')
        }, {
            href: '#/dlnaprofiles.html',
            name: globalize.translate('TabProfiles')
        }];
    }

    $(document).on('pageinit', '#dlnaSettingsPage', function () {
        $('.dlnaSettingsForm').off('submit', onSubmit).on('submit', onSubmit);
    }).on('pageshow', '#dlnaSettingsPage', function () {
        libraryMenu.setTabs('dlna', 0, getTabs);
        loading.show();
        const page = this;
        const promise1 = ApiClient.getNamedConfiguration('dlna');
        const promise2 = ApiClient.getUsers();
        Promise.all([promise1, promise2]).then(function (responses) {
            loadPage(page, responses[0], responses[1]);
        });
    });

/* eslint-enable indent */
