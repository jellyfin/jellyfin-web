import {
    Cross1Icon,
    DashboardIcon,
    DownloadIcon,
    ExitIcon,
    GearIcon,
    LockClosedIcon,
    Pencil1Icon,
    PersonIcon,
    ResetIcon,
    StackIcon
} from '@radix-ui/react-icons';
import { Divider } from 'ui-primitives';
import { Menu, MenuTrigger, MenuPortal, MenuContent, MenuItem, MenuItemDecorator } from 'ui-primitives';
import React, { FC, useCallback } from 'react';
import { Link } from '@tanstack/react-router';

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
    onMenuClose: () => void;
}

const AppUserMenu: FC<AppUserMenuProps> = ({ anchorEl, open, onMenuClose }) => {
    const { user } = useApi();
    const { data: isQuickConnectEnabled } = useQuickConnectEnabled();

    const onDownloadManagerClick = useCallback(() => {
        shell.openDownloadManager();
        onMenuClose();
    }, [onMenuClose]);

    const onClientSettingsClick = useCallback(() => {
        shell.openClientSettings();
        onMenuClose();
    }, [onMenuClose]);

    const onExitAppClick = useCallback(() => {
        safeAppHost.exit();
        onMenuClose();
    }, [onMenuClose]);

    const onLogoutClick = useCallback(() => {
        Dashboard.logout();
        onMenuClose();
    }, [onMenuClose]);

    const onSelectServerClick = useCallback(() => {
        Dashboard.selectServer();
        onMenuClose();
    }, [onMenuClose]);

    return (
        <Menu open={open} onOpenChange={open => !open && onMenuClose()}>
            <MenuTrigger>
                <div />
            </MenuTrigger>
            <MenuPortal>
                <MenuContent style={{ minWidth: 200, zIndex: 1300 }}>
                    <MenuItem component={Link} to={`/userprofile?userId=${user?.Id}`} onClick={onMenuClose}>
                        <MenuItemDecorator>
                            <PersonIcon />
                        </MenuItemDecorator>
                        {globalize.translate('Profile')}
                    </MenuItem>
                    <MenuItem component={Link} to="/mypreferencesmenu" onClick={onMenuClose}>
                        <MenuItemDecorator>
                            <GearIcon />
                        </MenuItemDecorator>
                        {globalize.translate('Settings')}
                    </MenuItem>

                    {(safeAppHost.supports(AppFeature.DownloadManagement) ||
                        safeAppHost.supports(AppFeature.ClientSettings)) && <Divider />}

                    {safeAppHost.supports(AppFeature.DownloadManagement) && (
                        <MenuItem onClick={onDownloadManagerClick}>
                            <MenuItemDecorator>
                                <DownloadIcon />
                            </MenuItemDecorator>
                            {globalize.translate('DownloadManager')}
                        </MenuItem>
                    )}

                    {safeAppHost.supports(AppFeature.ClientSettings) && (
                        <MenuItem onClick={onClientSettingsClick}>
                            <MenuItemDecorator>
                                <ResetIcon />
                            </MenuItemDecorator>
                            {globalize.translate('ClientSettings')}
                        </MenuItem>
                    )}

                    {/* ADMIN LINKS */}
                    {user?.Policy?.IsAdministrator && (
                        <>
                            <Divider />
                            <MenuItem component={Link} to="/dashboard" onClick={onMenuClose}>
                                <MenuItemDecorator>
                                    <DashboardIcon />
                                </MenuItemDecorator>
                                {globalize.translate('TabDashboard')}
                            </MenuItem>
                            <MenuItem component={Link} to="/metadata" onClick={onMenuClose}>
                                <MenuItemDecorator>
                                    <Pencil1Icon />
                                </MenuItemDecorator>
                                {globalize.translate('MetadataManager')}
                            </MenuItem>
                        </>
                    )}

                    <Divider />
                    {isQuickConnectEnabled && (
                        <MenuItem component={Link} to="/quickconnect" onClick={onMenuClose}>
                            <MenuItemDecorator>
                                <LockClosedIcon />
                            </MenuItemDecorator>
                            {globalize.translate('QuickConnect')}
                        </MenuItem>
                    )}

                    {safeAppHost.supports(AppFeature.MultiServer) && (
                        <MenuItem onClick={onSelectServerClick}>
                            <MenuItemDecorator>
                                <StackIcon />
                            </MenuItemDecorator>
                            {globalize.translate('SelectServer')}
                        </MenuItem>
                    )}

                    <MenuItem onClick={onLogoutClick}>
                        <MenuItemDecorator>
                            <ExitIcon />
                        </MenuItemDecorator>
                        {globalize.translate('ButtonSignOut')}
                    </MenuItem>

                    {safeAppHost.supports(AppFeature.ExitMenu) && (
                        <>
                            <Divider />
                            <MenuItem onClick={onExitAppClick}>
                                <MenuItemDecorator>
                                    <Cross1Icon />
                                </MenuItemDecorator>
                                {globalize.translate('ButtonExitApp')}
                            </MenuItem>
                        </>
                    )}
                </MenuContent>
            </MenuPortal>
        </Menu>
    );
};

export default AppUserMenu;
