import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { useEffect, useMemo, useState, type FC } from 'react';
import { useSearchParams } from 'react-router-dom';

import { safeAppHost } from 'components/apphost';
import layoutManager from 'components/layoutManager';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { AppFeature } from 'constants/appFeature';
import LinkButton from 'elements/emby-button/LinkButton';
import { useApi } from 'hooks/useApi';
import { useQuickConnectEnabled } from 'hooks/useQuickConnect';
import { useUsers } from 'hooks/useUsers';
import globalize from 'lib/globalize';
import browser from 'scripts/browser';
import Dashboard from 'utils/dashboard';
import shell from 'scripts/shell';
import keyboardNavigation from 'scripts/keyboardNavigation';

const UserSettingsPage: FC = () => {
    const { user: currentUser } = useApi();
    const [ searchParams ] = useSearchParams();
    const {
        data: isQuickConnectEnabled,
        isPending: isQuickConnectEnabledPending
    } = useQuickConnectEnabled();
    const { data: users } = useUsers();
    const [ user, setUser ] = useState<UserDto>();

    const userId = useMemo(() => (
        searchParams.get('userId') || currentUser?.Id
    ), [ currentUser, searchParams ]);
    const isLoggedInUser = useMemo(() => (
        userId && userId === currentUser?.Id
    ), [ currentUser, userId ]);

    useEffect(() => {
        if (userId) {
            if (userId === currentUser?.Id) setUser(currentUser);
            else setUser(users?.find(({ Id }) => userId === Id));
        }
    }, [ currentUser, userId, users ]);

    if (!userId || !user || isQuickConnectEnabledPending) {
        return (
            <Loading />
        );
    }

    // gamepad toggle unavailable on EdgeUWP, and smoothscroll unavailable on non-TV layout
    const isControlsPageEmpty = !keyboardNavigation.canEnableGamepad() && !layoutManager.tv;

    return (
        <Page
            id='myPreferencesMenuPage'
            className='libraryPage userPreferencesPage noSecondaryNavPage mainAnimatedPage'
            title={globalize.translate('Settings')}
            shouldAutoFocus
        >
            <div className='padded-left padded-right padded-bottom-page padded-top'>
                <div
                    className='readOnlyContent'
                    style={{
                        margin: '0 auto'
                    }}
                >
                    <div className='verticalSection verticalSection-extrabottompadding'>
                        <h2
                            className='sectionTitle headerUsername'
                            style={{
                                paddingLeft: '0.25em'
                            }}
                        >
                            {user.Name}
                        </h2>

                        <LinkButton
                            href={`#/userprofile?userId=${userId}`}
                            className='lnkUserProfile listItem-border'
                            style={{
                                display: 'block',
                                margin: 0,
                                padding: 0
                            }}
                        >
                            <div className='listItem'>
                                <span className='material-icons listItemIcon listItemIcon-transparent person' aria-hidden='true' />
                                <div className='listItemBody'>
                                    <div className='listItemBodyText'>
                                        {globalize.translate('Profile')}
                                    </div>
                                </div>
                            </div>
                        </LinkButton>

                        {isQuickConnectEnabled && (
                            <LinkButton
                                href={`#/quickconnect?userId=${userId}`}
                                className='lnkQuickConnectPreferences listItem-border'
                                style={{
                                    display: 'block',
                                    margin: 0,
                                    padding: 0
                                }}
                            >
                                <div className='listItem'>
                                    <span className='material-icons listItemIcon listItemIcon-transparent phonelink_lock' aria-hidden='true' />
                                    <div className='listItemBody'>
                                        <div className='listItemBodyText'>
                                            {globalize.translate('QuickConnect')}
                                        </div>
                                    </div>
                                </div>
                            </LinkButton>
                        )}

                        <LinkButton
                            href={`#/mypreferencesdisplay?userId=${userId}`}
                            className='lnkDisplayPreferences listItem-border'
                            style={{
                                display: 'block',
                                margin: 0,
                                padding: 0
                            }}
                        >
                            <div className='listItem'>
                                <span className='material-icons listItemIcon listItemIcon-transparent tv' aria-hidden='true' />
                                <div className='listItemBody'>
                                    <div className='listItemBodyText'>
                                        {globalize.translate('Display')}
                                    </div>
                                </div>
                            </div>
                        </LinkButton>

                        <LinkButton
                            href={`#/mypreferenceshome?userId=${userId}`}
                            className='lnkHomePreferences listItem-border'
                            style={{
                                display: 'block',
                                margin: 0,
                                padding: 0
                            }}
                        >
                            <div className='listItem'>
                                <span className='material-icons listItemIcon listItemIcon-transparent home' aria-hidden='true' />
                                <div className='listItemBody'>
                                    <div className='listItemBodyText'>
                                        {globalize.translate('Home')}
                                    </div>
                                </div>
                            </div>
                        </LinkButton>

                        <LinkButton
                            href={`#/mypreferencesplayback?userId=${userId}`}
                            className='lnkPlaybackPreferences listItem-border'
                            style={{
                                display: 'block',
                                margin: 0,
                                padding: 0
                            }}
                        >
                            <div className='listItem'>
                                <span className='material-icons listItemIcon listItemIcon-transparent play_circle_filled' aria-hidden='true' />
                                <div className='listItemBody'>
                                    <div className='listItemBodyText'>
                                        {globalize.translate('TitlePlayback')}
                                    </div>
                                </div>
                            </div>
                        </LinkButton>

                        <LinkButton
                            href={`#/mypreferencessubtitles?userId=${userId}`}
                            className='lnkSubtitlePreferences listItem-border'
                            style={{
                                display: 'block',
                                margin: 0,
                                padding: 0
                            }}
                        >
                            <div className='listItem'>
                                <span className='material-icons listItemIcon listItemIcon-transparent closed_caption' aria-hidden='true' />
                                <div className='listItemBody'>
                                    <div className='listItemBodyText'>
                                        {globalize.translate('Subtitles')}
                                    </div>
                                </div>
                            </div>
                        </LinkButton>

                        {safeAppHost.supports(AppFeature.DownloadManagement) && (
                            <LinkButton
                                onClick={shell.openDownloadManager}
                                className='downloadManager listItem-border'
                                style={{
                                    display: 'block',
                                    margin: 0,
                                    padding: 0
                                }}
                            >
                                <div className='listItem'>
                                    <span className='material-icons listItemIcon listItemIcon-transparent download' aria-hidden='true' />
                                    <div className='listItemBody'>
                                        <div className='listItemBodyText'>
                                            {globalize.translate('DownloadManager')}
                                        </div>
                                    </div>
                                </div>
                            </LinkButton>
                        )}

                        {safeAppHost.supports(AppFeature.ClientSettings) && (
                            <LinkButton
                                onClick={shell.openClientSettings}
                                className='clientSettings listItem-border'
                                style={{
                                    display: 'block',
                                    margin: 0,
                                    padding: 0
                                }}
                            >
                                <div className='listItem'>
                                    <span className='material-icons listItemIcon listItemIcon-transparent devices_other' aria-hidden='true' />
                                    <div className='listItemBody'>
                                        <div className='listItemBodyText'>
                                            {globalize.translate('ClientSettings')}
                                        </div>
                                    </div>
                                </div>
                            </LinkButton>
                        )}

                        {isLoggedInUser && !browser.mobile && !isControlsPageEmpty && (
                            <LinkButton
                                href={`#/mypreferencescontrols?userId=${userId}`}
                                className='lnkControlsPreferences listItem-border'
                                style={{
                                    display: 'block',
                                    margin: 0,
                                    padding: 0
                                }}
                            >
                                <div className='listItem'>
                                    <span className='material-icons listItemIcon listItemIcon-transparent keyboard' aria-hidden='true' />
                                    <div className='listItemBody'>
                                        <div className='listItemBodyText'>
                                            {globalize.translate('Controls')}
                                        </div>
                                    </div>
                                </div>
                            </LinkButton>
                        )}
                    </div>

                    {isLoggedInUser && user.Policy?.IsAdministrator && !layoutManager.tv && (
                        <div className='adminSection verticalSection verticalSection-extrabottompadding'>
                            <h2
                                className='sectionTitle headerUsername'
                                style={{
                                    paddingLeft: '0.25em'
                                }}
                            >
                                {globalize.translate('HeaderAdmin')}
                            </h2>

                            <LinkButton
                                href='#/dashboard'
                                className='listItem-border'
                                style={{
                                    display: 'block',
                                    margin: 0,
                                    padding: 0
                                }}
                            >
                                <div className='listItem'>
                                    <span className='material-icons listItemIcon listItemIcon-transparent dashboard' aria-hidden='true' />
                                    <div className='listItemBody'>
                                        <div className='listItemBodyText'>
                                            {globalize.translate('TabDashboard')}
                                        </div>
                                    </div>
                                </div>
                            </LinkButton>

                            <LinkButton
                                href='#/metadata'
                                className='listItem-border'
                                style={{
                                    display: 'block',
                                    margin: 0,
                                    padding: 0
                                }}
                            >
                                <div className='listItem'>
                                    <span className='material-icons listItemIcon listItemIcon-transparent mode_edit' aria-hidden='true' />
                                    <div className='listItemBody'>
                                        <div className='listItemBodyText'>
                                            {globalize.translate('MetadataManager')}
                                        </div>
                                    </div>
                                </div>
                            </LinkButton>
                        </div>
                    )}

                    {isLoggedInUser && (
                        <div className='userSection verticalSection verticalSection-extrabottompadding'>
                            <h2
                                className='sectionTitle headerUsername'
                                style={{
                                    paddingLeft: '0.25em'
                                }}
                            >
                                {globalize.translate('HeaderUser')}
                            </h2>

                            {safeAppHost.supports(AppFeature.MultiServer) && (
                                <LinkButton
                                    onClick={Dashboard.selectServer}
                                    className='selectServer listItem-border'
                                    style={{
                                        display: 'block',
                                        margin: 0,
                                        padding: 0
                                    }}
                                >
                                    <div className='listItem'>
                                        <span className='material-icons listItemIcon listItemIcon-transparent storage' aria-hidden='true' />
                                        <div className='listItemBody'>
                                            <div className='listItemBodyText'>
                                                {globalize.translate('SelectServer')}
                                            </div>
                                        </div>
                                    </div>
                                </LinkButton>
                            )}

                            <LinkButton
                                onClick={Dashboard.logout}
                                className='btnLogout listItem-border'
                                style={{
                                    display: 'block',
                                    margin: 0,
                                    padding: 0
                                }}
                            >
                                <div className='listItem'>
                                    <span className='material-icons listItemIcon listItemIcon-transparent exit_to_app' aria-hidden='true' />
                                    <div className='listItemBody'>
                                        <div className='listItemBodyText'>
                                            {globalize.translate('ButtonSignOut')}
                                        </div>
                                    </div>
                                </div>
                            </LinkButton>

                            {safeAppHost.supports(AppFeature.ExitMenu) && (
                                <LinkButton
                                    onClick={safeAppHost.exit}
                                    className='exitApp listItem-border'
                                    style={{
                                        display: 'block',
                                        margin: 0,
                                        padding: 0
                                    }}
                                >
                                    <div className='listItem'>
                                        <span className='material-icons listItemIcon listItemIcon-transparent close' aria-hidden='true' />
                                        <div className='listItemBody'>
                                            <div className='listItemBodyText'>
                                                {globalize.translate('ButtonExitApp')}
                                            </div>
                                        </div>
                                    </div>
                                </LinkButton>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Page>
    );
};

export default UserSettingsPage;
