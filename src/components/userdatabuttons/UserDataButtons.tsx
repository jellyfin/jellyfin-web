import React from 'react';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from '../../lib/globalize';
import itemHelper from '../itemHelper';

interface UserDataButtonsProps {
    item: any;
    includePlayed?: boolean;
    onUpdate?: () => void;
}

const UserDataButtons: React.FC<UserDataButtonsProps> = ({ item, includePlayed = true, onUpdate }) => {
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
        <Box sx={{ display: 'flex', gap: 1 }}>
            {includePlayed && canMarkPlayed && (
                <Tooltip title={globalize.translate('MarkPlayed')} variant="soft">
                    <IconButton
                        size="sm"
                        variant="plain"
                        color={userData.Played ? 'success' : 'neutral'}
                        onClick={handlePlayedClick}
                    >
                        {userData.Played ? <CheckCircleIcon /> : <CheckCircleOutlineIcon />}
                    </IconButton>
                </Tooltip>
            )}
            <Tooltip title={globalize.translate('Favorite')} variant="soft">
                <IconButton
                    size="sm"
                    variant="plain"
                    color={userData.IsFavorite ? 'danger' : 'neutral'}
                    onClick={handleFavoriteClick}
                >
                    {userData.IsFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default UserDataButtons;
