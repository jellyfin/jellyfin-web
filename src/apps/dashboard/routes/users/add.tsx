import type { BaseItemDto, CreateUserByName } from '@jellyfin/sdk/lib/generated-client';
import React, { useCallback, useEffect, useState, useRef } from 'react';

import globalize from '../../../../lib/globalize';
import loading from '../../../../components/loading/loading';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import Input from '../../../../elements/emby-input/Input';
import Button from '../../../../elements/emby-button/Button';
import AccessContainer from '../../../../components/dashboard/users/AccessContainer';
import CheckBoxElement from '../../../../elements/CheckBoxElement';
import Page from '../../../../components/Page';
import Toast from 'apps/dashboard/components/Toast';

import { useLibraryMediaFolders } from 'apps/dashboard/features/users/api/useLibraryMediaFolders';
import { useChannels } from 'apps/dashboard/features/users/api/useChannels';
import { useUpdateUserPolicy } from 'apps/dashboard/features/users/api/useUpdateUserPolicy';
import { useCreateUser } from 'apps/dashboard/features/users/api/useCreateUser';
import { useNavigate } from 'react-router-dom';

type ItemsArr = {
    Name?: string | null;
    Id?: string;
};

const UserNew = () => {
    const navigate = useNavigate();
    const [ channelsItems, setChannelsItems ] = useState<ItemsArr[]>([]);
    const [ mediaFoldersItems, setMediaFoldersItems ] = useState<ItemsArr[]>([]);
    const [ isErrorToastOpen, setIsErrorToastOpen ] = useState(false);
    const element = useRef<HTMLDivElement>(null);

    const handleToastClose = useCallback(() => {
        setIsErrorToastOpen(false);
    }, []);
    const { data: mediaFolders, isSuccess: isMediaFoldersSuccess } = useLibraryMediaFolders();
    const { data: channels, isSuccess: isChannelsSuccess } = useChannels();

    const createUser = useCreateUser();
    const updateUserPolicy = useUpdateUserPolicy();

    const getItemsResult = (items: BaseItemDto[]) => {
        return items.map(item =>
            ({
                Id: item.Id,
                Name: item.Name
            })
        );
    };

    const loadMediaFolders = useCallback((result: BaseItemDto[]) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        setMediaFoldersItems(getItemsResult(result));

        const folderAccess = page.querySelector('.folderAccess') as HTMLDivElement;
        folderAccess.dispatchEvent(new CustomEvent('create'));

        (page.querySelector('.chkEnableAllFolders') as HTMLInputElement).checked = false;
    }, []);

    const loadChannels = useCallback((result: BaseItemDto[]) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const channelItems = getItemsResult(result);

        setChannelsItems(channelItems);

        const channelAccess = page.querySelector('.channelAccess') as HTMLDivElement;
        channelAccess.dispatchEvent(new CustomEvent('create'));

        const channelAccessContainer = page.querySelector('.channelAccessContainer') as HTMLDivElement;
        channelItems.length ? channelAccessContainer.classList.remove('hide') : channelAccessContainer.classList.add('hide');

        (page.querySelector('.chkEnableAllChannels') as HTMLInputElement).checked = false;
    }, []);

    const loadUser = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        if (!mediaFolders?.Items) {
            console.error('[add] mediaFolders not available');
            return;
        }
        if (!channels?.Items) {
            console.error('[add] channels not available');
            return;
        }

        loadMediaFolders(mediaFolders?.Items);
        loadChannels(channels?.Items);
        loading.hide();
    }, [loadChannels, loadMediaFolders, mediaFolders, channels]);

    useEffect(() => {
        loading.show();
        if (isMediaFoldersSuccess && isChannelsSuccess) {
            loadUser();
        }
    }, [loadUser, isMediaFoldersSuccess, isChannelsSuccess]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const saveUser = () => {
            const userInput: CreateUserByName = {
                Name: (page.querySelector('#txtUsername') as HTMLInputElement).value,
                Password: (page.querySelector('#txtPassword') as HTMLInputElement).value
            };
            createUser.mutate({ createUserByName: userInput }, {
                onSuccess: (response) => {
                    const user = response.data;

                    if (!user.Id || !user.Policy) {
                        throw new Error('Unexpected null user id or policy');
                    }

                    user.Policy.EnableAllFolders = (page.querySelector('.chkEnableAllFolders') as HTMLInputElement).checked;
                    user.Policy.EnabledFolders = [];

                    if (!user.Policy.EnableAllFolders) {
                        user.Policy.EnabledFolders = Array.prototype.filter.call(page.querySelectorAll('.chkFolder'), function (i) {
                            return i.checked;
                        }).map(function (i) {
                            return i.getAttribute('data-id');
                        });
                    }

                    user.Policy.EnableAllChannels = (page.querySelector('.chkEnableAllChannels') as HTMLInputElement).checked;
                    user.Policy.EnabledChannels = [];

                    if (!user.Policy.EnableAllChannels) {
                        user.Policy.EnabledChannels = Array.prototype.filter.call(page.querySelectorAll('.chkChannel'), function (i) {
                            return i.checked;
                        }).map(function (i) {
                            return i.getAttribute('data-id');
                        });
                    }

                    updateUserPolicy.mutate({
                        userId: user.Id,
                        userPolicy: user.Policy
                    }, {
                        onSuccess: () => {
                            navigate(`/dashboard/users/profile?userId=${user.Id}`);
                        },
                        onError: () => {
                            console.error('[usernew] failed to update user policy');
                            setIsErrorToastOpen(true);
                        }
                    });
                }
            });
        };

        const onSubmit = (e: Event) => {
            loading.show();
            saveUser();
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const enableAllChannelsChange = function (this: HTMLInputElement) {
            const channelAccessListContainer = page.querySelector('.channelAccessListContainer') as HTMLDivElement;
            this.checked ? channelAccessListContainer.classList.add('hide') : channelAccessListContainer.classList.remove('hide');
        };

        const enableAllFoldersChange = function (this: HTMLInputElement) {
            const folderAccessListContainer = page.querySelector('.folderAccessListContainer') as HTMLDivElement;
            this.checked ? folderAccessListContainer.classList.add('hide') : folderAccessListContainer.classList.remove('hide');
        };

        const onCancelClick = () => {
            window.history.back();
        };

        (page.querySelector('.chkEnableAllChannels') as HTMLInputElement).addEventListener('change', enableAllChannelsChange);
        (page.querySelector('.chkEnableAllFolders') as HTMLInputElement).addEventListener('change', enableAllFoldersChange);
        (page.querySelector('.newUserProfileForm') as HTMLFormElement).addEventListener('submit', onSubmit);
        (page.querySelector('#btnCancel') as HTMLButtonElement).addEventListener('click', onCancelClick);

        return () => {
            (page.querySelector('.chkEnableAllChannels') as HTMLInputElement).removeEventListener('change', enableAllChannelsChange);
            (page.querySelector('.chkEnableAllFolders') as HTMLInputElement).removeEventListener('change', enableAllFoldersChange);
            (page.querySelector('.newUserProfileForm') as HTMLFormElement).removeEventListener('submit', onSubmit);
            (page.querySelector('#btnCancel') as HTMLButtonElement).removeEventListener('click', onCancelClick);
        };
    }, [loadUser, createUser, updateUserPolicy, navigate]);

    return (
        <Page
            id='newUserPage'
            className='mainAnimatedPage type-interior'
        >
            <Toast
                open={isErrorToastOpen}
                onClose={handleToastClose}
                message={globalize.translate('ErrorDefault')}
            />
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={globalize.translate('HeaderAddUser')}
                    />
                </div>

                <form className='newUserProfileForm'>
                    <div className='inputContainer'>
                        <Input
                            type='text'
                            id='txtUsername'
                            label={globalize.translate('LabelName')}
                            required
                        />
                    </div>
                    <div className='inputContainer'>
                        <Input
                            type='password'
                            id='txtPassword'
                            label={globalize.translate('LabelPassword')}
                        />
                    </div>
                    <AccessContainer
                        containerClassName='folderAccessContainer'
                        headerTitle='HeaderLibraryAccess'
                        checkBoxClassName='chkEnableAllFolders'
                        checkBoxTitle='OptionEnableAccessToAllLibraries'
                        listContainerClassName='folderAccessListContainer'
                        accessClassName='folderAccess'
                        listTitle='HeaderLibraries'
                        description='LibraryAccessHelp'
                    >
                        {mediaFoldersItems.map(Item => (
                            <CheckBoxElement
                                key={Item.Id}
                                className='chkFolder'
                                itemId={Item.Id}
                                itemName={Item.Name}
                            />
                        ))}
                    </AccessContainer>

                    <AccessContainer
                        containerClassName='channelAccessContainer verticalSection-extrabottompadding hide'
                        headerTitle='HeaderChannelAccess'
                        checkBoxClassName='chkEnableAllChannels'
                        checkBoxTitle='OptionEnableAccessToAllChannels'
                        listContainerClassName='channelAccessListContainer'
                        accessClassName='channelAccess'
                        listTitle='Channels'
                        description='ChannelAccessHelp'
                    >
                        {channelsItems.map(Item => (
                            <CheckBoxElement
                                key={Item.Id}
                                className='chkChannel'
                                itemId={Item.Id}
                                itemName={Item.Name}
                            />
                        ))}
                    </AccessContainer>
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

export default UserNew;
