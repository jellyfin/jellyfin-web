import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';

// Joy UI Components
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import Avatar from '@mui/joy/Avatar';
import Menu from '@mui/joy/Menu';
import MenuItem from '@mui/joy/MenuItem';
import MenuButton from '@mui/joy/MenuButton';
import Dropdown from '@mui/joy/Dropdown';

// Material Icons
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

import { useVirtualizer } from '@tanstack/react-virtual';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { WaveformCell } from 'components/visualizer/WaveformCell';
import { getCachedPeaks } from 'components/visualizer/WaveSurfer';
import Events from 'utils/events';

const SCROLL_POSITION_KEY = 'jellyfin-queue-scroll-position';

interface QueueItem {
    Id: string;
    Name: string;
    Artists?: string[];
    AlbumArtist?: string;
    Album?: string;
    RunTimeTicks?: number;
    ImageTags?: { Primary?: string };
    ServerId?: string;
    PlaylistItemId?: string;
}

interface QueueTableProps {
    queueData: QueueItem[];
    currentIndex: number;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRemove: (item: QueueItem) => void;
    onPlay: (item: QueueItem) => void;
}

interface SortableRowProps {
    item: QueueItem;
    index: number;
    isCurrent: boolean;
    isNext: boolean;
    imageUrl: string | undefined;
    playbackTime: number;
    formatDuration: (ticks?: number) => string;
    getWaveformPeaks: (item: QueueItem) => number[][] | undefined;
    onPlay: (item: QueueItem) => void;
    onRemove: (item: QueueItem) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({
    item,
    index,
    isCurrent,
    isNext,
    imageUrl,
    playbackTime,
    formatDuration,
    getWaveformPeaks,
    onPlay,
    onRemove
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.Id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const artist = item.Artists?.[0] || item.AlbumArtist || '';
    const peaks = getWaveformPeaks(item);

    return (
        <Sheet
            ref={setNodeRef}
            style={style}
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1,
                bgcolor: isDragging ? 'rgba(0, 164, 220, 0.15)' : 'transparent',
                borderBottom: '1px solid',
                borderColor: 'neutral.800',
                cursor: 'pointer',
                '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
            }}
        >
            {/* Drag Handle */}
            <Box sx={{ width: 40, flexShrink: 0 }} {...attributes} {...listeners}>
                <IconButton
                    variant="plain"
                    size="sm"
                    sx={{ color: 'neutral.500', cursor: 'grab' }}
                >
                    <DragIndicatorIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Index/Avatar */}
            <Box sx={{ width: 50, flexShrink: 0 }}>
                <Avatar
                    src={imageUrl}
                    size="sm"
                    sx={{
                        bgcolor: isCurrent ? 'primary.500' : 'neutral.700',
                        width: 36,
                        height: 36
                    }}
                >
                    {isCurrent ? (
                        <PlayArrowIcon sx={{ color: 'white', fontSize: 16 }} />
                    ) : imageUrl ? null : (
                        <MusicNoteIcon sx={{ fontSize: 14 }} />
                    )}
                </Avatar>
            </Box>

