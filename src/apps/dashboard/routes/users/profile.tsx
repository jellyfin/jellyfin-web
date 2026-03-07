import type { BaseItemDto, NameIdPair, SyncPlayUserAccessType, UserDto, UserPolicy } from '@jellyfin/sdk/lib/generated-client';

// Temporary extension for MaxActiveVideoStreams until SDK is updated
interface ExtendedUserPolicy extends UserPolicy {
    MaxActiveVideoStreams?: number;
}
import escapeHTML from 'escape-html';
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import globalize from '../../../../lib/globalize';
import Button from '../../../../elements/emby-button/Button';
import CheckBoxElement from '../../../../elements/CheckBoxElement';
import LinkButton from '../../../../elements/emby-button/LinkButton';
import Input from '../../../../elements/emby-input/Input';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import SectionTabs from '../../../../components/dashboard/users/SectionTabs';
import loading from '../../../../components/loading/loading';
import SelectElement from '../../../../elements/SelectElement';
import Page from '../../../../components/Page';
import { useUser } from 'apps/dashboard/features/users/api/useUser';
import { useAuthProviders } from 'apps/dashboard/features/users/api/useAuthProviders';
import { usePasswordResetProviders } from 'apps/dashboard/features/users/api/usePasswordResetProviders';
import { useLibraryMediaFolders } from 'apps/dashboard/features/users/api/useLibraryMediaFolders';
import { useChannels } from 'apps/dashboard/features/users/api/useChannels';
import { useUpdateUser } from 'apps/dashboard/features/users/api/useUpdateUser';
import { useUpdateUserPolicy } from 'apps/dashboard/features/users/api/useUpdateUserPolicy';
import { useNetworkConfig } from 'apps/dashboard/features/users/api/useNetworkConfig';

type ResetProvider = BaseItemDto & {
    checkedAttribute: string
};

const getCheckedElementDataIds = (elements: NodeListOf<Element>) => (
    Array.prototype.filter.call(elements, e => e.checked)
        .map(e => e.getAttribute('data-id'))
);

