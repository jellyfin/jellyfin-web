import AccountCircle from '@mui/icons-material/AccountCircle';
import AppSettingsAlt from '@mui/icons-material/AppSettingsAlt';
import Close from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Download from '@mui/icons-material/Download';
import Edit from '@mui/icons-material/Edit';
import Logout from '@mui/icons-material/Logout';
import PhonelinkLock from '@mui/icons-material/PhonelinkLock';
import Settings from '@mui/icons-material/Settings';
import Storage from '@mui/icons-material/Storage';
import Divider from '@mui/joy/Divider';
import Menu from '@mui/joy/Menu';
import MenuItem from '@mui/joy/MenuItem';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import React, { FC, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { safeAppHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import { useApi } from 'hooks/useApi';
import { useQuickConnectEnabled } from 'hooks/useQuickConnect';
import globalize from 'lib/globalize';
import shell from 'scripts/shell';
import Dashboard from 'utils/dashboard';

export const ID = 'app-user-menu';

interface AppUserMenuProps {
    open: boolean;
    anchorEl: HTMLElement | null;
    onMenuClose: () => void
}

const AppUserMenu: FC<AppUserMenuProps> = ({
    anchorEl,
    open,
    onMenuClose
}) => {
    const { user } = useApi();
    const { data: isQuickConnectEnabled } = useQuickConnectEnabled();

    const onDownloadManagerClick = useCallback(() => {
        shell.openDownloadManager();
        onMenuClose();
    }, [ onMenuClose ]);

    const onClientSettingsClick = useCallback(() => {
        shell.openClientSettings();
        onMenuClose();
    }, [ onMenuClose ]);

    const onExitAppClick = useCallback(() => {
        safeAppHost.exit();
        onMenuClose();
    }, [ onMenuClose ]);

    const onLogoutClick = useCallback(() => {
        Dashboard.logout();
        onMenuClose();
    }, [ onMenuClose ]);

    const onSelectServerClick = useCallback(() => {
        Dashboard.selectServer();
        onMenuClose();
    }, [ onMenuClose ]);

    return (
        <Menu
            anchorEl={anchorEl}
            id={ID}
            open={open}
            onClose={onMenuClose}
            placement="bottom-end"
            sx={{ minWidth: 200, zIndex: 1300 }}
        >
            <MenuItem
                component={Link}
                to={`/userprofile?userId=${user?.Id}`}
                onClick={onMenuClose}
            >
                <ListItemDecorator>
                    <AccountCircle />
                </ListItemDecorator>
                {globalize.translate('Profile')}
            </MenuItem>
            <MenuItem
                component={Link}
                to='/mypreferencesmenu'
                onClick={onMenuClose}
            >
                <ListItemDecorator>
                    <Settings />
                </ListItemDecorator>
                {globalize.translate('Settings')}
            </MenuItem>

            {(safeAppHost.supports(AppFeature.DownloadManagement) || safeAppHost.supports(AppFeature.ClientSettings)) && (
                <Divider />
            )}

            {safeAppHost.supports(AppFeature.DownloadManagement) && (
                <MenuItem
                    onClick={onDownloadManagerClick}
                >
                    <ListItemDecorator>
                        <Download />
                    </ListItemDecorator>
                    {globalize.translate('DownloadManager')}
                </MenuItem>
            )}

            {safeAppHost.supports(AppFeature.ClientSettings) && (
                <MenuItem
                    onClick={onClientSettingsClick}
                >
                    <ListItemDecorator>
                        <AppSettingsAlt />
                    </ListItemDecorator>
                    {globalize.translate('ClientSettings')}
                </MenuItem>
            )}

            {/* ADMIN LINKS */}
            {user?.Policy?.IsAdministrator && (
                <>
                    <Divider />
                    <MenuItem
                        component={Link}
                        to='/dashboard'
                        onClick={onMenuClose}
                    >
                        <ListItemDecorator>
                            <DashboardIcon />
                        </ListItemDecorator>
                        {globalize.translate('TabDashboard')}
                    </MenuItem>
                    <MenuItem
                        component={Link}
                        to='/metadata'
                        onClick={onMenuClose}
                    >
                        <ListItemDecorator>
                            <Edit />
                        </ListItemDecorator>
                        {globalize.translate('MetadataManager')}
                    </MenuItem>
                </>
            )}

            <Divider />
            {isQuickConnectEnabled && (
                <MenuItem
                    component={Link}
                    to='/quickconnect'
                    onClick={onMenuClose}
                >
                    <ListItemDecorator>
                        <PhonelinkLock />
                    </ListItemDecorator>
                    {globalize.translate('QuickConnect')}
                </MenuItem>
            )}

            {safeAppHost.supports(AppFeature.MultiServer) && (
                <MenuItem
                    onClick={onSelectServerClick}
                >
                    <ListItemDecorator>
                        <Storage />
                    </ListItemDecorator>
                    {globalize.translate('SelectServer')}
                </MenuItem>
            )}

            <MenuItem
                onClick={onLogoutClick}
            >
                <ListItemDecorator>
                    <Logout />
                </ListItemDecorator>
                {globalize.translate('ButtonSignOut')}
            </MenuItem>

            {safeAppHost.supports(AppFeature.ExitMenu) && (
                <>
                    <Divider />
                    <MenuItem
                        onClick={onExitAppClick}
                    >
                        <ListItemDecorator>
                            <Close />
                        </ListItemDecorator>
                        {globalize.translate('ButtonExitApp')}
                    </MenuItem>
                </>
            )}
        </Menu>
    );
};

export default AppUserMenu;