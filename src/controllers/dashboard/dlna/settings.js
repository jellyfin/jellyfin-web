define(['jQuery', 'loading', 'libraryMenu', 'globalize'], function ($, loading, libraryMenu, globalize) {
    'use strict';

    function loadPage(page, config, users) {
        page.querySelector('#chkEnablePlayTo').checked = config.EnablePlayTo;
        page.querySelector('#chkEnableDlnaDebugLogging').checked = config.EnableDebugLog;
        page.querySelector('#txtClientDiscoveryInterval').value = config.ClientDiscoveryIntervalSeconds;
        $('#chkEnableServer', page).prop('checked', config.EnableServer);
        $('#chkBlastAliveMessages', page).prop('checked', config.BlastAliveMessages);
        page.querySelector('#txtBlastInterval').value = config.BlastAliveMessageIntervalSeconds;
        var usersHtml = users.map(function (u) {
            return '<option value="' + u.Id + '">' + u.Name + '</option>';
        }).join('');
        const elem = $('#selectUser', page);
        elem.innerHtml = usersHtml;
        elem.val(config.DefaultUserId || '');
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        var form = this;
        ApiClient.getNamedConfiguration('dlna').then(function (config) {
            config.EnablePlayTo = form.querySelector('#chkEnablePlayTo').checked;
            config.EnableDebugLog = form.querySelector('#chkEnableDlnaDebugLogging').checked;
            config.ClientDiscoveryIntervalSeconds = form.querySelector('#txtClientDiscoveryInterval').value;
            config.EnableServer = $('#chkEnableServer', form).matches(':checked');
            config.BlastAliveMessages = $('#chkBlastAliveMessages', form).matches(':checked');
            config.BlastAliveMessageIntervalSeconds = form.querySelector('#txtBlastInterval').value;
            config.DefaultUserId = form.querySelector('#selectUser', form).value;
            ApiClient.updateNamedConfiguration('dlna', config).then(Dashboard.processServerConfigurationUpdateResult);
        });
        return false;
    }

    function getTabs() {
        return [{
            href: 'dlnasettings.html',
            name: globalize.translate('TabSettings')
        }, {
            href: 'dlnaprofiles.html',
            name: globalize.translate('TabProfiles')
        }];
    }

    $(document).on('pageinit', '#dlnaSettingsPage', function () {
        $('.dlnaSettingsForm').off('submit', onSubmit).on('submit', onSubmit);
    }).on('pageshow', '#dlnaSettingsPage', function () {
        libraryMenu.setTabs('dlna', 0, getTabs);
        loading.show();
        var page = this;
        var promise1 = ApiClient.getNamedConfiguration('dlna');
        var promise2 = ApiClient.getUsers();
        Promise.all([promise1, promise2]).then(function (responses) {
            loadPage(page, responses[0], responses[1]);
        });
    });
});
