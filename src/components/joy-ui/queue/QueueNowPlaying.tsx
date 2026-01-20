import React from 'react';
import Box from '@mui/material/Box/Box';
import Avatar from '@mui/material/Avatar/Avatar';
import Typography from '@mui/joy/Typography/Typography';
import IconButton from '@mui/joy/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

import type { PlayableItem } from 'store/types';

export interface QueueNowPlayingProps {
    currentItem: PlayableItem | null;
    isFavorite?: boolean;
    onFavoriteClick?: () => void;
}

const formatDuration = (ticks: number | undefined): string => {
    if (!ticks) return '--:--';
    const seconds = Math.floor((ticks / 10000000) % 60);
    const minutes = Math.floor((ticks / 10000000 / 60) % 60);
    const hours = Math.floor(ticks / 10000000 / 60 / 60);
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const QueueNowPlaying: React.FC<QueueNowPlayingProps> = ({
    currentItem,
    isFavorite = false,
    onFavoriteClick
}) => {
    const imageUrl = currentItem?.imageUrl;

    return (
        <Box className='nowPlayingInfoContainer' sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <Box className='nowPlayingPageImageContainer'>
                <Avatar
                    variant='rounded'
                    src={imageUrl || undefined}
                    sx={{
                        width: 200,
                        height: 200,
                        backgroundColor: imageUrl ? 'transparent' : 'action.hover',
                        borderRadius: 2
                    }}
                >
                    {!imageUrl && <MusicNoteIcon sx={{ fontSize: 64, color: 'text.secondary' }} />}
                </Avatar>
            </Box>
            <Box className='nowPlayingInfoControls' sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box className='infoContainer flex' sx={{ mb: 2 }}>
                    <Box className='nowPlayingInfoContainerMedia'>
                        <Typography level='h4' component='h2' sx={{ fontWeight: 'bold', mb: 1 }}>
                            {currentItem?.name || 'No track playing'}
                        </Typography>
                        <Typography level='body-lg' sx={{ fontWeight: 500, mb: 0.5 }}>
                            {currentItem?.artist || ''}
                        </Typography>
                        <Typography level='body-md' sx={{ color: 'text.secondary' }}>
                            {currentItem?.album || ''}
                        </Typography>
                    </Box>
                    {onFavoriteClick && (
                        <Box className='nowPlayingPageUserDataButtonsTitle' sx={{ ml: 'auto' }}>
                            <IconButton
                                variant='plain'
                                onClick={onFavoriteClick}
                                sx={{ color: isFavorite ? 'error.main' : 'text.secondary' }}
                            >
                                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            </IconButton>
                        </Box>
                    )}
                </Box>
                <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
                    {currentItem?.runtimeTicks ? formatDuration(currentItem.runtimeTicks) : '--:--'}
                </Typography>
            </Box>
        </Box>
    );
};

export default QueueNowPlaying;
