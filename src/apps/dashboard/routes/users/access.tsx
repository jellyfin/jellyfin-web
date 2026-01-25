/**
 * @deprecated This file uses legacy DOM manipulation patterns.
 *
 * Migration:
 * - Replace querySelector with React state + controlled components
 * - Replace form event listeners with onSubmit/onChange handlers
 * - Replace setTitle with React state or document.title
 * - Use TanStack Forms + Zod for form validation
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import type { BaseItemDto, DeviceInfoDto, UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'hooks/useSearchParams';
import escapeHTML from 'escape-html';

import loading from '../../../../components/loading/loading';
import globalize from '../../../../lib/globalize';
import SectionTabs from '../../../../components/dashboard/users/SectionTabs';
import Button from '../../../../elements/emby-button/Button';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import AccessContainer from '../../../../components/dashboard/users/AccessContainer';
import CheckBoxElement from '../../../../elements/CheckBoxElement';
import Page from '../../../../components/Page';
import Toast from 'apps/dashboard/components/Toast';
import { logger } from 'utils/logger';

interface ItemsArr {
    Name?: string | null;
    Id?: string | null;
    AppName?: string | null;
    CustomName?: string | null;
    checkedAttribute?: string;
}

const UserLibraryAccess = () => {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const [isSettingsSavedToastOpen, setIsSettingsSavedToastOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [channelsItems, setChannelsItems] = useState<ItemsArr[]>([]);
    const [mediaFoldersItems, setMediaFoldersItems] = useState<ItemsArr[]>([]);
    const [devicesItems, setDevicesItems] = useState<ItemsArr[]>([]);
    const libraryMenuPromise = useRef(import('../../../../scripts/libraryMenu'));

    const element = useRef<HTMLDivElement>(null);

    const handleToastClose = useCallback(() => {
        setIsSettingsSavedToastOpen(false);
    }, []);

    const triggerChange = (select: HTMLInputElement) => {
        const evt = new Event('change', { bubbles: false, cancelable: true });
        select.dispatchEvent(evt);
    };

    const loadMediaFolders = useCallback((user: UserDto, mediaFolders: BaseItemDto[]) => {
        const page = element.current;

        if (!page) {
            logger.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }

        const itemsArr: ItemsArr[] = [];

        for (const folder of mediaFolders) {
            const isChecked =
                user.Policy?.EnableAllFolders || user.Policy?.EnabledFolders?.indexOf(folder.Id || '') != -1;
            const checkedAttribute = isChecked ? ' checked="checked"' : '';
            itemsArr.push({
                Id: folder.Id,
                Name: folder.Name,
                checkedAttribute: checkedAttribute
            });
        }

        setMediaFoldersItems(itemsArr);

        const chkEnableAllFolders = page.querySelector('.chkEnableAllFolders') as HTMLInputElement | null;
        if (chkEnableAllFolders) {
            chkEnableAllFolders.checked = Boolean(user.Policy?.EnableAllFolders);
            triggerChange(chkEnableAllFolders);
        }
    }, []);

    const loadChannels = useCallback((user: UserDto, channels: BaseItemDto[]) => {
        const page = element.current;

        if (!page) {
            logger.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }

        const itemsArr: ItemsArr[] = [];

        for (const folder of channels) {
            const isChecked =
                user.Policy?.EnableAllChannels || user.Policy?.EnabledChannels?.indexOf(folder.Id || '') != -1;
            const checkedAttribute = isChecked ? ' checked="checked"' : '';
            itemsArr.push({
                Id: folder.Id,
                Name: folder.Name,
                checkedAttribute: checkedAttribute
            });
        }

        setChannelsItems(itemsArr);

        if (channels.length) {
            page.querySelector('.channelAccessContainer')!.classList.remove('hide');
        } else {
            page.querySelector('.channelAccessContainer')!.classList.add('hide');
        }

        const chkEnableAllChannels = page.querySelector('.chkEnableAllChannels') as HTMLInputElement | null;
        if (chkEnableAllChannels) {
            chkEnableAllChannels.checked = Boolean(user.Policy?.EnableAllChannels);
            triggerChange(chkEnableAllChannels);
        }
    }, []);

    const loadDevices = useCallback((user: UserDto, devices: DeviceInfoDto[]) => {
        const page = element.current;

        if (!page) {
            logger.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }

        const itemsArr: ItemsArr[] = [];

        for (const device of devices) {
            const isChecked =
                user.Policy?.EnableAllDevices || user.Policy?.EnabledDevices?.indexOf(device.Id || '') != -1;
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

        const chkEnableAllDevices = page.querySelector('.chkEnableAllDevices') as HTMLInputElement | null;
        if (chkEnableAllDevices) {
            chkEnableAllDevices.checked = Boolean(user.Policy?.EnableAllDevices);
            triggerChange(chkEnableAllDevices);
        }

        if (user.Policy?.IsAdministrator) {
            page.querySelector('.deviceAccessContainer')!.classList.add('hide');
        } else {
            page.querySelector('.deviceAccessContainer')!.classList.remove('hide');
        }
    }, []);

    const loadUser = useCallback(
        (user: UserDto, mediaFolders: BaseItemDto[], channels: BaseItemDto[], devices: DeviceInfoDto[]) => {
            setUserName(user.Name || '');
            void libraryMenuPromise.current.then((menu: any) => menu.default.setTitle(user.Name));
            loadChannels(user, channels);
            loadMediaFolders(user, mediaFolders);
            loadDevices(user, devices);
            loading.hide();
        },
        [loadChannels, loadDevices, loadMediaFolders]
    );

    const loadData = useCallback(() => {
        loading.show();
        const promise1 = userId ? window.ApiClient.getUser(userId) : Promise.resolve({ Configuration: {} });
        const promise2 = window.ApiClient.getJSON(
            window.ApiClient.getUrl('Library/MediaFolders', {
                IsHidden: false
            })
        );
        const promise3 = window.ApiClient.getJSON(window.ApiClient.getUrl('Channels'));
        const promise4 = window.ApiClient.getJSON(window.ApiClient.getUrl('Devices'));
        Promise.all([promise1, promise2, promise3, promise4])
            .then(responses => {
                loadUser(responses[0], responses[1].Items, responses[2].Items, responses[3].Items);
            })
            .catch((err: any) => {
                logger.error('[userlibraryaccess] failed to load data', { error: err });
            });
    }, [loadUser, userId]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            logger.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }

        loadData();

        const onSubmit = (e: Event) => {
            if (!userId) {
                logger.error('[userlibraryaccess] missing user id');
                return;
            }

            loading.show();
            window.ApiClient.getUser(userId)
                .then((result: UserDto) => {
                    saveUser(result);
                })
                .catch((err: any) => {
                    logger.error('[userlibraryaccess] failed to fetch user', { error: err });
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

            const chkEnableAllFolders = page.querySelector('.chkEnableAllFolders') as HTMLInputElement | null;
            user.Policy.EnableAllFolders = chkEnableAllFolders?.checked ?? false;
            user.Policy.EnabledFolders = user.Policy.EnableAllFolders
                ? []
                : Array.prototype.filter
                      .call(page.querySelectorAll('.chkFolder'), (c: Element) => {
                          return (c as HTMLInputElement).checked;
                      })
                      .map((c: Element) => {
                          return c.getAttribute('data-id');
                      })
                      .filter((id): id is string => id !== null);
            const chkEnableAllChannels = page.querySelector('.chkEnableAllChannels') as HTMLInputElement | null;
            user.Policy.EnableAllChannels = chkEnableAllChannels?.checked ?? false;
            user.Policy.EnabledChannels = user.Policy.EnableAllChannels
                ? []
                : Array.prototype.filter
                      .call(page.querySelectorAll('.chkChannel'), (c: Element) => {
                          return (c as HTMLInputElement).checked;
                      })
                      .map((c: Element) => {
                          return c.getAttribute('data-id');
                      })
                      .filter((id): id is string => id !== null);
            const chkEnableAllDevices = page.querySelector('.chkEnableAllDevices') as HTMLInputElement | null;
            user.Policy.EnableAllDevices = chkEnableAllDevices?.checked ?? false;
            user.Policy.EnabledDevices = user.Policy.EnableAllDevices
                ? []
                : Array.prototype.filter
                      .call(page.querySelectorAll('.chkDevice'), (c: Element) => {
                          return (c as HTMLInputElement).checked;
                      })
                      .map((c: Element) => {
                          return c.getAttribute('data-id');
                      })
                      .filter((id): id is string => id !== null);
            user.Policy.BlockedChannels = null;
            user.Policy.BlockedMediaFolders = null;
            window.ApiClient.updateUserPolicy(user.Id, user.Policy)
                .then(() => {
                    onSaveComplete();
                })
                .catch((err: any) => {
                    logger.error('[userlibraryaccess] failed to update user policy', { error: err });
                });
        };

        const onSaveComplete = () => {
            loading.hide();
            setIsSettingsSavedToastOpen(true);
        };

        page.querySelector('.chkEnableAllDevices')!.addEventListener('change', function (this: HTMLInputElement) {
            page.querySelector('.deviceAccessListContainer')!.classList.toggle('hide', this.checked);
        });

        page.querySelector('.chkEnableAllChannels')!.addEventListener('change', function (this: HTMLInputElement) {
            page.querySelector('.channelAccessListContainer')!.classList.toggle('hide', this.checked);
        });

        page.querySelector('.chkEnableAllFolders')!.addEventListener('change', function (this: HTMLInputElement) {
            page.querySelector('.folderAccessListContainer')!.classList.toggle('hide', this.checked);
        });

        page.querySelector('.userLibraryAccessForm')!.addEventListener('submit', onSubmit);
    }, [loadData]);

    return (
        <Page id="userLibraryAccessPage" className="mainAnimatedPage type-interior">
            <Toast
                open={isSettingsSavedToastOpen}
                onClose={handleToastClose}
                message={globalize.translate('SettingsSaved')}
            />
            <div ref={element} className="content-primary">
                <div className="verticalSection">
                    <SectionTitleContainer title={userName} />
                </div>
                <SectionTabs activeTab="userlibraryaccess" />
                <form className="userLibraryAccessForm">
                    <AccessContainer
                        containerClassName="folderAccessContainer"
                        headerTitle="HeaderLibraryAccess"
                        checkBoxClassName="chkEnableAllFolders"
                        checkBoxTitle="OptionEnableAccessToAllLibraries"
                        listContainerClassName="folderAccessListContainer"
                        accessClassName="folderAccess"
                        listTitle="HeaderLibraries"
                        description="LibraryAccessHelp"
                    >
                        {mediaFoldersItems.map(Item => (
                            <CheckBoxElement
                                key={Item.Id}
                                className="chkFolder"
                                itemId={Item.Id}
                                itemName={Item.Name}
                                itemCheckedAttribute={Item.checkedAttribute}
                            />
                        ))}
                    </AccessContainer>

                    <AccessContainer
                        containerClassName="channelAccessContainer hide"
                        headerTitle="HeaderChannelAccess"
                        checkBoxClassName="chkEnableAllChannels"
                        checkBoxTitle="OptionEnableAccessToAllChannels"
                        listContainerClassName="channelAccessListContainer"
                        accessClassName="channelAccess"
                        listTitle="Channels"
                        description="ChannelAccessHelp"
                    >
                        {channelsItems.map(Item => (
                            <CheckBoxElement
                                key={Item.Id}
                                className="chkChannel"
                                itemId={Item.Id}
                                itemName={Item.Name}
                                itemCheckedAttribute={Item.checkedAttribute}
                            />
                        ))}
                    </AccessContainer>

                    <AccessContainer
                        containerClassName="deviceAccessContainer hide"
                        headerTitle="HeaderDeviceAccess"
                        checkBoxClassName="chkEnableAllDevices"
                        checkBoxTitle="OptionEnableAccessFromAllDevices"
                        listContainerClassName="deviceAccessListContainer"
                        accessClassName="deviceAccess"
                        listTitle="HeaderDevices"
                        description="DeviceAccessHelp"
                    >
                        {devicesItems.map(Item => (
                            <CheckBoxElement
                                key={Item.Id}
                                className="chkDevice"
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
                            type="submit"
                            className="raised button-submit block"
                            title={globalize.translate('Save')}
                        />
                    </div>
                </form>
            </div>
        </Page>
    );
};

export default UserLibraryAccess;
