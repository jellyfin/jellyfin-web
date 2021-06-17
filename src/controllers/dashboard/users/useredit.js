import loading from '../../../components/loading/loading';
import libraryMenu from '../../../scripts/libraryMenu';
import globalize from '../../../scripts/globalize';
import Dashboard from '../../../scripts/clientUtils';
import toast from '../../../components/toast/toast';

/* eslint-disable indent */

    function loadDeleteFolders(page, user, mediaFolders) {
        ApiClient.getJSON(ApiClient.getUrl('Channels', {
            SupportsMediaDeletion: true
        })).then(function (channelsResult) {
            let isChecked;
            let checkedAttribute;
            let html = '';

            for (const folder of mediaFolders) {
                isChecked = user.Policy.EnableContentDeletion || user.Policy.EnableContentDeletionFromFolders.indexOf(folder.Id) != -1;
                checkedAttribute = isChecked ? ' checked="checked"' : '';
                html += '<label><input type="checkbox" is="emby-checkbox" class="chkFolder" data-id="' + folder.Id + '" ' + checkedAttribute + '><span>' + folder.Name + '</span></label>';
            }

            for (const folder of channelsResult.Items) {
                isChecked = user.Policy.EnableContentDeletion || user.Policy.EnableContentDeletionFromFolders.indexOf(folder.Id) != -1;
                checkedAttribute = isChecked ? ' checked="checked"' : '';
                html += '<label><input type="checkbox" is="emby-checkbox" class="chkFolder" data-id="' + folder.Id + '" ' + checkedAttribute + '><span>' + folder.Name + '</span></label>';
            }

            const deleteAccess = page.querySelector('.deleteAccess');
            deleteAccess.innerHTML = html;
            deleteAccess.dispatchEvent(new CustomEvent('create'));

            page.querySelector('#chkEnableDeleteAllFolders').checked = user.Policy.EnableContentDeletion;
        });
    }

    function loadAuthProviders(page, user, providers) {
        if (providers.length > 1) {
            page.querySelector('.fldSelectLoginProvider').classList.remove('hide');
        } else {
            page.querySelector('.fldSelectLoginProvider').classList.add('hide');
        }

        const currentProviderId = user.Policy.AuthenticationProviderId;
        page.querySelector('.selectLoginProvider').innerHTML = providers.map(function (provider) {
            const selected = provider.Id === currentProviderId || providers.length < 2 ? ' selected' : '';
            return '<option value="' + provider.Id + '"' + selected + '>' + provider.Name + '</option>';
        });
    }

    function loadPasswordResetProviders(page, user, providers) {
        if (providers.length > 1) {
            page.querySelector('.fldSelectPasswordResetProvider').classList.remove('hide');
        } else {
            page.querySelector('.fldSelectPasswordResetProvider').classList.add('hide');
        }

        const currentProviderId = user.Policy.PasswordResetProviderId;
        page.querySelector('.selectPasswordResetProvider').innerHTML = providers.map(function (provider) {
            const selected = provider.Id === currentProviderId || providers.length < 2 ? ' selected' : '';
            return '<option value="' + provider.Id + '"' + selected + '>' + provider.Name + '</option>';
        });
    }

    function loadUser(page, user) {
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
        const txtUserName = page.querySelector('#txtUserName');
        txtUserName.disabled = '';
        txtUserName.removeAttribute('disabled');

        const lnkEditUserPreferences = page.querySelector('.lnkEditUserPreferences');
        lnkEditUserPreferences.setAttribute('href', 'mypreferencesmenu.html?userId=' + user.Id);
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
        page.querySelector('#chkRemoteAccess').checked = user.Policy.EnableRemoteAccess == null || user.Policy.EnableRemoteAccess;
        page.querySelector('#txtRemoteClientBitrateLimit').value = user.Policy.RemoteClientBitrateLimit / 1e6 || '';
        page.querySelector('#txtLoginAttemptsBeforeLockout').value = user.Policy.LoginAttemptsBeforeLockout || '0';
        page.querySelector('#txtMaxActiveSessions').value = user.Policy.MaxActiveSessions || '0';
        if (ApiClient.isMinServerVersion('10.6.0')) {
            page.querySelector('#selectSyncPlayAccess').value = user.Policy.SyncPlayAccess;
        }
        loading.hide();
    }

    function onSaveComplete() {
        Dashboard.navigate('userprofiles.html');
        loading.hide();
        toast(globalize.translate('SettingsSaved'));
    }

    function saveUser(user, page) {
        user.Name = page.querySelector('#txtUserName').value;
        user.Policy.IsAdministrator = page.querySelector('#chkIsAdmin').checked;
        user.Policy.IsHidden = page.querySelector('#chkIsHidden').checked;
        user.Policy.IsDisabled = page.querySelector('#chkDisabled').checked;
        user.Policy.EnableRemoteControlOfOtherUsers = page.querySelector('#chkEnableRemoteControlOtherUsers').checked;
        user.Policy.EnableLiveTvManagement = page.querySelector('#chkManageLiveTv').checked;
        user.Policy.EnableLiveTvAccess = page.querySelector('#chkEnableLiveTvAccess').checked;
        user.Policy.EnableSharedDeviceControl = page.querySelector('#chkRemoteControlSharedDevices').checked;
        user.Policy.EnableMediaPlayback = page.querySelector('#chkEnableMediaPlayback').checked;
        user.Policy.EnableAudioPlaybackTranscoding = page.querySelector('#chkEnableAudioPlaybackTranscoding').checked;
        user.Policy.EnableVideoPlaybackTranscoding = page.querySelector('#chkEnableVideoPlaybackTranscoding').checked;
        user.Policy.EnablePlaybackRemuxing = page.querySelector('#chkEnableVideoPlaybackRemuxing').checked;
        user.Policy.ForceRemoteSourceTranscoding = page.querySelector('#chkForceRemoteSourceTranscoding').checked;
        user.Policy.EnableContentDownloading = page.querySelector('#chkEnableDownloading').checked;
        user.Policy.EnableRemoteAccess = page.querySelector('#chkRemoteAccess').checked;
        user.Policy.RemoteClientBitrateLimit = parseInt(1e6 * parseFloat(page.querySelector('#txtRemoteClientBitrateLimit').value || '0'));
        user.Policy.LoginAttemptsBeforeLockout = parseInt(page.querySelector('#txtLoginAttemptsBeforeLockout').value || '0');
        user.Policy.MaxActiveSessions = parseInt(page.querySelector('#txtMaxActiveSessions').value || '0');
        user.Policy.AuthenticationProviderId = page.querySelector('.selectLoginProvider').value;
        user.Policy.PasswordResetProviderId = page.querySelector('.selectPasswordResetProvider').value;
        user.Policy.EnableContentDeletion = page.querySelector('#chkEnableDeleteAllFolders').checked;
        user.Policy.EnableContentDeletionFromFolders = user.Policy.EnableContentDeletion ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkFolder'), function (c) {
            return c.checked;
        }).map(function (c) {
            return c.getAttribute('data-id');
        });
        if (ApiClient.isMinServerVersion('10.6.0')) {
            user.Policy.SyncPlayAccess = page.querySelector('#selectSyncPlayAccess').value;
        }
        ApiClient.updateUser(user).then(function () {
            ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                onSaveComplete();
            });
        });
    }

    function onSubmit(e) {
        const page = this.closest('#editUserPage');
        loading.show();
        getUser().then(function (result) {
            saveUser(result, page);
        });
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function getUser() {
        const userId = getParameterByName('userId');
        return ApiClient.getUser(userId);
    }

    function loadData(page) {
        loading.show();
        getUser().then(function (user) {
            loadUser(page, user);
        });
    }

    export default function (view) {
        const chkEnableDeleteAllFolders = view.querySelector('#chkEnableDeleteAllFolders');
        chkEnableDeleteAllFolders.addEventListener('change', () => {
            if (this.checked) {
                view.querySelector('.deleteAccess').classList.add('hide');
            } else {
                view.querySelector('.deleteAccess').classList.remove('hide');
            }
        });
        ApiClient.getServerConfiguration().then(function (config) {
            if (config.EnableRemoteAccess) {
                view.querySelector('.fldRemoteAccess').classList.remove('hide');
            } else {
                view.querySelector('.fldRemoteAccess').classList.add('hide');
            }
        });

        view.querySelector('.editUserProfileForm').addEventListener('submit', onSubmit);

        view.addEventListener('viewbeforeshow', function () {
            loadData(this);
        });
    }

/* eslint-enable indent */
