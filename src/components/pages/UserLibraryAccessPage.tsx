import React, { FunctionComponent, useEffect, useState, useRef } from 'react';

import loading from '../loading/loading';
import libraryMenu from '../../scripts/libraryMenu';
import globalize from '../../scripts/globalize';
import toast from '../toast/toast';
import { appRouter } from '../appRouter';

import TabLinkElement from '../DashboardComponent/users/ElementWarpper/TabLinkElement';
import SectionTitleLinkElement from '../DashboardComponent/users/ElementWarpper/SectionTitle/SectionTitleLinkElement';
import CheckBoxElement from '../DashboardComponent/users/ElementWarpper/CheckBoxElement';
import LibraryChannelAccess from '../DashboardComponent/users/UserLibraryAccessPage/LibraryChannelAccess';
import LibraryFolderAccess from '../DashboardComponent/users/UserLibraryAccessPage/LibraryFolderAccess';
import LibraryDeviceAccess from '../DashboardComponent/users/UserLibraryAccessPage/LibraryDeviceAccess';
import ButtonElement from '../DashboardComponent/users/ElementWarpper/ButtonElement';

const UserLibraryAccessPage: FunctionComponent = () => {
    const [ userResult, setUserResult ] = useState([]);
    const [ channelsResult, setChannelsResult ] = useState([]);
    const [ mediaFoldersResult, setMediaFoldersResult ] = useState([]);
    const [ devicesResult, setDevicesResult ] = useState([]);

    const element = useRef(null);

    useEffect(() => {
        const loadData = () => {
            loading.show();
            const userId = appRouter.param('userId');
            // eslint-disable-next-line compat/compat
            const promise1 = userId ? window.ApiClient.getUser(userId) : Promise.resolve({Configuration: {}});
            const promise2 = window.ApiClient.getJSON(window.ApiClient.getUrl('Library/MediaFolders', {
                IsHidden: false
            }));
            const promise3 = window.ApiClient.getJSON(window.ApiClient.getUrl('Channels'));
            const promise4 = window.ApiClient.getJSON(window.ApiClient.getUrl('Devices'));
            // eslint-disable-next-line compat/compat
            Promise.all([promise1, promise2, promise3, promise4]).then(function (responses) {
                loadUser(responses[0], responses[1].Items, responses[2].Items, responses[3].Items);
            });
        };

        loadData();

        const loadUser = (user, mediaFolders, channels, devices) => {
            setUserResult(user);
            libraryMenu.setTitle(user.Name);
            loadChannels(user, channels);
            loadMediaFolders(user, mediaFolders);
            loadDevices(user, devices);
            loading.hide();
        };

        const loadMediaFolders = (user, mediaFolders) => {
            setMediaFoldersResult(mediaFolders);

            const chkEnableAllFolders = element.current.querySelector('.chkEnableAllFolders');
            chkEnableAllFolders.checked = user.Policy.EnableAllFolders;
            triggerChange(chkEnableAllFolders);
        };

        const loadChannels = (user, channels) => {
            setChannelsResult(channels);

            if (channels.length) {
                element?.current?.querySelector('.channelAccessContainer').classList.remove('hide');
            } else {
                element?.current?.querySelector('.channelAccessContainer').classList.add('hide');
            }

            const chkEnableAllChannels = element.current.querySelector('.chkEnableAllChannels');
            chkEnableAllChannels.checked = user.Policy.EnableAllChannels;
            triggerChange(chkEnableAllChannels);
        };

        const loadDevices = (user, devices) => {
            setDevicesResult(devices);

            const chkEnableAllDevices = element.current.querySelector('.chkEnableAllDevices');
            chkEnableAllDevices.checked = user.Policy.EnableAllDevices;
            triggerChange(chkEnableAllDevices);

            if (user.Policy.IsAdministrator) {
                element?.current?.querySelector('.deviceAccessContainer').classList.add('hide');
            } else {
                element?.current?.querySelector('.deviceAccessContainer').classList.remove('hide');
            }
        };

        const triggerChange = (select) => {
            const evt = document.createEvent('HTMLEvents');
            evt.initEvent('change', false, true);
            select.dispatchEvent(evt);
        };

        const onSubmit = (e) => {
            loading.show();
            const userId = appRouter.param('userId');
            window.ApiClient.getUser(userId).then(function (result) {
                saveUser(result);
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const saveUser = (user) => {
            user.Policy.EnableAllFolders = element?.current?.querySelector('.chkEnableAllFolders').checked;
            user.Policy.EnabledFolders = user.Policy.EnableAllFolders ? [] : Array.prototype.filter.call(element?.current?.querySelectorAll('.chkFolder'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });
            user.Policy.EnableAllChannels = element?.current?.querySelector('.chkEnableAllChannels').checked;
            user.Policy.EnabledChannels = user.Policy.EnableAllChannels ? [] : Array.prototype.filter.call(element?.current?.querySelectorAll('.chkChannel'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });
            user.Policy.EnableAllDevices = element?.current?.querySelector('.chkEnableAllDevices').checked;
            user.Policy.EnabledDevices = user.Policy.EnableAllDevices ? [] : Array.prototype.filter.call(element?.current?.querySelectorAll('.chkDevice'), function (c) {
                return c.checked;
            }).map(function (c) {
                return c.getAttribute('data-id');
            });
            user.Policy.BlockedChannels = null;
            user.Policy.BlockedMediaFolders = null;
            window.ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                onSaveComplete();
            });
        };

        const onSaveComplete = () => {
            loading.hide();
            toast(globalize.translate('SettingsSaved'));
        };

        const chkEnableAllDevices = element?.current?.querySelector('.chkEnableAllDevices');
        chkEnableAllDevices.addEventListener('change', function () {
            if (chkEnableAllDevices.checked) {
                element?.current?.querySelector('.deviceAccessListContainer').classList.add('hide');
            } else {
                element?.current?.querySelector('.deviceAccessListContainer').classList.remove('hide');
            }
        });

        const chkEnableAllChannels = element?.current?.querySelector('.chkEnableAllChannels');
        chkEnableAllChannels.addEventListener('change', function () {
            if (chkEnableAllChannels.checked) {
                element?.current?.querySelector('.channelAccessListContainer').classList.add('hide');
            } else {
                element?.current?.querySelector('.channelAccessListContainer').classList.remove('hide');
            }
        });

        const chkEnableAllFolders = element?.current?.querySelector('.chkEnableAllFolders');
        chkEnableAllFolders.addEventListener('change', function () {
            if (chkEnableAllFolders.checked) {
                element?.current?.querySelector('.folderAccessListContainer').classList.add('hide');
            } else {
                element?.current?.querySelector('.folderAccessListContainer').classList.remove('hide');
            }
        });

        element?.current?.querySelector('.userLibraryAccessForm').addEventListener('submit', onSubmit);
    }, []);

    return (
        <div ref={element}>
            <div className='content-primary'>
                <div className='verticalSection'>
                    <div className='sectionTitleContainer flex align-items-center'>
                        <h2 className='sectionTitle username'>
                            {userResult.Name}
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
                    style={{display: 'flex'}}
                >
                    <TabLinkElement
                        className=''
                        tabTitle='Profile'
                        url='useredit.html'
                    />
                    <TabLinkElement
                        className='ui-btn-active'
                        tabTitle='TabAccess'
                        url='userlibraryaccess.html'
                    />
                    <TabLinkElement
                        className=''
                        tabTitle='TabParentalControl'
                        url='userparentalcontrol.html'
                    />
                    <TabLinkElement
                        className=''
                        tabTitle='HeaderPassword'
                        url='userpassword.html'
                    />
                </div>
                <form className='userLibraryAccessForm'>
                    <div className='folderAccessContainer'>
                        <h2>{globalize.translate('HeaderLibraryAccess')}</h2>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkEnableAllFolders'
                            title='OptionEnableAccessToAllLibraries'
                        />
                        <div className='folderAccessListContainer'>
                            <div className='folderAccess'>
                                <h3 className='checkboxListLabel'>
                                    {globalize.translate('HeaderLibraries')}
                                </h3>
                                <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                                    {mediaFoldersResult.map((folder, index: number)=> (
                                        <LibraryFolderAccess
                                            key={index}
                                            Id={folder.Id}
                                            Name={folder.Name}
                                            user={userResult}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className='fieldDescription'>
                                {globalize.translate('LibraryAccessHelp')}
                            </div>
                        </div>
                    </div>
                    <div className='channelAccessContainer hide'>
                        <h2>{globalize.translate('HeaderChannelAccess')}</h2>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkEnableAllChannels'
                            title='OptionEnableAccessToAllChannels'
                        />
                        <div className='channelAccessListContainer'>
                            <div className='channelAccess'>
                                <h3 className='checkboxListLabel'>
                                    {globalize.translate('Channels')}
                                </h3>
                                <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                                    {channelsResult.map((folder, index: number)=> (
                                        <LibraryChannelAccess
                                            key={index}
                                            Id={folder.Id}
                                            Name={folder.Name}
                                            user={userResult}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className='fieldDescription'>
                                {globalize.translate('ChannelAccessHelp')}
                            </div>
                        </div>
                    </div>
                    <br />
                    <div className='deviceAccessContainer hide'>
                        <h2>{globalize.translate('HeaderDeviceAccess')}</h2>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkEnableAllDevices'
                            title='OptionEnableAccessFromAllDevices'
                        />
                        <div className='deviceAccessListContainer'>
                            <div className='deviceAccess'>
                                <h3 className='checkboxListLabel'>
                                    {globalize.translate('HeaderDevices')}
                                </h3>
                                <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                                    {devicesResult.map((device, index: number)=> (
                                        <LibraryDeviceAccess
                                            key={index}
                                            Id={device.Id}
                                            Name={device.Name}
                                            AppName={device.AppName}
                                            user={userResult}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className='fieldDescription'>
                                {globalize.translate('DeviceAccessHelp')}
                            </div>
                        </div>
                        <br />
                    </div>
                    <br />
                    <div>
                        <ButtonElement
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserLibraryAccessPage;
