define(['jQuery', 'loading', 'libraryMenu', 'globalize'], function ($, loading, libraryMenu, globalize) {
    'use strict';

    function loadDeleteFolders(page, user, mediaFolders) {
        ApiClient.getJSON(ApiClient.getUrl('Channels', {
            SupportsMediaDeletion: true
        })).then(function (channelsResult) {
            var i;
            var length;
            var folder;
            var isChecked;
            var checkedAttribute;
            var html = '';

            for (i = 0, length = mediaFolders.length; i < length; i++) {
                folder = mediaFolders[i];
                isChecked = user.Policy.EnableContentDeletion || -1 != user.Policy.EnableContentDeletionFromFolders.indexOf(folder.Id);
                checkedAttribute = isChecked ? ' checked="checked"' : '';
                html += '<label><input type="checkbox" is="emby-checkbox" class="chkFolder" data-id="' + folder.Id + '" ' + checkedAttribute + '><span>' + folder.Name + '</span></label>';
            }

            for (i = 0, length = channelsResult.Items.length; i < length; i++) {
                folder = channelsResult.Items[i];
                isChecked = user.Policy.EnableContentDeletion || -1 != user.Policy.EnableContentDeletionFromFolders.indexOf(folder.Id);
                checkedAttribute = isChecked ? ' checked="checked"' : '';
                html += '<label><input type="checkbox" is="emby-checkbox" class="chkFolder" data-id="' + folder.Id + '" ' + checkedAttribute + '><span>' + folder.Name + '</span></label>';
            }

            const deleteAccess = page.querySelector('.deleteAccess');
            deleteAccess.innerHtml = html;
            deleteAccess.trigger('create');
            page.querySelector('#chkEnableDeleteAllFolders').checked = user.Policy.EnableContentDeletion;
        });
    }

    function loadAuthProviders(page, user, providers) {
        if (providers.length > 1) {
            page.querySelector('.fldSelectLoginProvider').classList.remove('hide');
        } else {
            page.querySelector('.fldSelectLoginProvider').classList.add('hide');
        }

        var currentProviderId = user.Policy.AuthenticationProviderId;
        page.querySelector('.selectLoginProvider').innerHTML = providers.map(function (provider) {
            var selected = provider.Id === currentProviderId || providers.length < 2 ? ' selected' : '';
            return '<option value="' + provider.Id + '"' + selected + '>' + provider.Name + '</option>';
        });
    }

    function loadPasswordResetProviders(page, user, providers) {
        if (providers.length > 1) {
            page.querySelector('.fldSelectPasswordResetProvider').classList.remove('hide');
        } else {
            page.querySelector('.fldSelectPasswordResetProvider').classList.add('hide');
        }

        var currentProviderId = user.Policy.PasswordResetProviderId;
        page.querySelector('.selectPasswordResetProvider').innerHTML = providers.map(function (provider) {
            var selected = provider.Id === currentProviderId || providers.length < 2 ? ' selected' : '';
            return '<option value="' + provider.Id + '"' + selected + '>' + provider.Name + '</option>';
        });
    }

    function loadUser(page, user) {
        currentUser = user;
        ApiClient.getJSON(ApiClient.getUrl('Auth/Providers')).then(function (providers) {
            loadAuthProviders(page, user, providers);
        });
        ApiClient.getJSON(ApiClient.getUrl('Auth/PasswordResetProviders')).then(function (providers) {
            loadPasswordResetProviders(page, user, providers);
        });
        ApiClient.getJSON(ApiClient.getUrl('Library/MediaFolders', {
            IsHidden: false
        })).then(function (folders) {
            loadDeleteFolders(page, user, folders.Items);
        });

        if (user.Policy.IsDisabled) {
            page.querySelector('.disabledUserBanner').classList.remove('hide');
        } else {
            page.querySelector('.disabledUserBanner').classList.add('hide');
        }

        page.querySelector('#txtUserName').removeAttribute('disabled');
        page.querySelector('#fldConnectInfo').classList.remove('hide');
        page.querySelector('.lnkEditUserPreferences').setAttribute('href', `mypreferencesmenu.html?userId=${user.Id}`);
        libraryMenu.setTitle(user.Name);
        page.querySelector('.username').innerHTML = user.Name;
        page.querySelector('#txtUserName').value = user.Name;
        page.querySelector('#chkIsAdmin').checked = user.Policy.IsAdministrator;
        page.querySelector('#chkDisabled').checked = user.Policy.IsDisabled;
        page.querySelector('#chkIsHidden').checked = user.Policy.IsHidden;
        page.querySelector('#chkRemoteControlSharedDevices').checked = user.Policy.EnableSharedDeviceControl;
        page.querySelector('#chkEnableRemoteControlOtherUsers').checked = user.Policy.EnableRemoteControlOfOtherUsers;
        page.querySelector('#chkEnableDownloading').checked = user.Policy.EnableContentDownloading;
        page.querySelector('#chkManageLiveTv').checked = user.Policy.EnableLiveTvManagement;
        page.querySelector('#chkEnableLiveTvAccess').checked = user.Policy.EnableLiveTvAccess;
        page.querySelector('#chkEnableMediaPlayback').checked = user.Policy.EnableMediaPlayback;
        page.querySelector('#chkEnableAudioPlaybackTranscoding').checked = user.Policy.EnableAudioPlaybackTranscoding;
        page.querySelector('#chkEnableVideoPlaybackTranscoding').checked = user.Policy.EnableVideoPlaybackTranscoding;
        page.querySelector('#chkEnableVideoPlaybackRemuxing').checked = user.Policy.EnablePlaybackRemuxing;
        page.querySelector('#chkForceRemoteSourceTranscoding').checked = user.Policy.ForceRemoteSourceTranscoding;
        page.querySelector('#chkRemoteAccess').checked = null == user.Policy.EnableRemoteAccess || user.Policy.EnableRemoteAccess;
        page.querySelector('#chkEnableSyncTranscoding').checked = user.Policy.EnableSyncTranscoding;
        page.querySelector('#chkEnableConversion').checked = user.Policy.EnableMediaConversion || false;
        page.querySelector('#chkEnableSharing').checked = user.Policy.EnablePublicSharing;
        page.querySelector('#txtRemoteClientBitrateLimit').value = user.Policy.RemoteClientBitrateLimit / 1e6 || '';
        page.querySelector('#txtLoginAttemptsBeforeLockout').value = user.Policy.LoginAttemptsBeforeLockout || '0';
        page.querySelector('#selectSyncPlayAccess').value = user.Policy.SyncPlayAccess;
        loading.hide();
    }

    function onSaveComplete(page, user) {
        Dashboard.navigate('userprofiles.html');
        loading.hide();

        require(['toast'], function (toast) {
            toast(globalize.translate('SettingsSaved'));
        });
    }

    function saveUser(user, page) {
        user.Name = page.querySelector('#txtUserName').value;
        user.Policy.IsAdministrator = page.querySelector('#chkIsAdmin').matches(':checked');
        user.Policy.IsHidden = page.querySelector('#chkIsHidden').matches(':checked');
        user.Policy.IsDisabled = page.querySelector('#chkDisabled').matches(':checked');
        user.Policy.EnableRemoteControlOfOtherUsers = page.querySelector('#chkEnableRemoteControlOtherUsers').matches(':checked');
        user.Policy.EnableLiveTvManagement = page.querySelector('#chkManageLiveTv').matches(':checked');
        user.Policy.EnableLiveTvAccess = page.querySelector('#chkEnableLiveTvAccess').matches(':checked');
        user.Policy.EnableSharedDeviceControl = page.querySelector('#chkRemoteControlSharedDevices').matches(':checked');
        user.Policy.EnableMediaPlayback = page.querySelector('#chkEnableMediaPlayback').matches(':checked');
        user.Policy.EnableAudioPlaybackTranscoding = page.querySelector('#chkEnableAudioPlaybackTranscoding').matches(':checked');
        user.Policy.EnableVideoPlaybackTranscoding = page.querySelector('#chkEnableVideoPlaybackTranscoding').matches(':checked');
        user.Policy.EnablePlaybackRemuxing = page.querySelector('#chkEnableVideoPlaybackRemuxing').matches(':checked');
        user.Policy.ForceRemoteSourceTranscoding = page.querySelector('#chkForceRemoteSourceTranscoding').matches(':checked');
        user.Policy.EnableContentDownloading = page.querySelectorpage.querySelector('#chkEnableDownloading').matches(':checked');
        user.Policy.EnableSyncTranscoding = page.querySelector('#chkEnableSyncTranscoding').matches(':checked');
        user.Policy.EnableMediaConversion = page.querySelector('#chkEnableConversion').matches(':checked');
        user.Policy.EnablePublicSharing = page.querySelector('#chkEnableSharing').matches(':checked');
        user.Policy.EnableRemoteAccess = page.querySelector('#chkRemoteAccess').matches(':checked');
        user.Policy.RemoteClientBitrateLimit = parseInt(1e6 * parseFloat(page.querySelector('#txtRemoteClientBitrateLimit').value || '0'));
        user.Policy.LoginAttemptsBeforeLockout = parseInt(page.querySelector('#txtLoginAttemptsBeforeLockout').value || '0');
        user.Policy.AuthenticationProviderId = page.querySelector('.selectLoginProvider').value;
        user.Policy.PasswordResetProviderId = page.querySelector('.selectPasswordResetProvider').value;
        user.Policy.EnableContentDeletion = page.querySelector('#chkEnableDeleteAllFolders').matches(':checked');
        user.Policy.EnableContentDeletionFromFolders = user.Policy.EnableContentDeletion ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkFolder'), function (c) {
            return c.checked;
        }).map(function (c) {
            return c.getAttribute('data-id');
        });
        user.Policy.SyncPlayAccess = page.querySelector('#selectSyncPlayAccess').value;
        ApiClient.updateUser(user).then(function () {
            ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                onSaveComplete(page, user);
            });
        });
    }

    function onSubmit() {
        var page = this.closest('.page')[0];
        loading.show();
        getUser().then(function (result) {
            saveUser(result, page);
        });
        return false;
    }

    function getUser() {
        var userId = getParameterByName('userId');
        return ApiClient.getUser(userId);
    }

    function loadData(page) {
        loading.show();
        getUser().then(function (user) {
            loadUser(page, user);
        });
    }

    var currentUser;
    $(document).on('pageinit', '#editUserPage', function () {
        $('.editUserProfileForm').off('submit', onSubmit).on('submit', onSubmit);
        this.querySelector('.sharingHelp').innerHTML = globalize.translate('OptionAllowLinkSharingHelp', 30);
        var page = this;
        $('#chkEnableDeleteAllFolders', this).on('change', function () {
            if (this.checked) {
                page.querySelector('.deleteAccess').classList.add('hide');
            } else {
                page.querySelector('.deleteAccess').classList.remove('hide');
            }
        });
        ApiClient.getServerConfiguration().then(function (config) {
            if (config.EnableRemoteAccess) {
                page.querySelector('.fldRemoteAccess').classList.remove('hide');
            } else {
                page.querySelector('.fldRemoteAccess').classList.add('hide');
            }
        });
    }).on('pagebeforeshow', '#editUserPage', function () {
        loadData(this);
    });
});
