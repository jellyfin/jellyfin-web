import React, { FunctionComponent, useEffect, useState, useRef } from 'react';

import Dashboard from '../../scripts/clientUtils';
import globalize from '../../scripts/globalize';
import loading from '../loading/loading';
import toast from '../toast/toast';

import SectionTitleLinkElement from '../DashboardComponent/users/ElementWarpper/SectionTitle/SectionTitleLinkElement';
import InputElement from '../DashboardComponent/users/ElementWarpper/InputElement';
import CheckBoxElement from '../DashboardComponent/users/ElementWarpper/CheckBoxElement';
import FolderAccess from '../DashboardComponent/users/NewUserPage/FolderAccess';
import ChannelAccess from '../DashboardComponent/users/NewUserPage/ChannelAccess';
import ButtonElement from '../DashboardComponent/users/ElementWarpper/ButtonElement';

const NewUserPage: FunctionComponent = () => {
    const [ channels, setChannels ] = useState([]);
    const [ mediaFolders, setMediaFolders ] = useState([]);
    const element = useRef(null);

    useEffect(() => {
        const loadMediaFolders = (mediaFoldersResult) => {
            setMediaFolders(mediaFoldersResult);

            const folderAccess = element?.current?.querySelector('.folderAccess');
            folderAccess.dispatchEvent(new CustomEvent('create'));

            element.current.querySelector('.chkEnableAllFolders').checked = false;
        };

        const loadChannels = (channelsResult) => {
            setChannels(channelsResult);

            const channelAccess = element?.current?.querySelector('.channelAccess');
            channelAccess.dispatchEvent(new CustomEvent('create'));

            if (channelsResult.length) {
                element?.current?.querySelector('.channelAccessContainer').classList.remove('hide');
            } else {
                element?.current?.querySelector('.channelAccessContainer').classList.add('hide');
            }

            element.current.querySelector('.chkEnableAllChannels').checked = false;
        };

        const loadUser = () => {
            element.current.querySelector('#txtUsername').value = '';
            element.current.querySelector('#txtPassword').value = '';
            loading.show();
            const promiseFolders = window.ApiClient.getJSON(window.ApiClient.getUrl('Library/MediaFolders', {
                IsHidden: false
            }));
            const promiseChannels = window.ApiClient.getJSON(window.ApiClient.getUrl('Channels'));
            // eslint-disable-next-line compat/compat
            Promise.all([promiseFolders, promiseChannels]).then(function (responses) {
                loadMediaFolders(responses[0].Items);
                loadChannels(responses[1].Items);
                loading.hide();
            });
        };

        const saveUser = () => {
            const userInput: any = {};
            userInput.Name = element?.current?.querySelector('#txtUsername').value;
            userInput.Password = element?.current?.querySelector('#txtPassword').value;
            window.ApiClient.createUser(userInput).then(function (user) {
                user.Policy.EnableAllFolders = element?.current?.querySelector('.chkEnableAllFolders').checked;
                user.Policy.EnabledFolders = [];

                if (!user.Policy.EnableAllFolders) {
                    user.Policy.EnabledFolders = Array.prototype.filter.call(element?.current?.querySelectorAll('.chkFolder'), function (i) {
                        return i.checked;
                    }).map(function (i) {
                        return i.getAttribute('data-id');
                    });
                }

                user.Policy.EnableAllChannels = element?.current?.querySelector('.chkEnableAllChannels').checked;
                user.Policy.EnabledChannels = [];

                if (!user.Policy.EnableAllChannels) {
                    user.Policy.EnabledChannels = Array.prototype.filter.call(element?.current?.querySelectorAll('.chkChannel'), function (i) {
                        return i.checked;
                    }).map(function (i) {
                        return i.getAttribute('data-id');
                    });
                }

                window.ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                    Dashboard.navigate('useredit.html?userId=' + user.Id);
                });
            }, function () {
                toast(globalize.translate('ErrorDefault'));
                loading.hide();
            });
        };

        const onSubmit = (e) => {
            loading.show();
            saveUser();
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const loadData = () => {
            loadUser();
        };

        loadData();

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

        element?.current?.querySelector('.newUserProfileForm').addEventListener('submit', onSubmit);

        element?.current?.querySelector('.button-cancel').addEventListener('click', function() {
            window.history.back();
        });
    }, []);

    return (
        <div ref={element}>
            <div className='content-primary'>
                <form className='newUserProfileForm'>
                    <div className='verticalSection'>
                        <div className='sectionTitleContainer flex align-items-center'>
                            <h2 className='sectionTitle'>
                                {globalize.translate('ButtonAddUser')}
                            </h2>
                            <SectionTitleLinkElement
                                className='raised button-alt headerHelpButton'
                                title='Help'
                                url='https://docs.jellyfin.org/general/server/users/'
                            />
                        </div>
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
                    </div>
                    <div className='folderAccessContainer verticalSection'>
                        <h2 className='sectionTitle'>
                            {globalize.translate('HeaderLibraryAccess')}
                        </h2>
                        <div className='checkboxContainer checkboxContainer-withDescription'>
                            <CheckBoxElement
                                type='checkbox'
                                className='chkEnableAllFolders'
                                title='OptionEnableAccessToAllLibraries'
                            />
                            <div className='fieldDescription checkboxFieldDescription'>
                                {globalize.translate('LibraryAccessHelp')}
                            </div>
                        </div>
                        <div className='folderAccessListContainer'>
                            <div className='folderAccess'>
                                <h3 className='checkboxListLabel'>
                                    {globalize.translate('HeaderLibraries')}
                                </h3>
                                <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                                    {mediaFolders.map((folder, index: number)=> (
                                        <FolderAccess
                                            key={index}
                                            Id={folder.Id}
                                            Name={folder.Name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='channelAccessContainer verticalSection verticalSection-extrabottompadding hide'>
                        <h2 className='sectionTitle'>
                            {globalize.translate('HeaderChannelAccess')}
                        </h2>
                        <div className='checkboxContainer checkboxContainer-withDescription'>
                            <CheckBoxElement
                                type='checkbox'
                                className='chkEnableAllChannels'
                                title='OptionEnableAccessToAllChannels'
                            />
                            <div className='fieldDescription checkboxFieldDescription'>
                                {globalize.translate('ChannelAccessHelp')}
                            </div>
                        </div>
                        <div className='channelAccessListContainer'>
                            <div className='channelAccess'>
                                <h3 className='checkboxListLabel'>
                                    {globalize.translate('Channels')}
                                </h3>
                                <div className='checkboxList paperList' style={{padding: '.5em 1em'}}>
                                    {channels.map((folder, index: number)=> (
                                        <ChannelAccess
                                            key={index}
                                            Id={folder.Id}
                                            Name={folder.Name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
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

export default NewUserPage;
