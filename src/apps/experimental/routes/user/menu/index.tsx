import React, { type FunctionComponent, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import List from '@mui/material/List';
import ListItemMui from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import PersonIcon from '@mui/icons-material/Person';
import TvIcon from '@mui/icons-material/Tv';
import HomeIcon from '@mui/icons-material/Home';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import Typography from '@mui/material/Typography';

import { appHost } from 'components/apphost';
import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';
import layoutManager from 'components/layoutManager';
import Page from 'components/Page';
import { usePreferencesMenuUser } from './hooks/usePreferencesMenuUser';

const UserPreferencesMenu: FunctionComponent = () => {
    // This page can also be used by admins to change user preferences from the user edit page
    const [urlParams] = useSearchParams();
    const { user: currentUser } = useApi();
    const userId = urlParams.get('userId') || currentUser?.Id;
    const { user } = usePreferencesMenuUser({ userId });

    // Hide the actions if user preferences are being edited for a different user
    const isForDifferentUser = urlParams.get('userId') && urlParams.get('userId') !== currentUser?.Id;

    const onClientSettingsClick = useCallback(() => {
        window.NativeShell?.openClientSettings();
    }, []);

    return (
        <Page
            id='myPreferencesMenuPage'
            className='libraryPage userPreferencesPage noSecondaryNavPage'
            title={globalize.translate('Settings')}
        >
            <div className='padded-left padded-right padded-bottom-page padded-top'>
                <div className='readOnlyContent' style={{ margin: '0 auto' }}>
                    <Typography variant='h2' sx={{ marginY: 2 }}>
                        {user?.Name}
                    </Typography>
                    <List disablePadding>
                        <ListItemMui disablePadding divider>
                            <ListItemButton
                                component='a'
                                href={`#/userprofile.html?userId=${userId}`}
                                disableRipple
                            >
                                <ListItemIcon>
                                    <PersonIcon />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('Profile')} />
                            </ListItemButton>
                        </ListItemMui>
                        <ListItemMui disablePadding divider>
                            <ListItemButton
                                component='a'
                                href={`#/mypreferencesdisplay.html?userId=${userId}`}
                                disableRipple
                            >
                                <ListItemIcon>
                                    <TvIcon />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('Display')} />
                            </ListItemButton>
                        </ListItemMui>
                        <ListItemMui disablePadding divider>
                            <ListItemButton
                                component='a'
                                href={`#/mypreferenceshome.html?userId=${userId}`}
                                disableRipple
                            >
                                <ListItemIcon>
                                    <HomeIcon />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('Home')} />
                            </ListItemButton>
                        </ListItemMui>
                        <ListItemMui disablePadding divider>
                            <ListItemButton
                                component='a'
                                href={`#/mypreferencesplayback.html?userId=${userId}`}
                                disableRipple
                            >
                                <ListItemIcon>
                                    <PlayCircleFilledIcon />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('TitlePlayback')} />
                            </ListItemButton>
                        </ListItemMui>
                        <ListItemMui disablePadding divider>
                            <ListItemButton
                                component='a'
                                href={`#/mypreferencessubtitles.html?userId=${userId}`}
                                disableRipple
                            >
                                <ListItemIcon>
                                    <ClosedCaptionIcon />
                                </ListItemIcon>
                                <ListItemText primary={globalize.translate('Subtitles')} />
                            </ListItemButton>
                        </ListItemMui>
                        {appHost.supports('clientsettings') && (
                            <ListItemMui disablePadding divider>
                                <ListItemButton onClick={onClientSettingsClick} disableRipple>
                                    <ListItemIcon>
                                        <DevicesOtherIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={globalize.translate('ClientSettings')} />
                                </ListItemButton>
                            </ListItemMui>
                        )}
                        {!layoutManager.mobile && !isForDifferentUser && (
                            <ListItemMui disablePadding divider>
                                <ListItemButton
                                    component='a'
                                    href={`#/mypreferencescontrols.html?userId=${userId}`}
                                    disableRipple
                                >
                                    <ListItemIcon>
                                        <KeyboardIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={globalize.translate('Controls')} />
                                </ListItemButton>
                            </ListItemMui>
                        )}
                    </List>
                </div>
            </div>
        </Page>
    );
};

export default UserPreferencesMenu;