const UserEdit = () => {
    const navigate = useNavigate();
    const [ searchParams ] = useSearchParams();
    const userId = searchParams.get('userId');
    const [ deleteFoldersAccess, setDeleteFoldersAccess ] = useState<ResetProvider[]>([]);
    const libraryMenu = useMemo(async () => ((await import('../../../../scripts/libraryMenu')).default), []);

    const [ authenticationProviderId, setAuthenticationProviderId ] = useState('');
    const [ passwordResetProviderId, setPasswordResetProviderId ] = useState('');

    const { data: userDto, isSuccess: isUserSuccess } = useUser(userId ? { userId: userId } : undefined);
    const { data: authProviders, isSuccess: isAuthProvidersSuccess } = useAuthProviders();
    const { data: passwordResetProviders, isSuccess: isPasswordResetProvidersSuccess } = usePasswordResetProviders();
    const { data: mediaFolders, isSuccess: isMediaFoldersSuccess } = useLibraryMediaFolders({ isHidden: false });
    const { data: channels, isSuccess: isChannelsSuccess } = useChannels({ supportsMediaDeletion: true });
    const { data: netConfig, isSuccess: isNetConfigSuccess } = useNetworkConfig();

    const updateUser = useUpdateUser();
    const updateUserPolicy = useUpdateUserPolicy();

    const element = useRef<HTMLDivElement>(null);

    const triggerChange = (select: HTMLInputElement) => {
        const evt = new Event('change', { bubbles: false, cancelable: true });
        select.dispatchEvent(evt);
    };

    const loadAuthProviders = useCallback((page: HTMLDivElement, user: UserDto, providers: NameIdPair[]) => {
        const fldSelectLoginProvider = page.querySelector('.fldSelectLoginProvider') as HTMLDivElement;
        fldSelectLoginProvider.classList.toggle('hide', providers.length <= 1);

        const currentProviderId = user.Policy?.AuthenticationProviderId || '';
        setAuthenticationProviderId(currentProviderId);
    }, []);

    const loadPasswordResetProviders = useCallback((page: HTMLDivElement, user: UserDto, providers: NameIdPair[]) => {
        const fldSelectPasswordResetProvider = page.querySelector('.fldSelectPasswordResetProvider') as HTMLDivElement;
        fldSelectPasswordResetProvider.classList.toggle('hide', providers.length <= 1);

        const currentProviderId = user.Policy?.PasswordResetProviderId || '';
        setPasswordResetProviderId(currentProviderId);
    }, []);

    const loadDeleteFolders = useCallback((page: HTMLDivElement, user: UserDto, folders: BaseItemDto[]) => {
        let isChecked;
        let checkedAttribute;
        const itemsArr: ResetProvider[] = [];

        for (const mediaFolder of folders) {
            isChecked = user.Policy?.EnableContentDeletion || user.Policy?.EnableContentDeletionFromFolders?.indexOf(mediaFolder.Id || '') != -1;
            checkedAttribute = isChecked ? ' checked="checked"' : '';
            itemsArr.push({
                ...mediaFolder,
                checkedAttribute: checkedAttribute
            });
        }

        if (channels?.Items) {
            for (const channel of channels.Items) {
                isChecked = user.Policy?.EnableContentDeletion || user.Policy?.EnableContentDeletionFromFolders?.indexOf(channel.Id || '') != -1;
                checkedAttribute = isChecked ? ' checked="checked"' : '';
                itemsArr.push({
                    ...channel,
                    checkedAttribute: checkedAttribute
                });
            }
        }

        setDeleteFoldersAccess(itemsArr);

        const chkEnableDeleteAllFolders = page.querySelector('.chkEnableDeleteAllFolders') as HTMLInputElement;
        chkEnableDeleteAllFolders.checked = user.Policy?.EnableContentDeletion || false;
        triggerChange(chkEnableDeleteAllFolders);
    }, [channels]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('[useredit] Unexpected null page reference');
            return;
        }

        if (userDto && isAuthProvidersSuccess && authProviders != null) {
            loadAuthProviders(page, userDto, authProviders);
        }
    }, [authProviders, isAuthProvidersSuccess, userDto, loadAuthProviders]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('[useredit] Unexpected null page reference');
            return;
        }

        if (userDto && isPasswordResetProvidersSuccess && passwordResetProviders != null) {
            loadPasswordResetProviders(page, userDto, passwordResetProviders);
        }
    }, [passwordResetProviders, isPasswordResetProvidersSuccess, userDto, loadPasswordResetProviders]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('[useredit] Unexpected null page reference');
            return;
        }

        if (userDto && isMediaFoldersSuccess && isChannelsSuccess && mediaFolders?.Items != null) {
            loadDeleteFolders(page, userDto, mediaFolders.Items);
        }
    }, [userDto, mediaFolders, isMediaFoldersSuccess, isChannelsSuccess, channels, loadDeleteFolders]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('[useredit] Unexpected null page reference');
            return;
        }

        if (netConfig && isNetConfigSuccess) {
            (page.querySelector('.fldRemoteAccess') as HTMLDivElement).classList.toggle('hide', !netConfig.EnableRemoteAccess);
        }
    }, [netConfig, isNetConfigSuccess]);

    const loadUser = useCallback((user: UserDto) => {
        const page = element.current;

        if (!page) {
            console.error('[useredit] Unexpected null page reference');
            return;
        }

        const disabledUserBanner = page.querySelector('.disabledUserBanner') as HTMLDivElement;
        disabledUserBanner.classList.toggle('hide', !user.Policy?.IsDisabled);

        const txtUserName = page.querySelector('#txtUserName') as HTMLInputElement;
        txtUserName.disabled = false;
        txtUserName.removeAttribute('disabled');

        void libraryMenu.then(menu => menu.setTitle(user.Name));

        (page.querySelector('#txtUserName') as HTMLInputElement).value = user.Name || '';
        (page.querySelector('.chkIsAdmin') as HTMLInputElement).checked = !!user.Policy?.IsAdministrator;
        (page.querySelector('.chkDisabled') as HTMLInputElement).checked = !!user.Policy?.IsDisabled;
        (page.querySelector('.chkIsHidden') as HTMLInputElement).checked = !!user.Policy?.IsHidden;
        (page.querySelector('.chkEnableCollectionManagement') as HTMLInputElement).checked = !!user.Policy?.EnableCollectionManagement;
        (page.querySelector('.chkEnableSubtitleManagement') as HTMLInputElement).checked = !!user.Policy?.EnableSubtitleManagement;
        (page.querySelector('.chkRemoteControlSharedDevices') as HTMLInputElement).checked = !!user.Policy?.EnableSharedDeviceControl;
        (page.querySelector('.chkEnableRemoteControlOtherUsers') as HTMLInputElement).checked = !!user.Policy?.EnableRemoteControlOfOtherUsers;
        (page.querySelector('.chkEnableDownloading') as HTMLInputElement).checked = !!user.Policy?.EnableContentDownloading;
        (page.querySelector('.chkManageLiveTv') as HTMLInputElement).checked = !!user.Policy?.EnableLiveTvManagement;
        (page.querySelector('.chkEnableLiveTvAccess') as HTMLInputElement).checked = !!user.Policy?.EnableLiveTvAccess;
        (page.querySelector('.chkEnableMediaPlayback') as HTMLInputElement).checked = !!user.Policy?.EnableMediaPlayback;
        (page.querySelector('.chkEnableAudioPlaybackTranscoding') as HTMLInputElement).checked = !!user.Policy?.EnableAudioPlaybackTranscoding;
        (page.querySelector('.chkEnableVideoPlaybackTranscoding') as HTMLInputElement).checked = !!user.Policy?.EnableVideoPlaybackTranscoding;
        (page.querySelector('.chkEnableVideoPlaybackRemuxing') as HTMLInputElement).checked = !!user.Policy?.EnablePlaybackRemuxing;
        (page.querySelector('.chkForceRemoteSourceTranscoding') as HTMLInputElement).checked = !!user.Policy?.ForceRemoteSourceTranscoding;
        (page.querySelector('.chkRemoteAccess') as HTMLInputElement).checked = user.Policy?.EnableRemoteAccess == null || user.Policy?.EnableRemoteAccess;
        (page.querySelector('#txtRemoteClientBitrateLimit') as HTMLInputElement).value = user.Policy?.RemoteClientBitrateLimit && user.Policy?.RemoteClientBitrateLimit > 0 ?
            (user.Policy?.RemoteClientBitrateLimit / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '';
        (page.querySelector('#txtLoginAttemptsBeforeLockout') as HTMLInputElement).value = String(user.Policy?.LoginAttemptsBeforeLockout) || '-1';
        (page.querySelector('#txtMaxActiveSessions') as HTMLInputElement).value = String(user.Policy?.MaxActiveSessions) || '0';
        (page.querySelector('#txtMaxActiveVideoStreams') as HTMLInputElement).value = String((user.Policy as ExtendedUserPolicy)?.MaxActiveVideoStreams) || '0';
        (page.querySelector('#selectSyncPlayAccess') as HTMLSelectElement).value = String(user.Policy?.SyncPlayAccess);
        loading.hide();
    }, [ libraryMenu ]);

    const loadData = useCallback(() => {
        if (!userDto) {
            console.error('[profile] No user available');
            return;
        }
        loading.show();
        loadUser(userDto);
    }, [userDto, loadUser]);

    useEffect(() => {
        if (isUserSuccess) {
            loadData();
        }
    }, [loadData, isUserSuccess]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('[useredit] Unexpected null page reference');
            return;
        }

        const saveUser = (user: UserDto) => {
            if (!user.Id || !user.Policy) {
                throw new Error('Unexpected null user id or policy');
            }

            user.Name = (page.querySelector('#txtUserName') as HTMLInputElement).value.trim();
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
            user.Policy.EnableCollectionManagement = (page.querySelector('.chkEnableCollectionManagement') as HTMLInputElement).checked;
            user.Policy.EnableSubtitleManagement = (page.querySelector('.chkEnableSubtitleManagement') as HTMLInputElement).checked;
            user.Policy.ForceRemoteSourceTranscoding = (page.querySelector('.chkForceRemoteSourceTranscoding') as HTMLInputElement).checked;
            user.Policy.EnableContentDownloading = (page.querySelector('.chkEnableDownloading') as HTMLInputElement).checked;
            user.Policy.EnableRemoteAccess = (page.querySelector('.chkRemoteAccess') as HTMLInputElement).checked;
            user.Policy.RemoteClientBitrateLimit = Math.floor(1e6 * parseFloat((page.querySelector('#txtRemoteClientBitrateLimit') as HTMLInputElement).value || '0'));
            user.Policy.LoginAttemptsBeforeLockout = parseInt((page.querySelector('#txtLoginAttemptsBeforeLockout') as HTMLInputElement).value || '0', 10);
            user.Policy.MaxActiveSessions = parseInt((page.querySelector('#txtMaxActiveSessions') as HTMLInputElement).value || '0', 10);
            (user.Policy as ExtendedUserPolicy).MaxActiveVideoStreams = parseInt((page.querySelector('#txtMaxActiveVideoStreams') as HTMLInputElement).value || '0', 10);
            user.Policy.AuthenticationProviderId = (page.querySelector('#selectLoginProvider') as HTMLSelectElement).value;
            user.Policy.PasswordResetProviderId = (page.querySelector('#selectPasswordResetProvider') as HTMLSelectElement).value;
            user.Policy.EnableContentDeletion = (page.querySelector('.chkEnableDeleteAllFolders') as HTMLInputElement).checked;
            user.Policy.EnableContentDeletionFromFolders = user.Policy.EnableContentDeletion ? [] : getCheckedElementDataIds(page.querySelectorAll('.chkFolder'));
            user.Policy.SyncPlayAccess = (page.querySelector('#selectSyncPlayAccess') as HTMLSelectElement).value as SyncPlayUserAccessType;

            updateUser.mutate({ userId: user.Id, userDto: user }, {
                onSuccess: () => {
                    if (user.Id) {
                        updateUserPolicy.mutate({
                            userId: user.Id,
                            userPolicy: user.Policy || { PasswordResetProviderId: '', AuthenticationProviderId: '' }
                        }, {
                            onSuccess: () => {
                                loading.hide();
                                navigate('/dashboard/users', {
                                    state: { openSavedToast: true }
                                });
                            }
                        });
                    }
                }
            });
        };

        const onSubmit = (e: Event) => {
            loading.show();
            if (userDto) {
                saveUser(userDto);
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const onBtnCancelClick = () => {
            window.history.back();
        };

        (page.querySelector('.chkEnableDeleteAllFolders') as HTMLInputElement).addEventListener('change', function (this: HTMLInputElement) {
            (page.querySelector('.deleteAccess') as HTMLDivElement).classList.toggle('hide', this.checked);
        });

        (page.querySelector('.editUserProfileForm') as HTMLFormElement).addEventListener('submit', onSubmit);
        (page.querySelector('#btnCancel') as HTMLButtonElement).addEventListener('click', onBtnCancelClick);

        return () => {
            (page.querySelector('.editUserProfileForm') as HTMLFormElement).removeEventListener('submit', onSubmit);
            (page.querySelector('#btnCancel') as HTMLButtonElement).removeEventListener('click', onBtnCancelClick);
        };
    }, [loadData, updateUser, userDto, updateUserPolicy, navigate]);

    const optionLoginProvider = authProviders?.map((provider) => {
        const selected = provider.Id === authenticationProviderId || authProviders.length < 2 ? ' selected' : '';
        return `<option value="${provider.Id}"${selected}>${escapeHTML(provider.Name)}</option>`;
    });

    const optionPasswordResetProvider = passwordResetProviders?.map((provider) => {
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
                        title={userDto?.Name || ''}
                    />
                </div>

                <SectionTabs activeTab='useredit'/>
                <div
                    className='lnkEditUserPreferencesContainer'
                    style={{ paddingBottom: '1em' }}
                >
                    <LinkButton className='lnkEditUserPreferences button-link' href={userDto?.Id ? `mypreferencesmenu?userId=${userDto.Id}` : undefined}>
                        {globalize.translate('ButtonEditOtherUserPreferences')}
                    </LinkButton>
                </div>
                <form className='editUserProfileForm'>
                    <div className='disabledUserBanner hide'>
                        <div className='btn btnDarkAccent btnStatic'>
                            <div>
                                {globalize.translate('HeaderThisUserIsCurrentlyDisabled')}
                            </div>
                            <div style={{ marginTop: 5 }}>
                                {globalize.translate('MessageReenableUser')}
                            </div>
                        </div>
                    </div>
                    <div id='fldUserName' className='inputContainer'>
                        <Input
                            type='text'
                            id='txtUserName'
                            label={globalize.translate('LabelName')}
                            required
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
                    <CheckBoxElement
                        labelClassName='checkboxContainer'
                        className='chkEnableCollectionManagement'
                        title='AllowCollectionManagement'
                    />
                    <CheckBoxElement
                        labelClassName='checkboxContainer'
                        className='chkEnableSubtitleManagement'
                        title='AllowSubtitleManagement'
                    />
                    <div id='featureAccessFields' className='verticalSection'>
                        <h2 className='paperListLabel'>
                            {globalize.translate('HeaderFeatureAccess')}
                        </h2>
                        <div className='checkboxList paperList' style={{ padding: '.5em 1em' }}>
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
                        <div className='checkboxList paperList' style={{ padding: '.5em 1em' }}>
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
                            <Input
                                type='number'
                                id='txtRemoteClientBitrateLimit'
                                label={globalize.translate('LabelRemoteClientBitrateLimit')}
                                inputMode='decimal'
                                pattern='[0-9]*(.[0-9]+)?'
                                min='0'
                                step='.25'
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
                        <h2 className='checkboxListLabel' style={{ marginBottom: '1em' }}>
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
                        <div className='checkboxList paperList' style={{ padding: '.5em 1em' }}>
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
                            <Input
                                type='number'
                                id='txtLoginAttemptsBeforeLockout'
                                label={globalize.translate('LabelUserLoginAttemptsBeforeLockout')}
                                min={-1} step={1}
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
                            <Input
                                type='number'
                                id='txtMaxActiveSessions'
                                label={globalize.translate('LabelUserMaxActiveSessions')}
                                min={0} step={1}
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
                    <div className='verticalSection'>
                        <div className='inputContainer' id='fldMaxActiveVideoStreams'>
                            <Input
                                type='number'
                                id='txtMaxActiveVideoStreams'
                                label={globalize.translate('LabelUserMaxActiveVideoStreams')}
                                min={0} step={1}
                            />
                            <div className='fieldDescription'>
                                {globalize.translate('OptionMaxActiveVideoStreams')}
                            </div>
                            <div className='fieldDescription'>
                                {globalize.translate('OptionMaxActiveVideoStreamsHelp')}
                            </div>
                        </div>
                    </div>
                    <br />
                    <div>
                        <Button
                            type='submit'
                            className='raised button-submit block'
                            title={globalize.translate('Save')}
                        />
                        <Button
                            type='button'
                            id='btnCancel'
                            className='raised button-cancel block'
                            title={globalize.translate('ButtonCancel')}
                        />
                    </div>
                </form>
            </div>
        </Page>

    );
};

export default UserEdit;
