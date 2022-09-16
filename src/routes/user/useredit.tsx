import type { SyncPlayUserAccessType, UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FunctionComponent, useCallback, useEffect, useState, useRef } from 'react';
import Dashboard from '../../utils/dashboard';
import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import ButtonElement from '../../elements/ButtonElement';
import CheckBoxElement from '../../elements/CheckBoxElement';
import InputElement from '../../elements/InputElement';
import LinkEditUserPreferences from '../../components/dashboard/users/LinkEditUserPreferences';
import SectionTitleContainer from '../../elements/SectionTitleContainer';
import SectionTabs from '../../components/dashboard/users/SectionTabs';
import loading from '../../components/loading/loading';
import toast from '../../components/toast/toast';
import { getParameterByName } from '../../utils/url';
import escapeHTML from 'escape-html';
import SelectElement from '../../elements/SelectElement';
import Page from '../../components/Page';

type ResetProvider = AuthProvider & {
    checkedAttribute: string
}

type AuthProvider = {
    Name?: string;
    Id?: string;
}

const UserEdit: FunctionComponent = () => {
    const [ userName, setUserName ] = useState('');
    const [ deleteFoldersAccess, setDeleteFoldersAccess ] = useState<ResetProvider[]>([]);
    const [ authProviders, setAuthProviders ] = useState<AuthProvider[]>([]);
    const [ passwordResetProviders, setPasswordResetProviders ] = useState<ResetProvider[]>([]);

    const [ authenticationProviderId, setAuthenticationProviderId ] = useState('');
    const [ passwordResetProviderId, setPasswordResetProviderId ] = useState('');

    const element = useRef<HTMLDivElement>(null);

    const triggerChange = (select: HTMLInputElement) => {
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        select.dispatchEvent(evt);
    };

    const getUser = () => {
        const userId = getParameterByName('userId');
        return window.ApiClient.getUser(userId);
    };

    const loadAuthProviders = useCallback((user, providers) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const fldSelectLoginProvider = page.querySelector('.fldSelectLoginProvider') as HTMLDivElement;
        providers.length > 1 ? fldSelectLoginProvider.classList.remove('hide') : fldSelectLoginProvider.classList.add('hide');

        setAuthProviders(providers);

        const currentProviderId = user.Policy.AuthenticationProviderId;
        setAuthenticationProviderId(currentProviderId);
    }, []);

    const loadPasswordResetProviders = useCallback((user, providers) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const fldSelectPasswordResetProvider = page.querySelector('.fldSelectPasswordResetProvider') as HTMLDivElement;
        providers.length > 1 ? fldSelectPasswordResetProvider.classList.remove('hide') : fldSelectPasswordResetProvider.classList.add('hide');

        setPasswordResetProviders(providers);

        const currentProviderId = user.Policy.PasswordResetProviderId;
        setPasswordResetProviderId(currentProviderId);
    }, []);

    const loadDeleteFolders = useCallback((user, mediaFolders) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        window.ApiClient.getJSON(window.ApiClient.getUrl('Channels', {
            SupportsMediaDeletion: true
        })).then(function (channelsResult) {
            let isChecked;
            let checkedAttribute;
            const itemsArr: ResetProvider[] = [];

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

            const chkEnableDeleteAllFolders = page.querySelector('.chkEnableDeleteAllFolders') as HTMLInputElement;
            chkEnableDeleteAllFolders.checked = user.Policy.EnableContentDeletion;
            triggerChange(chkEnableDeleteAllFolders);
        });
    }, []);

    const loadUser = useCallback((user) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

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

        const disabledUserBanner = page.querySelector('.disabledUserBanner') as HTMLDivElement;
        user.Policy.IsDisabled ? disabledUserBanner.classList.remove('hide') : disabledUserBanner.classList.add('hide');

        const txtUserName = page.querySelector('#txtUserName') as HTMLInputElement;
        txtUserName.disabled = false;
        txtUserName.removeAttribute('disabled');

        const lnkEditUserPreferences = page.querySelector('.lnkEditUserPreferences') as HTMLDivElement;
        lnkEditUserPreferences.setAttribute('href', 'mypreferencesmenu.html?userId=' + user.Id);
        LibraryMenu.setTitle(user.Name);
        setUserName(user.Name);
        (page.querySelector('#txtUserName') as HTMLInputElement).value = user.Name;
        (page.querySelector('.chkIsAdmin') as HTMLInputElement).checked = user.Policy.IsAdministrator;
        (page.querySelector('.chkDisabled') as HTMLInputElement).checked = user.Policy.IsDisabled;
        (page.querySelector('.chkIsHidden') as HTMLInputElement).checked = user.Policy.IsHidden;
        (page.querySelector('.chkRemoteControlSharedDevices') as HTMLInputElement).checked = user.Policy.EnableSharedDeviceControl;
        (page.querySelector('.chkEnableRemoteControlOtherUsers') as HTMLInputElement).checked = user.Policy.EnableRemoteControlOfOtherUsers;
        (page.querySelector('.chkEnableDownloading') as HTMLInputElement).checked = user.Policy.EnableContentDownloading;
        (page.querySelector('.chkManageLiveTv') as HTMLInputElement).checked = user.Policy.EnableLiveTvManagement;
        (page.querySelector('.chkEnableLiveTvAccess') as HTMLInputElement).checked = user.Policy.EnableLiveTvAccess;
        (page.querySelector('.chkEnableMediaPlayback') as HTMLInputElement).checked = user.Policy.EnableMediaPlayback;
        (page.querySelector('.chkEnableAudioPlaybackTranscoding') as HTMLInputElement).checked = user.Policy.EnableAudioPlaybackTranscoding;
        (page.querySelector('.chkEnableVideoPlaybackTranscoding') as HTMLInputElement).checked = user.Policy.EnableVideoPlaybackTranscoding;
        (page.querySelector('.chkEnableVideoPlaybackRemuxing') as HTMLInputElement).checked = user.Policy.EnablePlaybackRemuxing;
        (page.querySelector('.chkForceRemoteSourceTranscoding') as HTMLInputElement).checked = user.Policy.ForceRemoteSourceTranscoding;
        (page.querySelector('.chkRemoteAccess') as HTMLInputElement).checked = user.Policy.EnableRemoteAccess == null || user.Policy.EnableRemoteAccess;
        (page.querySelector('#txtRemoteClientBitrateLimit') as HTMLInputElement).value = user.Policy.RemoteClientBitrateLimit > 0 ?
            (user.Policy.RemoteClientBitrateLimit / 1e6).toLocaleString(undefined, {maximumFractionDigits: 6}) : '';
        (page.querySelector('#txtLoginAttemptsBeforeLockout') as HTMLInputElement).value = user.Policy.LoginAttemptsBeforeLockout || '0';
        (page.querySelector('#txtMaxActiveSessions') as HTMLInputElement).value = user.Policy.MaxActiveSessions || '0';
        if (window.ApiClient.isMinServerVersion('10.6.0')) {
            (page.querySelector('#selectSyncPlayAccess') as HTMLSelectElement).value = user.Policy.SyncPlayAccess;
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
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        loadData();

        function onSaveComplete() {
            Dashboard.navigate('userprofiles.html');
            loading.hide();
            toast(globalize.translate('SettingsSaved'));
        }

        const saveUser = (user: UserDto) => {
            if (!user.Id) {
                throw new Error('Unexpected null user.Id');
            }

            if (!user.Policy) {
                throw new Error('Unexpected null user.Policy');
            }

            user.Name = (page.querySelector('#txtUserName') as HTMLInputElement).value;
            user.Policy.IsAdministrator = (page.querySelector('.chkIsAdmin') as HTMLInputElement).checked;
            user.Policy.IsHidden = (page.querySelector('.chkIsHidden') as HTMLInputElement).checked;
            user.Policy.IsDisabled = (page.querySelector('.chkDisabled') as HTMLInputElement).checked;
            user.Policy.EnableRemoteControlOfOtherUsers = (page.querySelector('.chkEnableRemoteControlOtherUsers') as HTMLInputElement).checked;
            user.Policy.EnableLiveTvManagement = (page.querySelector('.chkManageLiveTv') as HTMLInputElement).checked;
            user.Policy.EnableLiveTvAccess = (page.querySelector('.chkEnableLiveTvAccess') as HTMLInputElement).checked;
            user.Policy.EnableSharedDeviceControl = (page.querySelector('.chkRemoteControlSharedDevices') as HTMLInputElement).checked;
            user.Policy.EnableMediaPlayback = (page.querySelector('.chkEnableMediaPlayback') as HTMLInputElement).checked;
            user.Policy.EnableAudioPlaybackTranscoding = (page.querySelector('.chkEnableAudioPlaybackTranscoding') as HTMLInputElement).checked;
            user.Policy.EnableVideoPlaybackTranscoding = (page.querySelector('.chkEnableVideoPlaybackTranscoding') as HTMLInputElement).checked;
            user.Policy.EnablePlaybackRemuxing = (page.querySelector('.chkEnableVideoPlaybackRemuxing') as HTMLInputElement).checked;
            user.Policy.ForceRemoteSourceTranscoding = (page.querySelector('.chkForceRemoteSourceTranscoding') as HTMLInputElement).checked;
            user.Policy.EnableContentDownloading = (page.querySelector('.chkEnableDownloading') as HTMLInputElement).checked;
            user.Policy.EnableRemoteAccess = (page.querySelector('.chkRemoteAccess') as HTMLInputElement).checked;
            user.Policy.RemoteClientBitrateLimit = Math.floor(1e6 * parseFloat((page.querySelector('#txtRemoteClientBitrateLimit') as HTMLInputElement).value || '0'));
            user.Policy.LoginAttemptsBeforeLockout = parseInt((page.querySelector('#txtLoginAttemptsBeforeLockout') as HTMLInputElement).value || '0');
            user.Policy.MaxActiveSessions = parseInt((page.querySelector('#txtMaxActiveSessions') as HTMLInputElement).value || '0');
            user.Policy.AuthenticationProviderId = (page.querySelector('#selectLoginProvider') as HTMLSelectElement).value;
            user.Policy.PasswordResetProviderId = (page.querySelector('#selectPasswordResetProvider') as HTMLSelectElement).value;
            user.Policy.EnableContentDeletion = (page.querySelector('.chkEnableDeleteAllFolders') as HTMLInputElement).checked;
            user.Policy.EnableContentDeletionFromFolders = user.Policy.EnableContentDeletion ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkFolder'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });
            if (window.ApiClient.isMinServerVersion('10.6.0')) {
                user.Policy.SyncPlayAccess = (page.querySelector('#selectSyncPlayAccess') as HTMLSelectElement).value as SyncPlayUserAccessType;
            }
            window.ApiClient.updateUser(user).then(function () {
                window.ApiClient.updateUserPolicy(user.Id || '', user.Policy || {}).then(function () {
                    onSaveComplete();
                });
            });
        };

        const onSubmit = (e: Event) => {
            loading.show();
            getUser().then(function (result) {
                saveUser(result);
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        (page.querySelector('.chkEnableDeleteAllFolders') as HTMLInputElement).addEventListener('change', function (this: HTMLInputElement) {
            if (this.checked) {
                (page.querySelector('.deleteAccess') as HTMLDivElement).classList.add('hide');
            } else {
                (page.querySelector('.deleteAccess') as HTMLDivElement).classList.remove('hide');
            }
        });

        window.ApiClient.getNamedConfiguration('network').then(function (config) {
            const fldRemoteAccess = page.querySelector('.fldRemoteAccess') as HTMLDivElement;
            config.EnableRemoteAccess ? fldRemoteAccess.classList.remove('hide') : fldRemoteAccess.classList.add('hide');
        });

        (page.querySelector('.editUserProfileForm') as HTMLFormElement).addEventListener('submit', onSubmit);

        (page.querySelector('#btnCancel') as HTMLButtonElement).addEventListener('click', function() {
            window.history.back();
        });
    }, [loadData]);

    const optionLoginProvider = authProviders.map((provider) => {
        const selected = provider.Id === authenticationProviderId || authProviders.length < 2 ? ' selected' : '';
        return `<option value="${provider.Id}"${selected}>${escapeHTML(provider.Name)}</option>`;
    });

    const optionPasswordResetProvider = passwordResetProviders.map((provider) => {
        const selected = provider.Id === passwordResetProviderId || passwordResetProviders.length < 2 ? ' selected' : '';
        return `<option value="${provider.Id}"${selected}>${escapeHTML(provider.Name)}</option>`;
    });

    const optionSyncPlayAccess = () => {
        let content = '';
        content += `<option value='CreateAndJoinGroups'>${globalize.translate('LabelSyncPlayAccessCreateAndJoinGroups')}</option>`;
        content += `<option value='JoinGroups'>${globalize.translate('LabelSyncPlayAccessJoinGroups')}</option>`;
        content += `<option value='None'>${globalize.translate('LabelSyncPlayAccessNone')}</option>`;
        return content;
    };

    return (
        <Page
            id='editUserPage'
            className='mainAnimatedPage type-interior'
        >
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={userName}
                        url='https://docs.jellyfin.org/general/server/users/'
                    />
                </div>

                <SectionTabs activeTab='useredit'/>
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
                            id='selectLoginProvider'
                            label='LabelAuthProvider'
                        >
                            {optionLoginProvider}
                        </SelectElement>

                        <div className='fieldDescription'>
                            {globalize.translate('AuthProviderHelp')}
                        </div>
                    </div>
                    <div className='selectContainer fldSelectPasswordResetProvider hide'>
                        <SelectElement
                            id='selectPasswordResetProvider'
                            label='LabelPasswordResetProvider'
                        >
                            {optionPasswordResetProvider}
                        </SelectElement>
                        <div className='fieldDescription'>
                            {globalize.translate('PasswordResetProviderHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription fldRemoteAccess hide'>
                        <CheckBoxElement
                            className='chkRemoteAccess'
                            title='AllowRemoteAccess'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('AllowRemoteAccessHelp')}
                        </div>
                    </div>
                    <CheckBoxElement
                        labelClassName='checkboxContainer'
                        className='chkIsAdmin'
                        title='OptionAllowUserToManageServer'
                    />
                    <div id='featureAccessFields' className='verticalSection'>
                        <h2 className='paperListLabel'>
                            {globalize.translate('HeaderFeatureAccess')}
                        </h2>
                        <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                            <CheckBoxElement
                                className='chkEnableLiveTvAccess'
                                title='OptionAllowBrowsingLiveTv'
                            />
                            <CheckBoxElement
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
                                className='chkEnableMediaPlayback'
                                title='OptionAllowMediaPlayback'
                            />
                            <CheckBoxElement
                                className='chkEnableAudioPlaybackTranscoding'
                                title='OptionAllowAudioPlaybackTranscoding'
                            />
                            <CheckBoxElement
                                className='chkEnableVideoPlaybackTranscoding'
                                title='OptionAllowVideoPlaybackTranscoding'
                            />
                            <CheckBoxElement
                                className='chkEnableVideoPlaybackRemuxing'
                                title='OptionAllowVideoPlaybackRemuxing'
                            />
                            <CheckBoxElement
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
                            <SelectElement
                                id='selectSyncPlayAccess'
                                label='LabelSyncPlayAccess'
                            >
                                {optionSyncPlayAccess()}
                            </SelectElement>
                            <div className='fieldDescription'>
                                {globalize.translate('SyncPlayAccessHelp')}
                            </div>
                        </div>
                    </div>
                    <div className='verticalSection'>
                        <h2 className='checkboxListLabel' style={{marginBottom: '1em'}}>
                            {globalize.translate('HeaderAllowMediaDeletionFrom')}
                        </h2>
                        <div className='checkboxList paperList checkboxList-paperList'>
                            <CheckBoxElement
                                labelClassName='checkboxContainer'
                                className='chkEnableDeleteAllFolders'
                                title='AllLibraries'
                            />
                            <div className='deleteAccess'>
                                {deleteFoldersAccess.map(Item => (
                                    <CheckBoxElement
                                        key={Item.Id}
                                        className='chkFolder'
                                        itemId={Item.Id}
                                        itemName={Item.Name}
                                        itemCheckedAttribute={Item.checkedAttribute}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className='verticalSection'>
                        <h2 className='checkboxListLabel'>
                            {globalize.translate('HeaderRemoteControl')}
                        </h2>
                        <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                            <CheckBoxElement
                                className='chkEnableRemoteControlOtherUsers'
                                title='OptionAllowRemoteControlOthers'
                            />
                            <CheckBoxElement
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
                            className='chkEnableDownloading'
                            title='OptionAllowContentDownload'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('OptionAllowContentDownloadHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription' id='fldIsEnabled'>
                        <CheckBoxElement
                            className='chkDisabled'
                            title='OptionDisableUser'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('OptionDisableUserHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription' id='fldIsHidden'>
                        <CheckBoxElement
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
                            id='btnCancel'
                            className='raised button-cancel block'
                            title='ButtonCancel'
                        />
                    </div>
                </form>
            </div>
        </Page>

    );
};

export default UserEdit;
