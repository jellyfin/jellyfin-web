import React, { useCallback } from 'react';
import { Box } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import { vars } from 'styles/tokens.css';

import { BookmarkIcon, DotsVerticalIcon, StackIcon } from '@radix-ui/react-icons';

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

export const QueueView: React.FC<QueueViewProps> = ({ onNavigateToItem, onShowPlaylistMenu, onSavePlaylist }) => {
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

    const handlePlayItem = useCallback(
        (itemId: string) => {
            const index = items.findIndex(item => item.id === itemId);
            if (index !== -1) {
                setCurrentIndex(index);
            }
        },
        [items, setCurrentIndex]
    );

    const handleRemoveItem = useCallback(
        (itemId: string) => {
            removeFromQueue([itemId]);
        },
        [removeFromQueue]
    );

    const handleReorder = useCallback(
        (fromIndex: number, toIndex: number) => {
            moveItem(fromIndex, toIndex);
        },
        [moveItem]
    );

    const handleSelectItem = useCallback(
        (item: { item: PlayableItem }) => {
            if (onNavigateToItem && item.item.id) {
                onNavigateToItem(item.item.id);
            }
        },
        [onNavigateToItem]
    );

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
            id="nowPlayingPage"
            className="page libraryPage nowPlayingPage noSecondaryNavPage selfBackdropPage"
            style={{
                height: '100%',
                overflow: 'auto',
                padding: vars.spacing['6'],
                backgroundColor: vars.colors.background
            }}
        >
            <Box className="remoteControlContent" style={{ maxWidth: 1200, margin: '0 auto' }}>
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

                <Box className="playlistSection" style={{ marginTop: vars.spacing['7'] }}>
                    <Box
                        className="playlistSectionButton flex align-items-center justify-content-center"
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: vars.spacing['4'],
                            marginBottom: vars.spacing['5']
                        }}
                    >
                        <Tooltip title="Toggle Playlist">
                            <IconButton
                                id="togglePlaylist"
                                className="btnTogglePlaylist"
                                size="md"
                                variant="plain"
                                color="neutral"
                            >
                                <StackIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Save Playlist">
                            <IconButton
                                className="btnSavePlaylist"
                                size="md"
                                variant="plain"
                                onClick={onSavePlaylist}
                                color="neutral"
                            >
                                <BookmarkIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="More Options">
                            <IconButton
                                id="toggleContextMenu"
                                className="btnToggleContextMenu"
                                size="md"
                                variant="plain"
                                onClick={onShowPlaylistMenu}
                                color="neutral"
                            >
                                <DotsVerticalIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    <Box
                        id="playlist"
                        className="playlist itemsContainer vertical-list nowPlayingPlaylist"
                        style={{
                            backgroundColor: vars.colors.surface,
                            borderRadius: vars.borderRadius.md,
                            padding: vars.spacing['5'],
                            minHeight: 200
                        }}
                    >
                        <Text weight="medium" style={{ marginBottom: vars.spacing['5'] }}>
                            Playlist ({items.length} tracks)
                        </Text>
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
                            <Box style={{ textAlign: 'center', padding: vars.spacing['7'] }}>
                                <Text color="secondary">No tracks in queue</Text>
                                <Text size="sm" color="secondary" style={{ marginTop: vars.spacing['2'] }}>
                                    Add some music to get started
                                </Text>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default QueueView;
