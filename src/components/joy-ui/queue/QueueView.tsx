import React, { useCallback } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/joy/Typography/Typography';
import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import Collapse from '@mui/material/Collapse/Collapse';

import QueueIcon from '@mui/icons-material/QueueMusic';
import SaveIcon from '@mui/icons-material/Save';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useQueue } from './useQueue';
import { QueueNowPlaying } from './QueueNowPlaying';
import { QueueControls } from './QueueControls';
import { QueueTable } from './QueueTable';

import type { PlayableItem } from 'store/types';

export interface QueueViewProps {
    onNavigateToItem?: (itemId: string) => void;
    onShowPlaylistMenu?: () => void;
    onSavePlaylist?: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
    onNavigateToItem,
    onShowPlaylistMenu,
    onSavePlaylist
}) => {
    const {
        items,
        currentIndex,
        currentItem,
        repeatMode,
        shuffleMode,
        isShuffled,
        isPlaying,
        currentTime,
        duration,
        setCurrentIndex,
        removeFromQueue,
        moveItem,
        setRepeatMode,
        setShuffleMode
    } = useQueue();

    const handlePlayItem = useCallback((itemId: string) => {
        const index = items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            setCurrentIndex(index);
        }
    }, [items, setCurrentIndex]);

    const handleRemoveItem = useCallback((itemId: string) => {
        removeFromQueue([itemId]);
    }, [removeFromQueue]);

    const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
        moveItem(fromIndex, toIndex);
    }, [moveItem]);

    const handleSelectItem = useCallback((item: { item: PlayableItem }) => {
        if (onNavigateToItem && item.item.id) {
            onNavigateToItem(item.item.id);
        }
    }, [onNavigateToItem]);

    const handleRepeatToggle = useCallback(() => {
        switch (repeatMode) {
            case 'RepeatNone':
                setRepeatMode('RepeatAll');
                break;
            case 'RepeatAll':
                setRepeatMode('RepeatOne');
                break;
            case 'RepeatOne':
                setRepeatMode('RepeatNone');
                break;
        }
    }, [repeatMode, setRepeatMode]);

    const handleShuffleToggle = useCallback(() => {
        if (isShuffled) {
            setShuffleMode('Sorted');
        } else {
            setShuffleMode('Shuffle');
        }
    }, [isShuffled, setShuffleMode]);

    const handlePreviousTrack = useCallback(() => {
        setCurrentIndex(Math.max(0, currentIndex - 1));
    }, [currentIndex, setCurrentIndex]);

    const handleNextTrack = useCallback(() => {
        setCurrentIndex(Math.min(items.length - 1, currentIndex + 1));
    }, [currentIndex, items.length, setCurrentIndex]);

    return (
        <Box
            id='nowPlayingPage'
            className='page libraryPage nowPlayingPage noSecondaryNavPage selfBackdropPage'
            sx={{
                height: '100%',
                overflow: 'auto',
                p: 3,
                backgroundColor: 'background.default'
            }}
        >
            <Box className='remoteControlContent' sx={{ maxWidth: 1200, mx: 'auto' }}>
                <QueueNowPlaying
                    currentItem={currentItem?.item || null}
                    isFavorite={currentItem?.item.isFavorite || false}
                />

                <QueueControls
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    volume={80}
                    isMuted={false}
                    repeatMode={repeatMode}
                    shuffleMode={shuffleMode}
                    isShuffled={isShuffled}
                    onPlayPause={() => {}}
                    onStop={() => {}}
                    onSeek={() => {}}
                    onSeekEnd={() => {}}
                    onVolumeChange={() => {}}
                    onMuteToggle={() => {}}
                    onRewind={() => {}}
                    onFastForward={() => {}}
                    onPreviousTrack={handlePreviousTrack}
                    onNextTrack={handleNextTrack}
                    onShuffleToggle={handleShuffleToggle}
                    onRepeatToggle={handleRepeatToggle}
                    onVolumeUp={() => {}}
                    onVolumeDown={() => {}}
                />

                <Box className='playlistSection' sx={{ mt: 4 }}>
                    <Box
                        className='playlistSectionButton flex align-items-center justify-content-center'
                        sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}
                    >
                        <Tooltip title='Toggle Playlist' arrow>
                            <IconButton
                                id='togglePlaylist'
                                className='btnTogglePlaylist'
                                size='md'
                                variant='plain'
                                sx={{ color: 'text.secondary' }}
                            >
                                <QueueIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Save Playlist' arrow>
                            <IconButton
                                className='btnSavePlaylist'
                                size='md'
                                variant='plain'
                                onClick={onSavePlaylist}
                                sx={{ color: 'text.secondary' }}
                            >
                                <SaveIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='More Options' arrow>
                            <IconButton
                                id='toggleContextMenu'
                                className='btnToggleContextMenu'
                                size='md'
                                variant='plain'
                                onClick={onShowPlaylistMenu}
                                sx={{ color: 'text.secondary' }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box
                        id='playlist'
                        className='playlist itemsContainer vertical-list nowPlayingPlaylist'
                        sx={{
                            backgroundColor: 'background.paper',
                            borderRadius: 2,
                            p: 2,
                            minHeight: 200
                        }}
                    >
                        <Typography level='title-md' sx={{ mb: 2 }}>
                            Playlist ({items.length} tracks)
                        </Typography>
                        {items.length > 0 ? (
                            <QueueTable
                                items={items}
                                currentIndex={currentIndex}
                                isPlaying={isPlaying}
                                onPlayItem={handlePlayItem}
                                onRemoveItem={handleRemoveItem}
                                onReorder={handleReorder}
                                onSelectItem={handleSelectItem}
                            />
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography sx={{ color: 'text.secondary' }}>
                                    No tracks in queue
                                </Typography>
                                <Typography level='body-sm' sx={{ color: 'text.secondary', mt: 1 }}>
                                    Add some music to get started
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default QueueView;
