import type { AccessSchedule, BaseItemDto, DeviceInfoDto, UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { DynamicDayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/dynamic-day-of-week';
import loading from 'components/loading/loading';
import globalize from 'lib/globalize';
import AccessScheduleList from 'components/dashboard/users/AccessScheduleList';
import accessschedule from 'components/accessSchedule/accessSchedule';
import Button from 'elements/emby-button/Button';
import AccessContainer from 'components/dashboard/users/AccessContainer';
import SectionTitleContainer from 'elements/SectionTitleContainer';
import CheckBoxElement from 'elements/CheckBoxElement';
import Toast from 'apps/dashboard/components/Toast';
import { useApi } from 'hooks/useApi';		

interface AccessProps {
    userId: string;
}

type ItemsArr = {
    Name?: string | null;
    Id?: string | null;
    AppName?: string | null;
    CustomName?: string | null;
    checkedAttribute?: string
};

const Access = ({ userId }: AccessProps) => {
    const { __legacyApiClient__ } = useApi();
    const [ isSettingsSavedToastOpen, setIsSettingsSavedToastOpen ] = useState(false);
    const [channelsItems, setChannelsItems] = useState<ItemsArr[]>([]);
    const [mediaFoldersItems, setMediaFoldersItems] = useState<ItemsArr[]>([]);
    const [devicesItems, setDevicesItems] = useState<ItemsArr[]>([]);
	const [ accessSchedules, setAccessSchedules ] = useState<AccessSchedule[]>([]);
    const libraryMenu = useMemo(async () => ((await import('scripts/libraryMenu')).default), []);

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
		const page = element.current;
		
		if (!page) {
            console.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }
		
        void libraryMenu.then(menu => menu.setTitle(user.Name));
        loadChannels(user, channels);
        loadMediaFolders(user, mediaFolders);
        loadDevices(user, devices);
		
		if (user.Policy?.IsAdministrator) {
            (page.querySelector('.accessScheduleSection') as HTMLDivElement).classList.add('hide');
        } else {
            (page.querySelector('.accessScheduleSection') as HTMLDivElement).classList.remove('hide');
        }
        setAccessSchedules(user.Policy?.AccessSchedules || []);
		
        loading.hide();
    }, [loadChannels, loadDevices, loadMediaFolders]);

	const showSchedulePopup = (schedule: AccessSchedule, index: number) => {
		schedule = schedule || {};
		
			accessschedule.show({schedule: schedule})
			.then(function (updatedSchedule) {
				const schedules = getSchedulesFromPage() || [];

				if (index == -1) {
					index = schedules.length;
				}

				schedules[index] = updatedSchedule;
				setAccessSchedules(schedules);
			})
			.catch(err => {
				console.error('[userparentalcontrol] failed to load access schedule', err);
			});
	};

	const getSchedulesFromPage = () => {
		const page = element.current;
		
		if (!page) {
            console.error('[userlibraryaccess] Unexpected null page reference');
            return;
        }
		
		return Array.prototype.map.call(page.querySelectorAll('.liSchedule'), function (elem) {
			return {
				DayOfWeek: elem.dataset.day,
				StartHour: elem.dataset.start,
				EndHour: elem.dataset.end
			};
		}) as AccessSchedule[];
	};
	
    const loadData = useCallback(() => {
        loading.show();
        if (!__legacyApiClient__) {
            console.error('[userlibraryaccess] __legacyApiClient__ is not available');
            return;
        }
        Promise.all([
            userId ? __legacyApiClient__.getUser(userId) : Promise.resolve({ Configuration: {} }),
            __legacyApiClient__.getJSON(__legacyApiClient__.getUrl('Library/MediaFolders', { IsHidden: false })),
            __legacyApiClient__.getJSON(__legacyApiClient__.getUrl('Channels')),
            __legacyApiClient__.getJSON(__legacyApiClient__.getUrl('Devices'))
        ])
            .then(([user, mediaFolders, channels, devices]) => {
                loadUser(user, mediaFolders.Items, channels.Items, devices.Items);
            })
            .catch(err => {
                console.error('[userlibraryaccess] failed to load data', err);
            });
    }, [__legacyApiClient__, loadUser, userId]);

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
            __legacyApiClient__!.getUser(userId)
                .then(saveUser)
                .catch(err => {
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
			user.Policy.AccessSchedules = getSchedulesFromPage();
			
            __legacyApiClient__!.updateUserPolicy(user.Id, user.Policy)
                .then(onSaveComplete)
                .catch(err => {
                    console.error('[userlibraryaccess] failed to update user policy', err);
                });
        };

        const onSaveComplete = () => {
            loading.hide();
            setIsSettingsSavedToastOpen(true);
        };
		
		// The following is still hacky and should migrate to pure react implementation for callbacks in the future
        const accessSchedulesPopupCallback = function () {
            showSchedulePopup({
                Id: 0,
                UserId: '',
                DayOfWeek: DynamicDayOfWeek.Sunday,
                StartHour: 0,
                EndHour: 0
            }, -1);
        };
        (page.querySelector('#btnAddSchedule') as HTMLButtonElement).addEventListener('click', accessSchedulesPopupCallback);

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
    }, [__legacyApiClient__, loadData]);

    const removeScheduleCallback = useCallback((index: number) => {
        const newSchedules = accessSchedules.filter((_e, i) => i != index);
        setAccessSchedules(newSchedules);
    }, [accessSchedules, setAccessSchedules]);
	
    return (
        <div ref={element}>
            <Toast
                open={isSettingsSavedToastOpen}
                onClose={handleToastClose}
                message={globalize.translate('SettingsSaved')}
            />
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
                            itemName={
                                [
                                    Item.CustomName || Item.Name,
                                    Item.AppName
                                ]
                                    .filter(Boolean)
                                    .join(' - ')
                            }
                            itemCheckedAttribute={Item.checkedAttribute}
                        />
                    ))}
                </AccessContainer>
				
				<div className='accessScheduleSection verticalSection' style={{ marginBottom: '2em' }}>
                    <SectionTitleContainer
                        title={globalize.translate('HeaderAccessSchedule')}
                        isBtnVisible={true}
                        btnId='btnAddSchedule'
                        btnClassName='fab submit sectionTitleButton'
                        btnTitle='Add'
                        btnIcon='add'
                    />
                    <p>{globalize.translate('HeaderAccessScheduleHelp')}</p>
                    <div className='accessScheduleList paperList'>
                        {accessSchedules.map((accessSchedule, index) => {
                            return <AccessScheduleList
                                key={`${accessSchedule.DayOfWeek}${accessSchedule.StartHour}${accessSchedule.EndHour}`}
                                index={index}
                                DayOfWeek={accessSchedule.DayOfWeek}
                                StartHour={accessSchedule.StartHour}
                                EndHour={accessSchedule.EndHour}
                                removeScheduleCallback={removeScheduleCallback}
                            />;
                        })}
                    </div>
                </div>
				
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
    );
};

export default Access;
