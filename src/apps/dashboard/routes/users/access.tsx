import type { BaseItemDto, DeviceInfoDto, UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import loading from '../../../../components/loading/loading';
import globalize from '../../../../lib/globalize';
import toast from '../../../../components/toast/toast';
import SectionTabs from '../../../../components/dashboard/users/SectionTabs';
import Button from '../../../../elements/emby-button/Button';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import AccessContainer from '../../../../components/dashboard/users/AccessContainer';
import CheckBoxElement from '../../../../elements/CheckBoxElement';
import Page from '../../../../components/Page';

type ItemsArr = {
    Name?: string | null;
    Id?: string | null;
    AppName?: string | null;
    CustomName?: string | null;
    checkedAttribute?: string
};

const UserLibraryAccess = () => {
    const [ searchParams ] = useSearchParams();
    const userId = searchParams.get('userId');
    const [ userName, setUserName ] = useState('');
    const [channelsItems, setChannelsItems] = useState<ItemsArr[]>([]);
    const [mediaFoldersItems, setMediaFoldersItems] = useState<ItemsArr[]>([]);
    const [devicesItems, setDevicesItems] = useState<ItemsArr[]>([]);
    const libraryMenu = useMemo(async () => ((await import('../../../../scripts/libraryMenu')).default), []);

    const element = useRef<HTMLDivElement>(null);

    const triggerChange = (select: HTMLInputElement) => {
        const evt = new Event('change', { bubbles: false, cancelable: true });
        select.dispatchEvent(evt);
    };

    const loadMediaFolders = useCallback((user: UserDto, mediaFolders: BaseItemDto[]) => {
        const page = element.current;

        if (!page) {
            console.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }

        const itemsArr: ItemsArr[] = [];

        for (const folder of mediaFolders) {
            const isChecked = user.Policy?.EnableAllFolders || user.Policy?.EnabledFolders?.indexOf(folder.Id || '') != -1;
            const checkedAttribute = isChecked ? ' checked="checked"' : '';
            itemsArr.push({
                Id: folder.Id,
                Name: folder.Name,
                checkedAttribute: checkedAttribute
            });
        }

        setMediaFoldersItems(itemsArr);

        const chkEnableAllFolders = page.querySelector('.chkEnableAllFolders') as HTMLInputElement;
        chkEnableAllFolders.checked = Boolean(user.Policy?.EnableAllFolders);
        triggerChange(chkEnableAllFolders);
    }, []);

    const loadChannels = useCallback((user: UserDto, channels: BaseItemDto[]) => {
        const page = element.current;

        if (!page) {
            console.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }

        const itemsArr: ItemsArr[] = [];

        for (const folder of channels) {
            const isChecked = user.Policy?.EnableAllChannels || user.Policy?.EnabledChannels?.indexOf(folder.Id || '') != -1;
            const checkedAttribute = isChecked ? ' checked="checked"' : '';
            itemsArr.push({
                Id: folder.Id,
                Name: folder.Name,
                checkedAttribute: checkedAttribute
            });
        }

        setChannelsItems(itemsArr);

        if (channels.length) {
            (page.querySelector('.channelAccessContainer') as HTMLDivElement).classList.remove('hide');
        } else {
            (page.querySelector('.channelAccessContainer') as HTMLDivElement).classList.add('hide');
        }

        const chkEnableAllChannels = page.querySelector('.chkEnableAllChannels') as HTMLInputElement;
        chkEnableAllChannels.checked = Boolean(user.Policy?.EnableAllChannels);
        triggerChange(chkEnableAllChannels);
    }, []);

    const loadDevices = useCallback((user: UserDto, devices: DeviceInfoDto[]) => {
        const page = element.current;

        if (!page) {
            console.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }

        const itemsArr: ItemsArr[] = [];

        for (const device of devices) {
            const isChecked = user.Policy?.EnableAllDevices || user.Policy?.EnabledDevices?.indexOf(device.Id || '') != -1;
            const checkedAttribute = isChecked ? ' checked="checked"' : '';
            itemsArr.push({
                Id: device.Id,
                Name: device.Name,
                AppName: device.AppName,
                CustomName: device.CustomName,
                checkedAttribute: checkedAttribute
            });
        }

        setDevicesItems(itemsArr);

        const chkEnableAllDevices = page.querySelector('.chkEnableAllDevices') as HTMLInputElement;
        chkEnableAllDevices.checked = Boolean(user.Policy?.EnableAllDevices);
        triggerChange(chkEnableAllDevices);

        if (user.Policy?.IsAdministrator) {
            (page.querySelector('.deviceAccessContainer') as HTMLDivElement).classList.add('hide');
        } else {
            (page.querySelector('.deviceAccessContainer') as HTMLDivElement).classList.remove('hide');
        }
    }, []);

    const loadUser = useCallback((user: UserDto, mediaFolders: BaseItemDto[], channels: BaseItemDto[], devices: DeviceInfoDto[]) => {
        setUserName(user.Name || '');
        void libraryMenu.then(menu => menu.setTitle(user.Name));
        loadChannels(user, channels);
        loadMediaFolders(user, mediaFolders);
        loadDevices(user, devices);
        loading.hide();
    }, [loadChannels, loadDevices, loadMediaFolders]);

    const loadData = useCallback(() => {
        loading.show();
        const promise1 = userId ? window.ApiClient.getUser(userId) : Promise.resolve({ Configuration: {} });
        const promise2 = window.ApiClient.getJSON(window.ApiClient.getUrl('Library/MediaFolders', {
            IsHidden: false
        }));
        const promise3 = window.ApiClient.getJSON(window.ApiClient.getUrl('Channels'));
        const promise4 = window.ApiClient.getJSON(window.ApiClient.getUrl('Devices'));
        Promise.all([promise1, promise2, promise3, promise4]).then(function (responses) {
            loadUser(responses[0], responses[1].Items, responses[2].Items, responses[3].Items);
        }).catch(err => {
            console.error('[userlibraryaccess] failed to load data', err);
        });
    }, [loadUser, userId]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }

        loadData();

        const onSubmit = (e: Event) => {
            if (!userId) {
                console.error('[userlibraryaccess] missing user id');
                return;
            }

            loading.show();
            window.ApiClient.getUser(userId).then(function (result) {
                saveUser(result);
            }).catch(err => {
                console.error('[userlibraryaccess] failed to fetch user', err);
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const saveUser = (user: UserDto) => {
            if (!user.Id) {
                throw new Error('Unexpected null user.Id');
            }

            if (!user.Policy) {
                throw new Error('Unexpected null user.Policy');
            }

            user.Policy.EnableAllFolders = (page.querySelector('.chkEnableAllFolders') as HTMLInputElement).checked;
            user.Policy.EnabledFolders = user.Policy.EnableAllFolders ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkFolder'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });
            user.Policy.EnableAllChannels = (page.querySelector('.chkEnableAllChannels') as HTMLInputElement).checked;
            user.Policy.EnabledChannels = user.Policy.EnableAllChannels ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkChannel'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });
            user.Policy.EnableAllDevices = (page.querySelector('.chkEnableAllDevices') as HTMLInputElement).checked;
            user.Policy.EnabledDevices = user.Policy.EnableAllDevices ? [] : Array.prototype.filter.call(page.querySelectorAll('.chkDevice'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });
            user.Policy.BlockedChannels = null;
            user.Policy.BlockedMediaFolders = null;
            window.ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                onSaveComplete();
            }).catch(err => {
                console.error('[userlibraryaccess] failed to update user policy', err);
            });
        };

        const onSaveComplete = () => {
            loading.hide();
            toast(globalize.translate('SettingsSaved'));
        };

        (page.querySelector('.chkEnableAllDevices') as HTMLInputElement).addEventListener('change', function (this: HTMLInputElement) {
            (page.querySelector('.deviceAccessListContainer') as HTMLDivElement).classList.toggle('hide', this.checked);
        });

        (page.querySelector('.chkEnableAllChannels') as HTMLInputElement).addEventListener('change', function (this: HTMLInputElement) {
            (page.querySelector('.channelAccessListContainer') as HTMLDivElement).classList.toggle('hide', this.checked);
        });

        (page.querySelector('.chkEnableAllFolders') as HTMLInputElement).addEventListener('change', function (this: HTMLInputElement) {
            (page.querySelector('.folderAccessListContainer') as HTMLDivElement).classList.toggle('hide', this.checked);
        });

        (page.querySelector('.userLibraryAccessForm') as HTMLFormElement).addEventListener('submit', onSubmit);
    }, [loadData]);

    return (
        <Page
            id='userLibraryAccessPage'
            className='mainAnimatedPage type-interior'
        >
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={userName}
                    />
                </div>
                <SectionTabs activeTab='userlibraryaccess'/>
                <form className='userLibraryAccessForm'>
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
                                itemCheckedAttribute={Item.checkedAttribute}
                            />
                        ))}
                    </AccessContainer>

                    <AccessContainer
                        containerClassName='channelAccessContainer hide'
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
                                itemCheckedAttribute={Item.checkedAttribute}
                            />
                        ))}
                    </AccessContainer>

                    <AccessContainer
                        containerClassName='deviceAccessContainer hide'
                        headerTitle='HeaderDeviceAccess'
                        checkBoxClassName='chkEnableAllDevices'
                        checkBoxTitle='OptionEnableAccessFromAllDevices'
                        listContainerClassName='deviceAccessListContainer'
                        accessClassName='deviceAccess'
                        listTitle='HeaderDevices'
                        description='DeviceAccessHelp'
                    >
                        {devicesItems.map(Item => (
                            <CheckBoxElement
                                key={Item.Id}
                                className='chkDevice'
                                itemId={Item.Id}
                                itemName={Item.CustomName || Item.Name}
                                itemAppName={Item.AppName}
                                itemCheckedAttribute={Item.checkedAttribute}
                            />
                        ))}
                    </AccessContainer>
                    <br />
                    <div>
                        <Button
                            type='submit'
                            className='raised button-submit block'
                            title={globalize.translate('Save')}
                        />
                    </div>
                </form>
            </div>
        </Page>

    );
};

export default UserLibraryAccess;