            {/* Title & Artist */}
            <Box sx={{ flex: '1 1 auto', minWidth: 0, px: 2 }}>
                <Typography
                    level="body-sm"
                    sx={{
                        color: isCurrent ? 'primary.400' : 'neutral.50',
                        fontWeight: isCurrent ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {item.Name}
                </Typography>
                <Typography
                    level="body-xs"
                    sx={{
                        color: 'neutral.400',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {artist}{item.Album ? ` • ${item.Album}` : ''}
                </Typography>
            </Box>

            {/* Waveform */}
            <Box sx={{ width: 150, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
                <WaveformCell
                    itemId={item.Id}
                    peaks={peaks}
                    duration={item.RunTimeTicks}
                    currentTime={isCurrent ? playbackTime : 0}
                    isCurrentTrack={isCurrent}
                    isNextTrack={isNext}
                    height={36}
                />
            </Box>

            {/* Duration */}
            <Box sx={{ width: 60, flexShrink: 0, textAlign: 'right', pr: 1 }}>
                <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                    {formatDuration(item.RunTimeTicks)}
                </Typography>
            </Box>

            {/* Actions Menu */}
            <Box sx={{ width: 40, flexShrink: 0 }}>
                <Dropdown>
                    <MenuButton
                        slots={{ root: IconButton }}
                        slotProps={{
                            root: {
                                variant: 'plain',
                                size: 'sm',
                                sx: { color: 'neutral.500' }
                            }
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </MenuButton>
                    {/* @ts-expect-error Joy UI Menu type complexity */}
                    <Menu>
                        {/* @ts-expect-error Joy UI MenuItem type complexity */}
                        <MenuItem onClick={() => onPlay(item)}>
                            <PlayArrowIcon sx={{ mr: 1 }} />
                            Play
                        </MenuItem>
                        <MenuItem onClick={() => onRemove(item)}>
                            <DeleteIcon sx={{ mr: 1, color: 'danger.500' }} />
                            Remove
                        </MenuItem>
                    </Menu>
                </Dropdown>
            </Box>
        </Sheet>
    );
};

export const QueueTable: React.FC<QueueTableProps> = ({
    queueData,
    currentIndex,
    onReorder,
    onRemove,
    onPlay
}) => {
    const [playbackTime, setPlaybackTime] = useState(0);
    const parentRef = useRef<HTMLDivElement>(null);
    const previousIndexRef = useRef(currentIndex);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = queueData.findIndex(item => item.Id === active.id);
            const newIndex = queueData.findIndex(item => item.Id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                onReorder(oldIndex, newIndex);
            }
        }
    }, [onReorder, queueData]);

    const formatDuration = useCallback((ticks?: number): string => {
        if (!ticks) return '--:--';
        const totalSeconds = Math.floor(ticks / 10000000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const getImageUrl = useCallback((item: QueueItem): string | undefined => {
        if (item.ImageTags?.Primary && item.ServerId) {
            const apiClient = ServerConnections.getApiClient(item.ServerId);
            return apiClient.getScaledImageUrl(item.Id, {
                type: 'Primary',
                tag: item.ImageTags.Primary,
                maxWidth: 100
            });
        }
        return undefined;
    }, []);

    const getWaveformPeaks = useCallback((item: QueueItem): number[][] | undefined => {
        const cached = getCachedPeaks(item.Id, null);
        return cached?.peaks;
    }, []);

    // Restore scroll position
    useEffect(() => {
        const savedScroll = localStorage.getItem(SCROLL_POSITION_KEY);
        if (savedScroll && parentRef.current) {
            parentRef.current.scrollTop = parseInt(savedScroll, 10);
        }
    }, []);

    // Track playback time for waveform
    useEffect(() => {
        const handleTimeUpdate = () => {
            const player = playbackManager.getCurrentPlayer();
            if (player && typeof player.getCurrentTime === 'function') {
                setPlaybackTime(player.getCurrentTime());
            }
        };

        Events.on(playbackManager, 'timeupdate', handleTimeUpdate);
        return () => {
            Events.off(playbackManager, 'timeupdate', handleTimeUpdate);
        };
    }, []);

    const rowVirtualizer = useVirtualizer({
        count: queueData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64,
        overscan: 5
    });

    // Auto-scroll to current track when it changes
    useEffect(() => {
        if (currentIndex !== previousIndexRef.current && currentIndex >= 0) {
            rowVirtualizer.scrollToIndex(currentIndex, { align: 'center', behavior: 'smooth' });
            previousIndexRef.current = currentIndex;
        }
    }, [currentIndex, rowVirtualizer]);

    // Save scroll position
    useEffect(() => {
        const container = parentRef.current;
        if (!container) return;

        const handleScroll = () => {
            localStorage.setItem(SCROLL_POSITION_KEY, container.scrollTop.toString());
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const sortableIds = useMemo(() => queueData.map(item => item.Id), [queueData]);

    return (
        <Sheet
            sx={{
                width: '100%',
                height: 'calc(100vh - 280px)',
                overflow: 'hidden',
                bgcolor: 'transparent'
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'neutral.800',
                    bgcolor: 'rgba(0,0,0,0.4)'
                }}
            >
                <Box sx={{ width: 40 }} />
                <Box sx={{ width: 50 }}>
                    <Typography level="body-xs" sx={{ color: 'neutral.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                        #
                    </Typography>
                </Box>
                <Box sx={{ flex: '1 1 auto', px: 2 }}>
                    <Typography level="body-xs" sx={{ color: 'neutral.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Title
                    </Typography>
                </Box>
                <Box sx={{ width: 150, display: { xs: 'none', md: 'block' } }} />
                <Box sx={{ width: 60, textAlign: 'right', pr: 1 }}>
                    <Typography level="body-xs" sx={{ color: 'neutral.500', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Time
                    </Typography>
                </Box>
                <Box sx={{ width: 40 }} />
            </Box>

            {/* Virtualized List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sortableIds}
                    strategy={verticalListSortingStrategy}
                >
                    <Box
                        ref={parentRef}
                        sx={{
                            height: 'calc(100% - 48px)',
                            overflow: 'auto',
                            '&::-webkit-scrollbar': {
                                width: 8
                            },
                            '&::-webkit-scrollbar-track': {
                                bgcolor: 'transparent'
                            },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: 'neutral.700',
                                borderRadius: 4,
                                '&:hover': {
                                    bgcolor: 'neutral.600'
                                }
                            }
                        }}
                    >
                        <Box
                            sx={{
                                height: rowVirtualizer.getTotalSize(),
                                position: 'relative'
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const item = queueData[virtualRow.index];
                                const isCurrent = virtualRow.index === currentIndex;
                                const isNext = virtualRow.index === currentIndex + 1;

                                return (
                                    <Box
                                        key={item.Id}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`
                                        }}
                                    >
                                        <SortableRow
                                            item={item}
                                            index={virtualRow.index}
                                            isCurrent={isCurrent}
                                            isNext={isNext}
                                            imageUrl={getImageUrl(item)}
                                            playbackTime={playbackTime}
                                            formatDuration={formatDuration}
                                            getWaveformPeaks={getWaveformPeaks}
                                            onPlay={onPlay}
                                            onRemove={onRemove}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </SortableContext>
            </DndContext>
        </Sheet>
    );
};

export default QueueTable;
