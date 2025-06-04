import React, { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApi } from 'hooks/useApi';
import type { PluginInfo } from '@jellyfin/sdk/lib/generated-client/models/plugin-info';
import globalize from 'lib/globalize';
import BaseCard from 'apps/dashboard/components/BaseCard';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Settings from '@mui/icons-material/Settings';
import Delete from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BlockIcon from '@mui/icons-material/Block';
import ExtensionIcon from '@mui/icons-material/Extension';
import ListItemText from '@mui/material/ListItemText';
import { PluginStatus } from '@jellyfin/sdk/lib/generated-client/models/plugin-status';
import type { ConfigurationPageInfo } from '@jellyfin/sdk/lib/generated-client/models/configuration-page-info';
import { useEnablePlugin } from '../api/useEnablePlugin';
import { useDisablePlugin } from '../api/useDisablePlugin';
import { useUninstallPlugin } from '../api/useUninstallPlugin';
import ConfirmDialog from 'components/ConfirmDialog';

interface IProps {
    plugin: PluginInfo;
    configurationPage?: ConfigurationPageInfo;
};

const PluginCard = ({ plugin, configurationPage }: IProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const actionRef = useRef<HTMLButtonElement | null>(null);
    const enablePlugin = useEnablePlugin();
    const disablePlugin = useDisablePlugin();
    const uninstallPlugin = useUninstallPlugin();
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const [ isMenuOpen, setMenuOpen ] = useState(false);
    const [ isUninstallConfirmOpen, setIsUninstallConfirmOpen ] = useState(false);
    const { api } = useApi();

    const navigateToPluginSettings = useCallback(() => {
        if (configurationPage) {
            navigate({
                pathname: '/configurationpage',
                search: `?name=${encodeURIComponent(configurationPage.Name || '')}`,
                hash: location.hash
            });
        }
    }, [ navigate, location, configurationPage ]);

    const onEnablePlugin = useCallback(() => {
        if (plugin.Id && plugin.Version) {
            enablePlugin.mutate({
                pluginId: plugin.Id,
                version: plugin.Version
            });
            setAnchorEl(null);
            setMenuOpen(false);
        }
    }, [ plugin, enablePlugin ]);

    const onDisablePlugin = useCallback(() => {
        if (plugin.Id && plugin.Version) {
            disablePlugin.mutate({
                pluginId: plugin.Id,
                version: plugin.Version
            });
            setAnchorEl(null);
            setMenuOpen(false);
        }
    }, [ plugin, disablePlugin ]);

    const onCloseUninstallConfirmDialog = useCallback(() => {
        setIsUninstallConfirmOpen(false);
    }, []);

    const showUninstallConfirmDialog = useCallback(() => {
        setIsUninstallConfirmOpen(true);
        setAnchorEl(null);
        setMenuOpen(false);
    }, []);

    const onUninstall = useCallback(() => {
        if (plugin.Id && plugin.Version) {
            uninstallPlugin.mutate({
                pluginId: plugin.Id,
                version: plugin.Version
            });
            setAnchorEl(null);
            setMenuOpen(false);
        }
    }, [ plugin, uninstallPlugin ]);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
        setMenuOpen(false);
    }, []);

    const onActionClick = useCallback(() => {
        setAnchorEl(actionRef.current);
        setMenuOpen(true);
    }, []);

    return (
        <>
            <BaseCard
                title={plugin.Name}
                text={`${globalize.translate('LabelStatus')} ${plugin.Status}`}
                image={plugin.HasImage ? api?.getUri(`/Plugins/${plugin.Id}/${plugin.Version}/Image`) : null}
                icon={<ExtensionIcon sx={{ width: 80, height: 80 }} />}
                action={true}
                actionRef={actionRef}
                onClick={navigateToPluginSettings}
                onActionClick={onActionClick}
            />
            <Menu
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={onMenuClose}
            >
                {configurationPage && (
                    <MenuItem onClick={navigateToPluginSettings}>
                        <ListItemIcon>
                            <Settings />
                        </ListItemIcon>
                        <ListItemText>{globalize.translate('Settings')}</ListItemText>
                    </MenuItem>
                )}

                {(plugin.CanUninstall && plugin.Status == PluginStatus.Active) && (
                    <MenuItem onClick={onDisablePlugin}>
                        <ListItemIcon>
                            <BlockIcon />
                        </ListItemIcon>
                        <ListItemText>{globalize.translate('DisablePlugin')}</ListItemText>
                    </MenuItem>
                )}

                {(plugin.CanUninstall && plugin.Status == PluginStatus.Disabled) && (
                    <MenuItem onClick={onEnablePlugin}>
                        <ListItemIcon>
                            <CheckCircleOutlineIcon />
                        </ListItemIcon>
                        <ListItemText>{globalize.translate('EnablePlugin')}</ListItemText>
                    </MenuItem>
                )}

                {plugin.CanUninstall && (
                    <MenuItem onClick={showUninstallConfirmDialog}>
                        <ListItemIcon>
                            <Delete />
                        </ListItemIcon>
                        <ListItemText>{globalize.translate('ButtonUninstall')}</ListItemText>
                    </MenuItem>
                )}
            </Menu>
            <ConfirmDialog
                open={isUninstallConfirmOpen}
                title={globalize.translate('HeaderUninstallPlugin')}
                text={globalize.translate('UninstallPluginConfirmation', plugin.Name || '')}
                onCancel={onCloseUninstallConfirmDialog}
                onConfirm={onUninstall}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('ButtonUninstall')}
            />
        </>
    );
};

export default PluginCard;
