import { CheckCircledIcon, CheckIcon, HeartFilledIcon, HeartIcon } from '@radix-ui/react-icons';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React from 'react';
import { Box, IconButton, Tooltip } from 'ui-primitives';
import globalize from '../../lib/globalize';
import itemHelper from '../itemHelper';

interface UserDataButtonsProps {
    item: any;
    includePlayed?: boolean;
    onUpdate?: () => void;
}

const UserDataButtons: React.FC<UserDataButtonsProps> = ({
    item,
    includePlayed = true,
    onUpdate
}) => {
    const userData = item.UserData || {};
    const apiClient = ServerConnections.getApiClient(item.ServerId);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newStatus = !userData.IsFavorite;
        await apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), item.Id, newStatus);
        onUpdate?.();
    };

    const handlePlayedClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newStatus = !userData.Played;
        const method = newStatus ? 'markPlayed' : 'markUnplayed';
        await apiClient[method](apiClient.getCurrentUserId(), item.Id, new Date());
        onUpdate?.();
    };

    if (itemHelper.isLocalItem(item)) return null;

    const canMarkPlayed = (itemHelper as any).canMarkPlayed(item);

    return (
        <Box style={{ display: 'flex', gap: 8 }}>
            {includePlayed && canMarkPlayed && (
                <Tooltip title={globalize.translate('MarkPlayed')}>
                    <IconButton
                        size="sm"
                        variant="plain"
                        color={userData.Played ? 'success' : 'neutral'}
                        onClick={handlePlayedClick}
                    >
                        {userData.Played ? <CheckCircledIcon /> : <CheckIcon />}
                    </IconButton>
                </Tooltip>
            )}
            <Tooltip title={globalize.translate('Favorite')}>
                <IconButton
                    size="sm"
                    variant="plain"
                    color={userData.IsFavorite ? 'danger' : 'neutral'}
                    onClick={handleFavoriteClick}
                >
                    {userData.IsFavorite ? <HeartFilledIcon /> : <HeartIcon />}
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default UserDataButtons;
