import React, { FunctionComponent, useCallback, useEffect, useState, useRef } from 'react';

import Dashboard from '../../../../utils/dashboard';
import globalize from '../../../../scripts/globalize';
import loading from '../../../../components/loading/loading';
import toast from '../../../../components/toast/toast';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import InputElement from '../../../../elements/InputElement';
import ButtonElement from '../../../../elements/ButtonElement';
import AccessContainer from '../../../../components/dashboard/users/AccessContainer';
import CheckBoxElement from '../../../../elements/CheckBoxElement';
import Page from '../../../../components/Page';

type userInput = {
    Name?: string;
    Password?: string;
};

type ItemsArr = {
    Name?: string;
    Id?: string;
};

const UserNew: FunctionComponent = () => {
    const [ channelsItems, setChannelsItems ] = useState<ItemsArr[]>([]);
    const [ mediaFoldersItems, setMediaFoldersItems ] = useState<ItemsArr[]>([]);
    const element = useRef<HTMLDivElement>(null);

    const getItemsResult = (items: ItemsArr[]) => {
        return items.map(item =>
            ({
                Id: item.Id,
                Name: item.Name
            })
        );
    };

    const loadMediaFolders = useCallback((result) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const mediaFolders = getItemsResult(result);

        setMediaFoldersItems(mediaFolders);

        const folderAccess = page.querySelector('.folderAccess') as HTMLDivElement;
        folderAccess.dispatchEvent(new CustomEvent('create'));

        (page.querySelector('.chkEnableAllFolders') as HTMLInputElement).checked = false;
    }, []);

    const loadChannels = useCallback((result) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        const channels = getItemsResult(result);

        setChannelsItems(channels);

        const channelAccess = page.querySelector('.channelAccess') as HTMLDivElement;
        channelAccess.dispatchEvent(new CustomEvent('create'));

        const channelAccessContainer = page.querySelector('.channelAccessContainer') as HTMLDivElement;
        channels.length ? channelAccessContainer.classList.remove('hide') : channelAccessContainer.classList.add('hide');

        (page.querySelector('.chkEnableAllChannels') as HTMLInputElement).checked = false;
    }, []);

    const loadUser = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        (page.querySelector('#txtUsername') as HTMLInputElement).value = '';
        (page.querySelector('#txtPassword') as HTMLInputElement).value = '';
        loading.show();
        const promiseFolders = window.ApiClient.getJSON(window.ApiClient.getUrl('Library/MediaFolders', {
            IsHidden: false
        }));
        const promiseChannels = window.ApiClient.getJSON(window.ApiClient.getUrl('Channels'));
        Promise.all([promiseFolders, promiseChannels]).then(function (responses) {
            loadMediaFolders(responses[0].Items);
            loadChannels(responses[1].Items);
            loading.hide();
        }).catch(err => {
            console.error('[usernew] failed to load data', err);
        });
    }, [loadChannels, loadMediaFolders]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        loadUser();

        const saveUser = () => {
            const userInput: userInput = {};
            userInput.Name = (page.querySelector('#txtUsername') as HTMLInputElement).value;
            userInput.Password = (page.querySelector('#txtPassword') as HTMLInputElement).value;
            window.ApiClient.createUser(userInput).then(function (user) {
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

                window.ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                    Dashboard.navigate('/dashboard/users/profile?userId=' + user.Id)
                        .catch(err => {
                            console.error('[usernew] failed to navigate to edit user page', err);
                        });
                }).catch(err => {
                    console.error('[usernew] failed to update user policy', err);
                });
            }, function () {
                toast(globalize.translate('ErrorDefault'));
                loading.hide();
            });
        };

        const onSubmit = (e: Event) => {
            loading.show();
            saveUser();
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        (page.querySelector('.chkEnableAllChannels') as HTMLInputElement).addEventListener('change', function (this: HTMLInputElement) {
            const channelAccessListContainer = page.querySelector('.channelAccessListContainer') as HTMLDivElement;
            this.checked ? channelAccessListContainer.classList.add('hide') : channelAccessListContainer.classList.remove('hide');
        });

        (page.querySelector('.chkEnableAllFolders') as HTMLInputElement).addEventListener('change', function (this: HTMLInputElement) {
            const folderAccessListContainer = page.querySelector('.folderAccessListContainer') as HTMLDivElement;
            this.checked ? folderAccessListContainer.classList.add('hide') : folderAccessListContainer.classList.remove('hide');
        });

        (page.querySelector('.newUserProfileForm') as HTMLFormElement).addEventListener('submit', onSubmit);

        (page.querySelector('#btnCancel') as HTMLButtonElement).addEventListener('click', function() {
            window.history.back();
        });
    }, [loadUser]);

    return (
        <Page
            id='newUserPage'
            className='mainAnimatedPage type-interior'
        >
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={globalize.translate('HeaderAddUser')}
                        url='https://jellyfin.org/docs/general/server/users/'
                    />
                </div>

                <form className='newUserProfileForm'>
                    <div className='inputContainer'>
                        <InputElement
                            type='text'
                            id='txtUsername'
                            label='LabelName'
                            options={'required'}
                        />
                    </div>
                    <div className='inputContainer'>
                        <InputElement
                            type='password'
                            id='txtPassword'
                            label='LabelPassword'
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

export default UserNew;
