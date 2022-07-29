import React, { FunctionComponent, useCallback, useEffect, useState, useRef } from 'react';

import Dashboard from '../../utils/dashboard';
import globalize from '../../scripts/globalize';
import loading from '../../components/loading/loading';
import LibraryMenu from '../../scripts/libraryMenu';
import confirm from '../../components/confirm/confirm';
import ListItem from '../../components/dashboard/dlna/ListItem';
import '../../components/listview/listview.scss';
import '../../elements/emby-button/emby-button';
import Page from '../../components/Page';
import SectionTitleContainer from '../../elements/SectionTitleContainer';
import { DeviceProfileInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';

const DlnaProfiles: FunctionComponent = () => {
    const [ profiles, setProfiles ] = useState<DeviceProfileInfo[]>([]);
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
    const renderUserProfiles = (p: { Type?: string; }) => {
        return p.Type == 'User';
    };

    const renderSystemProfiles = (p: { Type?: string; }) => {
        return p.Type == 'System';
    };

    const loadProfiles = useCallback(() => {
        loading.show();
        window.ApiClient.getJSON(window.ApiClient.getUrl('Dlna/ProfileInfos')).then(function (result) {
            setProfiles(result);
            loading.hide();
        });
    }, []);

    const deleteProfile = useCallback((id) => {
        confirm(
            globalize.translate('MessageConfirmProfileDeletion'),
            globalize.translate('HeaderConfirmProfileDeletion')
        ).then(function () {
            loading.show();
            window.ApiClient.ajax({
                type: 'DELETE',
                url: window.ApiClient.getUrl('Dlna/Profiles/' + id)
            }).then(function () {
                loading.hide();
                loadProfiles();
            });
        });
    }, [loadProfiles]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        LibraryMenu.setTabs('dlna', 1, getTabs);
        loadProfiles();

        (page.querySelector('#btnAddProfiles') as HTMLButtonElement).addEventListener('click', function() {
            Dashboard.navigate('dlnaprofile.html');
        });
    }, [loadProfiles]);

    return (
        <Page
            id='dlnaProfilesPage'
            className='mainAnimatedPage type-interior dlnaPage withTabs'
        >
            <div ref={element} className='content-primary'>
                <div className='readOnlyContent'>
                    <div className='verticalSection verticalSection-extrabottompadding'>
                        <SectionTitleContainer
                            title={globalize.translate('HeaderCustomDlnaProfiles')}
                            isBtnVisible={true}
                            btnId='btnAddProfiles'
                            btnClassName='fab submit sectionTitleButton'
                            btnTitle='ButtonAddProfiles'
                            btnIcon='add'
                            isLinkVisible={false}
                        />
                        <p>{globalize.translate('CustomDlnaProfilesHelp')}</p>
                        <div className='customProfiles'>
                            <div className='paperList'>
                                {profiles.filter(renderUserProfiles).map(profile => {
                                    return <ListItem key={profile.Id} profile={profile} deleteProfile={deleteProfile} />;
                                })}
                            </div>
                        </div>
                    </div>

                    <div className='verticalSection'>
                        <SectionTitleContainer
                            title={globalize.translate('HeaderSystemDlnaProfiles')}
                            isLinkVisible={false}
                        />
                        <p>{globalize.translate('SystemDlnaProfilesHelp')}</p>
                        <div className='systemProfiles'>
                            {<div className='paperList'>
                                {profiles.filter(renderSystemProfiles).map(profile => {
                                    return <ListItem key={profile.Id} profile={profile} deleteProfile={deleteProfile} />;
                                })}
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        </Page>
    );
};

export default DlnaProfiles;
