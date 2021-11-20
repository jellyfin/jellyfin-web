import React, { FunctionComponent, useCallback, useEffect, useState, useRef } from 'react';
import Dashboard from '../../scripts/clientUtils';
import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import { appRouter } from '../appRouter';
import ButtonElement from '../dashboard/users/ButtonElement';
import CheckBoxElement from '../dashboard/users/CheckBoxElement';
import CheckBoxListItem from '../dashboard/users/CheckBoxListItem';
import InputElement from '../dashboard/users/InputElement';
import LinkEditUserPreferences from '../dashboard/users/LinkEditUserPreferences';
import SectionTitleLinkElement from '../dashboard/users/SectionTitleLinkElement';
import SelectElement from '../dashboard/users/SelectElement';
import SelectSyncPlayAccessElement from '../dashboard/users/SelectSyncPlayAccessElement';
import TabLinkElement from '../dashboard/users/TabLinkElement';
import loading from '../loading/loading';
import toast from '../toast/toast';

type ItemsArr = {
    Name?: string;
    Id?: string;
    checkedAttribute: string
}

const UserEditPage: FunctionComponent = () => {
    const [ userName, setUserName ] = useState('');
    const [ deleteFoldersAccess, setDeleteFoldersAccess ] = useState([]);
    const [ authProviders, setAuthProviders ] = useState([]);
    const [ passwordResetProviders, setPasswordResetProviders ] = useState([]);

    const [ authenticationProviderId, setAuthenticationProviderId ] = useState('');
    const [ passwordResetProviderId, setPasswordResetProviderId ] = useState('');

    const element = useRef(null);

    const triggerChange = (select) => {
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        select.dispatchEvent(evt);
    };

    const getUser = () => {
        const userId = appRouter.param('userId');
        return window.ApiClient.getUser(userId);
    };

    const loadAuthProviders = useCallback((user, providers) => {
        const fldSelectLoginProvider = element?.current?.querySelector('.fldSelectLoginProvider');
        providers.length > 1 ? fldSelectLoginProvider.classList.remove('hide') : fldSelectLoginProvider.classList.add('hide');

        setAuthProviders(providers);

        const currentProviderId = user.Policy.AuthenticationProviderId;
        setAuthenticationProviderId(currentProviderId);
    }, []);

    const loadPasswordResetProviders = useCallback((user, providers) => {
        const fldSelectPasswordResetProvider = element?.current?.querySelector('.fldSelectPasswordResetProvider');
        providers.length > 1 ? fldSelectPasswordResetProvider.classList.remove('hide') : fldSelectPasswordResetProvider.classList.add('hide');

        setPasswordResetProviders(providers);

        const currentProviderId = user.Policy.PasswordResetProviderId;
        setPasswordResetProviderId(currentProviderId);
    }, []);

    const loadDeleteFolders = useCallback((user, mediaFolders) => {
        window.ApiClient.getJSON(window.ApiClient.getUrl('Channels', {
            SupportsMediaDeletion: true
        })).then(function (channelsResult) {
            let isChecked;
            let checkedAttribute;
            const itemsArr: ItemsArr[] = [];

            for (const folder of mediaFolders) {
                isChecked = user.Policy.EnableContentDeletion || user.Policy.EnableContentDeletionFromFolders.indexOf(folder.Id) != -1;
                checkedAttribute = isChecked ? ' checked="checked"' : '';
                itemsArr.push({
                    Id: folder.Id,
                    Name: folder.Name,
                    checkedAttribute: checkedAttribute
                });
            }

            for (const folder of channelsResult.Items) {
                isChecked = user.Policy.EnableContentDeletion || user.Policy.EnableContentDeletionFromFolders.indexOf(folder.Id) != -1;
                checkedAttribute = isChecked ? ' checked="checked"' : '';
                itemsArr.push({
                    Id: folder.Id,
                    Name: folder.Name,
                    checkedAttribute: checkedAttribute
                });
            }

            setDeleteFoldersAccess(itemsArr);

            const chkEnableDeleteAllFolders = element.current.querySelector('.chkEnableDeleteAllFolders');
            chkEnableDeleteAllFolders.checked = user.Policy.EnableContentDeletion;
            triggerChange(chkEnableDeleteAllFolders);
        });
    }, []);

    const loadUser = useCallback((user) => {
        window.ApiClient.getJSON(window.ApiClient.getUrl('Auth/Providers')).then(function (providers) {
            loadAuthProviders(user, providers);
        });
        window.ApiClient.getJSON(window.ApiClient.getUrl('Auth/PasswordResetProviders')).then(function (providers) {
            loadPasswordResetProviders(user, providers);
        });
        window.ApiClient.getJSON(window.ApiClient.getUrl('Library/MediaFolders', {
            IsHidden: false
        })).then(function (folders) {
            loadDeleteFolders(user, folders.Items);
        });

        const disabledUserBanner = element?.current?.querySelector('.disabledUserBanner');
        user.Policy.IsDisabled ? disabledUserBanner.classList.remove('hide') : disabledUserBanner.classList.add('hide');

        const txtUserName = element?.current?.querySelector('#txtUserName');
        txtUserName.disabled = '';
        txtUserName.removeAttribute('disabled');

        const lnkEditUserPreferences = element?.current?.querySelector('.lnkEditUserPreferences');
        lnkEditUserPreferences.setAttribute('href', 'mypreferencesmenu.html?userId=' + user.Id);
        LibraryMenu.setTitle(user.Name);
        setUserName(user.Name);
        element.current.querySelector('#txtUserName').value = user.Name;
        element.current.querySelector('.chkIsAdmin').checked = user.Policy.IsAdministrator;
        element.current.querySelector('.chkDisabled').checked = user.Policy.IsDisabled;
        element.current.querySelector('.chkIsHidden').checked = user.Policy.IsHidden;
        element.current.querySelector('.chkRemoteControlSharedDevices').checked = user.Policy.EnableSharedDeviceControl;
        element.current.querySelector('.chkEnableRemoteControlOtherUsers').checked = user.Policy.EnableRemoteControlOfOtherUsers;
        element.current.querySelector('.chkEnableDownloading').checked = user.Policy.EnableContentDownloading;
        element.current.querySelector('.chkManageLiveTv').checked = user.Policy.EnableLiveTvManagement;
        element.current.querySelector('.chkEnableLiveTvAccess').checked = user.Policy.EnableLiveTvAccess;
        element.current.querySelector('.chkEnableMediaPlayback').checked = user.Policy.EnableMediaPlayback;
        element.current.querySelector('.chkEnableAudioPlaybackTranscoding').checked = user.Policy.EnableAudioPlaybackTranscoding;
        element.current.querySelector('.chkEnableVideoPlaybackTranscoding').checked = user.Policy.EnableVideoPlaybackTranscoding;
        element.current.querySelector('.chkEnableVideoPlaybackRemuxing').checked = user.Policy.EnablePlaybackRemuxing;
        element.current.querySelector('.chkForceRemoteSourceTranscoding').checked = user.Policy.ForceRemoteSourceTranscoding;
        element.current.querySelector('.chkRemoteAccess').checked = user.Policy.EnableRemoteAccess == null || user.Policy.EnableRemoteAccess;
        element.current.querySelector('#txtRemoteClientBitrateLimit').value = user.Policy.RemoteClientBitrateLimit / 1e6 || '';
        element.current.querySelector('#txtLoginAttemptsBeforeLockout').value = user.Policy.LoginAttemptsBeforeLockout || '0';
        element.current.querySelector('#txtMaxActiveSessions').value = user.Policy.MaxActiveSessions || '0';
        if (window.ApiClient.isMinServerVersion('10.6.0')) {
            element.current.querySelector('#selectSyncPlayAccess').value = user.Policy.SyncPlayAccess;
        }
        loading.hide();
    }, [loadAuthProviders, loadPasswordResetProviders, loadDeleteFolders ]);

    const loadData = useCallback(() => {
        loading.show();
        getUser().then(function (user) {
            loadUser(user);
        });
    }, [loadUser]);

    useEffect(() => {
        loadData();

        function onSaveComplete() {
            Dashboard.navigate('userprofiles.html');
            loading.hide();
            toast(globalize.translate('SettingsSaved'));
        }

        const saveUser = (user) => {
            user.Name = element?.current?.querySelector('#txtUserName').value;
            user.Policy.IsAdministrator = element?.current?.querySelector('.chkIsAdmin').checked;
            user.Policy.IsHidden = element?.current?.querySelector('.chkIsHidden').checked;
            user.Policy.IsDisabled = element?.current?.querySelector('.chkDisabled').checked;
            user.Policy.EnableRemoteControlOfOtherUsers = element?.current?.querySelector('.chkEnableRemoteControlOtherUsers').checked;
            user.Policy.EnableLiveTvManagement = element?.current?.querySelector('.chkManageLiveTv').checked;
            user.Policy.EnableLiveTvAccess = element?.current?.querySelector('.chkEnableLiveTvAccess').checked;
            user.Policy.EnableSharedDeviceControl = element?.current?.querySelector('.chkRemoteControlSharedDevices').checked;
            user.Policy.EnableMediaPlayback = element?.current?.querySelector('.chkEnableMediaPlayback').checked;
            user.Policy.EnableAudioPlaybackTranscoding = element?.current?.querySelector('.chkEnableAudioPlaybackTranscoding').checked;
            user.Policy.EnableVideoPlaybackTranscoding = element?.current?.querySelector('.chkEnableVideoPlaybackTranscoding').checked;
            user.Policy.EnablePlaybackRemuxing = element?.current?.querySelector('.chkEnableVideoPlaybackRemuxing').checked;
            user.Policy.ForceRemoteSourceTranscoding = element?.current?.querySelector('.chkForceRemoteSourceTranscoding').checked;
            user.Policy.EnableContentDownloading = element?.current?.querySelector('.chkEnableDownloading').checked;
            user.Policy.EnableRemoteAccess = element?.current?.querySelector('.chkRemoteAccess').checked;
            user.Policy.RemoteClientBitrateLimit = Math.floor(1e6 * parseFloat(element?.current?.querySelector('#txtRemoteClientBitrateLimit').value || '0'));
            user.Policy.LoginAttemptsBeforeLockout = parseInt(element?.current?.querySelector('#txtLoginAttemptsBeforeLockout').value || '0');
            user.Policy.MaxActiveSessions = parseInt(element?.current?.querySelector('#txtMaxActiveSessions').value || '0');
            user.Policy.AuthenticationProviderId = element?.current?.querySelector('.selectLoginProvider').value;
            user.Policy.PasswordResetProviderId = element?.current?.querySelector('.selectPasswordResetProvider').value;
            user.Policy.EnableContentDeletion = element?.current?.querySelector('.chkEnableDeleteAllFolders').checked;
            user.Policy.EnableContentDeletionFromFolders = user.Policy.EnableContentDeletion ? [] : Array.prototype.filter.call(element?.current?.querySelectorAll('.chkFolder'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });
            if (window.ApiClient.isMinServerVersion('10.6.0')) {
                user.Policy.SyncPlayAccess = element?.current?.querySelector('#selectSyncPlayAccess').value;
            }
            window.ApiClient.updateUser(user).then(function () {
                window.ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                    onSaveComplete();
                });
            });
        };

        const onSubmit = (e) => {
            loading.show();
            getUser().then(function (result) {
                saveUser(result);
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        element?.current?.querySelector('.chkEnableDeleteAllFolders').addEventListener('change', function (this: HTMLInputElement) {
            if (this.checked) {
                element?.current?.querySelector('.deleteAccessListContainer').classList.add('hide');
            } else {
                element?.current?.querySelector('.deleteAccessListContainer').classList.remove('hide');
            }
        });

        window.ApiClient.getServerConfiguration().then(function (config) {
            const fldRemoteAccess = element?.current?.querySelector('.fldRemoteAccess');
            config.EnableRemoteAccess ? fldRemoteAccess.classList.remove('hide') : fldRemoteAccess.classList.add('hide');
        });

        element?.current?.querySelector('.editUserProfileForm').addEventListener('submit', onSubmit);

        element?.current?.querySelector('.button-cancel').addEventListener('click', function() {
            window.history.back();
        });
    }, [loadData]);

    return (
        <div ref={element}>
            <div className='content-primary'>
                <div className='verticalSection'>
                    <div className='sectionTitleContainer flex align-items-center'>
                        <h2 className='sectionTitle username'>
                            {userName}
                        </h2>
                        <SectionTitleLinkElement
                            className='raised button-alt headerHelpButton'
                            title='Help'
                            url='https://docs.jellyfin.org/general/server/users/'
                        />
                    </div>
                </div>
                <div
                    data-role='controlgroup'
                    data-type='horizontal'
                    className='localnav'
                    id='userProfileNavigation'
                    style={{display: 'flex'}}
                >
                    <TabLinkElement
                        activeTab={true}
                        tabTitle='Profile'
                        onClick={() => Dashboard.navigate('useredit.html', true)}
                    />
                    <TabLinkElement
                        tabTitle='TabAccess'
                        onClick={() => Dashboard.navigate('userlibraryaccess.html', true)}
                    />
                    <TabLinkElement
                        tabTitle='TabParentalControl'
                        onClick={() => Dashboard.navigate('userparentalcontrol.html', true)}
                    />
                    <TabLinkElement
                        tabTitle='HeaderPassword'
                        onClick={() => Dashboard.navigate('userpassword.html', true)}
                    />
                </div>
                <div
                    className='lnkEditUserPreferencesContainer'
                    style={{paddingBottom: '1em'}}
                >
                    <LinkEditUserPreferences
                        className= 'lnkEditUserPreferences button-link'
                        title= 'ButtonEditOtherUserPreferences'
                    />
                </div>
                <form className='editUserProfileForm'>
                    <div className='disabledUserBanner hide'>
                        <div className='btn btnDarkAccent btnStatic'>
                            <div>
                                {globalize.translate('HeaderThisUserIsCurrentlyDisabled')}
                            </div>
                            <div style={{marginTop: 5}}>
                                {globalize.translate('MessageReenableUser')}
                            </div>
                        </div>
                    </div>
                    <div id='fldUserName' className='inputContainer'>
                        <InputElement
                            type='text'
                            id='txtUserName'
                            label='LabelName'
                            options={'required'}
                        />
                    </div>
                    <div className='selectContainer fldSelectLoginProvider hide'>
                        <SelectElement
                            className= 'selectLoginProvider'
                            label= 'LabelAuthProvider'
                            currentProviderId={authenticationProviderId}
                            providers={authProviders}
                        />
                        <div className='fieldDescription'>
                            {globalize.translate('AuthProviderHelp')}
                        </div>
                    </div>
                    <div className='selectContainer fldSelectPasswordResetProvider hide'>
                        <SelectElement
                            className= 'selectPasswordResetProvider'
                            label= 'LabelPasswordResetProvider'
                            currentProviderId={passwordResetProviderId}
                            providers={passwordResetProviders}
                        />
                        <div className='fieldDescription'>
                            {globalize.translate('PasswordResetProviderHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription fldRemoteAccess hide'>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkRemoteAccess'
                            title='AllowRemoteAccess'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('AllowRemoteAccessHelp')}
                        </div>
                    </div>
                    <CheckBoxElement
                        type='checkbox'
                        className='chkIsAdmin'
                        title='OptionAllowUserToManageServer'
                    />
                    <div id='featureAccessFields' className='verticalSection'>
                        <h2 className='paperListLabel'>
                            {globalize.translate('HeaderFeatureAccess')}
                        </h2>
                        <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                            <CheckBoxElement
                                type='checkbox'
                                className='chkEnableLiveTvAccess'
                                title='OptionAllowBrowsingLiveTv'
                            />
                            <CheckBoxElement
                                type='checkbox'
                                className='chkManageLiveTv'
                                title='OptionAllowManageLiveTv'
                            />
                        </div>
                    </div>
                    <div className='verticalSection'>
                        <h2 className='paperListLabel'>
                            {globalize.translate('HeaderPlayback')}
                        </h2>
                        <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                            <CheckBoxElement
                                type='checkbox'
                                className='chkEnableMediaPlayback'
                                title='OptionAllowMediaPlayback'
                            />
                            <CheckBoxElement
                                type='checkbox'
                                className='chkEnableAudioPlaybackTranscoding'
                                title='OptionAllowAudioPlaybackTranscoding'
                            />
                            <CheckBoxElement
                                type='checkbox'
                                className='chkEnableVideoPlaybackTranscoding'
                                title='OptionAllowVideoPlaybackTranscoding'
                            />
                            <CheckBoxElement
                                type='checkbox'
                                className='chkEnableVideoPlaybackRemuxing'
                                title='OptionAllowVideoPlaybackRemuxing'
                            />
                            <CheckBoxElement
                                type='checkbox'
                                className='chkForceRemoteSourceTranscoding'
                                title='OptionForceRemoteSourceTranscoding'
                            />
                        </div>
                        <div className='fieldDescription'>
                            {globalize.translate('OptionAllowMediaPlaybackTranscodingHelp')}
                        </div>
                    </div>
                    <br />
                    <div className='verticalSection'>
                        <div className='inputContainer'>
                            <InputElement
                                type='number'
                                id='txtRemoteClientBitrateLimit'
                                label='LabelRemoteClientBitrateLimit'
                                options={'inputMode="decimal" pattern="[0-9]*(.[0-9]+)?" min="{0}" step=".25"'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('LabelRemoteClientBitrateLimitHelp')}
                            </div>
                            <div className='fieldDescription'>
                                {globalize.translate('LabelUserRemoteClientBitrateLimitHelp')}
                            </div>
                        </div>
                    </div>
                    <div className='verticalSection'>
                        <div className='selectContainer fldSelectSyncPlayAccess'>
                            <SelectSyncPlayAccessElement
                                className='selectSyncPlayAccess'
                                id='selectSyncPlayAccess'
                                label='LabelSyncPlayAccess'
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('SyncPlayAccessHelp')}
                            </div>
                        </div>
                    </div>
                    <div className='verticalSection verticalSection-extrabottompadding'>
                        <h2>{globalize.translate('HeaderAllowMediaDeletionFrom')}</h2>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkEnableDeleteAllFolders'
                            title='AllLibraries'
                        />
                        <div className='deleteAccessListContainer'>
                            <div className='deleteAccess'>
                                <h3 className='checkboxListLabel'>
                                    {globalize.translate('DeleteFoldersAccess')}
                                </h3>
                                <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                                    {deleteFoldersAccess.map(Item => (
                                        <CheckBoxListItem
                                            key={Item.Id}
                                            className='chkFolder'
                                            Id={Item.Id}
                                            Name={Item.Name}
                                            checkedAttribute={Item.checkedAttribute}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className='fieldDescription'>
                                {globalize.translate('DeleteFoldersAccessHelp')}
                            </div>
                        </div>
                    </div>
                    <div className='verticalSection'>
                        <h2 className='checkboxListLabel'>
                            {globalize.translate('HeaderRemoteControl')}
                        </h2>
                        <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                            <CheckBoxElement
                                type='checkbox'
                                className='chkEnableRemoteControlOtherUsers'
                                title='OptionAllowRemoteControlOthers'
                            />
                            <CheckBoxElement
                                type='checkbox'
                                className='chkRemoteControlSharedDevices'
                                title='OptionAllowRemoteSharedDevices'
                            />
                        </div>
                        <div className='fieldDescription'>
                            {globalize.translate('OptionAllowRemoteSharedDevicesHelp')}
                        </div>
                    </div>
                    <h2 className='checkboxListLabel'>
                        {globalize.translate('Other')}
                    </h2>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkEnableDownloading'
                            title='OptionAllowContentDownload'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('OptionAllowContentDownloadHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription' id='fldIsEnabled'>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkDisabled'
                            title='OptionDisableUser'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('OptionDisableUserHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription' id='fldIsHidden'>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkIsHidden'
                            title='OptionHideUser'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('OptionHideUserFromLoginHelp')}
                        </div>
                    </div>
                    <br />
                    <div className='verticalSection'>
                        <div className='inputContainer' id='fldLoginAttemptsBeforeLockout'>
                            <InputElement
                                type='number'
                                id='txtLoginAttemptsBeforeLockout'
                                label='LabelUserLoginAttemptsBeforeLockout'
                                options={'min={-1} step={1}'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('OptionLoginAttemptsBeforeLockout')}
                            </div>
                            <div className='fieldDescription'>
                                {globalize.translate('OptionLoginAttemptsBeforeLockoutHelp')}
                            </div>
                        </div>
                    </div>
                    <br />
                    <div className='verticalSection'>
                        <div className='inputContainer' id='fldMaxActiveSessions'>
                            <InputElement
                                type='number'
                                id='txtMaxActiveSessions'
                                label='LabelUserMaxActiveSessions'
                                options={'min={0} step={1}'}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('OptionMaxActiveSessions')}
                            </div>
                            <div className='fieldDescription'>
                                {globalize.translate('OptionMaxActiveSessionsHelp')}
                            </div>
                        </div>
                    </div>
                    <br />
                    <div>
                        <ButtonElement
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                        />
                        <ButtonElement
                            type='button'
                            className='raised button-cancel block btnCancel'
                            title='ButtonCancel'
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditPage;
