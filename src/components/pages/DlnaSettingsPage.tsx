import React, { FunctionComponent, useCallback, useEffect, useState, useRef } from 'react';
import { UserDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import Dashboard from '../../utils/dashboard';
import globalize from '../../scripts/globalize';
import loading from '../loading/loading';
import SectionTitleContainer from '../dashboard/elements/SectionTitleContainer';
import LibraryMenu from '../../scripts/libraryMenu';
import CheckBoxElement from '../dashboard/elements/CheckBoxElement';
import InputElement from '../dashboard/elements/InputElement';
import ButtonElement from '../dashboard/elements/ButtonElement';
import '../../components/listview/listview.scss';
import '../../elements/emby-button/emby-button';
import escapeHTML from 'escape-html';
import SelectElement from '../dashboard/elements/SelectElement';

const DlnaSettingsPage: FunctionComponent = () => {
    const [ users, setUsers ] = useState<UserDto[]>([]);
    const element = useRef<HTMLDivElement>(null);

    const getTabs = () => {
        return [{
            href: '#/dlnasettings.html',
            name: globalize.translate('Settings')
        }, {
            href: '#/dlnaprofiles.html',
            name: globalize.translate('TabProfiles')
        }];
    };

    const loadPage = useCallback((config, usersresult) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        (page.querySelector('.chkEnablePlayTo') as HTMLInputElement).checked = config.EnablePlayTo;
        (page.querySelector('.chkEnableDlnaDebugLogging') as HTMLInputElement).checked = config.EnableDebugLog;
        (page.querySelector('#txtClientDiscoveryInterval') as HTMLInputElement).value = config.ClientDiscoveryIntervalSeconds;
        (page.querySelector('.chkEnableServer') as HTMLInputElement).checked = config.EnableServer;
        (page.querySelector('.chkBlastAliveMessages') as HTMLInputElement).checked = config.BlastAliveMessages;
        (page.querySelector('#txtBlastInterval') as HTMLInputElement).value = config.BlastAliveMessageIntervalSeconds;
        setUsers(usersresult);
        (page.querySelector('#selectUser') as HTMLSelectElement).value = config.DefaultUserId || '';
        loading.hide();
    }, []);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        LibraryMenu.setTabs('dlna', 0, getTabs);
        loading.show();
        const promise1 = window.ApiClient.getNamedConfiguration('dlna');
        const promise2 = window.ApiClient.getUsers();
        Promise.all([promise1, promise2]).then(function (responses) {
            loadPage(responses[0], responses[1]);
        });

        const onSubmit = (e: Event) => {
            loading.show();
            window.ApiClient.getNamedConfiguration('dlna').then(function (config) {
                config.EnablePlayTo = (page.querySelector('.chkEnablePlayTo') as HTMLInputElement).checked;
                config.EnableDebugLog = (page.querySelector('.chkEnableDlnaDebugLogging') as HTMLInputElement).checked;
                config.ClientDiscoveryIntervalSeconds = (page.querySelector('#txtClientDiscoveryInterval') as HTMLInputElement).value;
                config.EnableServer = (page.querySelector('.chkEnableServer') as HTMLInputElement).matches(':checked');
                config.BlastAliveMessages = (page.querySelector('.chkBlastAliveMessages') as HTMLInputElement).matches(':checked');
                config.BlastAliveMessageIntervalSeconds = (page.querySelector('#txtBlastInterval') as HTMLInputElement).value;
                config.DefaultUserId = (page.querySelector('#selectUser') as HTMLSelectElement).value;
                window.ApiClient.updateNamedConfiguration('dlna', config).then(Dashboard.processServerConfigurationUpdateResult);
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        (page.querySelector('.dlnaSettingsForm') as HTMLFormElement).addEventListener('submit', onSubmit);
    }, [loadPage]);

    const optionUser = () => {
        let content = '';
        content += '<option value=\'\'></option>';
        for (const user of users) {
            content += `<option value='${user.Id}'>${escapeHTML(user.Name)}</option>`;
        }
        return content;
    };

    return (
        <div ref={element} className='content-primary'>

            <div className='verticalSection'>
                <SectionTitleContainer
                    title={globalize.translate('Settings')}
                    url='https://docs.jellyfin.org/general/networking/dlna.html'
                />
            </div>
            <form className='dlnaSettingsForm'>
                <div className='checkboxContainer checkboxContainer-withDescription'>
                    <CheckBoxElement
                        className='chkEnablePlayTo'
                        title='LabelEnableDlnaPlayTo'
                    />
                    <div className='fieldDescription checkboxFieldDescription'>
                        {globalize.translate('LabelEnableDlnaPlayToHelp')}
                    </div>
                </div>

                <div className='checkboxContainer checkboxContainer-withDescription'>
                    <CheckBoxElement
                        className='chkEnableDlnaDebugLogging'
                        title='LabelEnableDlnaDebugLogging'
                    />
                    <div className='fieldDescription checkboxFieldDescription'>
                        {globalize.translate('LabelEnableDlnaDebugLoggingHelp')}
                    </div>
                </div>

                <div className='inputContainer'>
                    <InputElement
                        type='number'
                        id='txtClientDiscoveryInterval'
                        label='LabelEnableDlnaClientDiscoveryInterval'
                        options={'min="1" max="300"'}
                    />
                    <div className='fieldDescription'>
                        {globalize.translate('LabelEnableDlnaClientDiscoveryIntervalHelp')}
                    </div>
                </div>

                <div className='checkboxContainer checkboxContainer-withDescription'>
                    <CheckBoxElement
                        className='chkEnableServer'
                        title='LabelEnableDlnaServer'
                    />
                    <div className='fieldDescription checkboxFieldDescription'>
                        {globalize.translate('LabelEnableDlnaServerHelp')}
                    </div>
                </div>

                <div className='checkboxContainer checkboxContainer-withDescription'>
                    <CheckBoxElement
                        className='chkBlastAliveMessages'
                        title='LabelEnableBlastAliveMessages'
                    />
                    <div className='fieldDescription checkboxFieldDescription'>
                        {globalize.translate('LabelEnableBlastAliveMessagesHelp')}
                    </div>
                </div>

                <div className='inputContainer'>
                    <InputElement
                        type='number'
                        id='txtBlastInterval'
                        label='LabelBlastMessageInterval'
                        options={'min="1" max="3600"'}
                    />
                    <div className='fieldDescription'>
                        {globalize.translate('LabelBlastMessageIntervalHelp')}
                    </div>
                </div>

                <div className='selectContainer'>
                    <SelectElement
                        name='selectUser'
                        id='selectUser'
                        label='LabelKodiMetadataUser'
                    >
                        {optionUser()}
                    </SelectElement>
                    <div className='fieldDescription'>
                        {globalize.translate('LabelDefaultUserHelp')}
                    </div>
                </div>

                <div>
                    <ButtonElement
                        type='submit'
                        className='raised button-submit block'
                        title='Save'
                    />
                </div>
            </form>
        </div>
    );
};

export default DlnaSettingsPage;

