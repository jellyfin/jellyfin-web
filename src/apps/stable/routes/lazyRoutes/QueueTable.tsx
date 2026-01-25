import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';

import { Box } from 'ui-primitives/Box';
import { IconButton } from 'ui-primitives/IconButton';
import { Text } from 'ui-primitives/Text';
import { Avatar } from 'ui-primitives/Avatar';
import { Menu, MenuItem } from 'ui-primitives/Menu';

// Material Icons
import { DiscIcon, DotsVerticalIcon, DragHandleDots2Icon, PlayIcon, TrashIcon } from '@radix-ui/react-icons';

import { useVirtualizer } from '@tanstack/react-virtual';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
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
import Events, { type EventObject } from 'utils/events';
import { vars } from 'styles/tokens.css';
import {
    dragHandle,
    headerRow,
    hideOnSmall,
    rowDragging,
    scrollContainer,
    tableContainer,
    tableRow,
    virtualItem,
    virtualList
} from './QueueTable.css';

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
    isCurrent,
    isNext,
    imageUrl,
    playbackTime,
    formatDuration,
    getWaveformPeaks,
    onPlay,
    onRemove
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.Id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const artist = item.Artists?.[0] || item.AlbumArtist || '';
    const peaks = getWaveformPeaks(item);

    return (
        <div ref={setNodeRef} className={`${tableRow} ${isDragging ? rowDragging : ''}`} style={style}>
            {/* Drag Handle */}
            <Box style={{ width: 40, flexShrink: 0 }} {...attributes} {...listeners}>
                <IconButton variant="plain" size="sm" color="neutral" className={dragHandle}>
                    <DragHandleDots2Icon style={{ width: 16, height: 16 }} />
                </IconButton>
            </Box>

            {/* Index/Avatar */}
            <Box style={{ width: 50, flexShrink: 0 }}>
                <Avatar
                    src={imageUrl}
                    style={{
                        width: 36,
                        height: 36,
                        backgroundColor: isCurrent ? vars.colors.primary : vars.colors.surfaceHover,
                        color: vars.colors.text
                    }}
                >
                    {isCurrent ? (
                        <PlayIcon style={{ color: vars.colors.text, width: 16, height: 16 }} />
                    ) : imageUrl ? null : (
                        <DiscIcon style={{ width: 14, height: 14 }} />
                    )}
                </Avatar>
            </Box>

            {/* Title & Artist */}
            <Box style={{ flex: '1 1 auto', minWidth: 0, padding: `0 ${vars.spacing.md}` }}>
                <Text
                    as="div"
                    size="sm"
                    weight={isCurrent ? 'medium' : 'normal'}
                    style={{
                        color: isCurrent ? vars.colors.primary : vars.colors.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {item.Name}
                </Text>
                <Text
                    as="div"
                    size="xs"
                    color="muted"
                    style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {artist}
                    {item.Album ? ` • ${item.Album}` : ''}
                </Text>
            </Box>

            {/* Waveform */}
            <Box style={{ width: 150, flexShrink: 0 }} className={hideOnSmall}>
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
            <Box style={{ width: 60, flexShrink: 0, textAlign: 'right', paddingRight: vars.spacing.xs }}>
                <Text as="span" size="xs" color="muted">
                    {formatDuration(item.RunTimeTicks)}
                </Text>
            </Box>

            {/* Actions Menu */}
            <Box style={{ width: 40, flexShrink: 0 }}>
                <Menu
                    open={isMenuOpen}
                    onOpenChange={setIsMenuOpen}
                    align="end"
                    trigger={
                        <IconButton variant="plain" size="sm" color="neutral">
                            <DotsVerticalIcon style={{ width: 16, height: 16 }} />
                        </IconButton>
                    }
                >
                    <MenuItem onClick={() => onPlay(item)}>
                        <PlayIcon style={{ width: 16, height: 16 }} />
                        Play
                    </MenuItem>
                    <MenuItem variant="danger" onClick={() => onRemove(item)}>
                        <TrashIcon style={{ width: 16, height: 16 }} />
                        Remove
                    </MenuItem>
                </Menu>
            </Box>
        </div>
    );
};

export const QueueTable: React.FC<QueueTableProps> = ({ queueData, currentIndex, onReorder, onRemove, onPlay }) => {
    const [playbackTime, setPlaybackTime] = useState(0);
    const parentRef = useRef<HTMLDivElement>(null);
    const previousIndexRef = useRef(currentIndex);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (over && active.id !== over.id) {
                const oldIndex = queueData.findIndex(item => item.Id === active.id);
                const newIndex = queueData.findIndex(item => item.Id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                    onReorder(oldIndex, newIndex);
                }
            }
        },
        [onReorder, queueData]
    );

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

        Events.on(playbackManager as unknown as EventObject, 'timeupdate', handleTimeUpdate);
        return () => {
            Events.off(playbackManager as unknown as EventObject, 'timeupdate', handleTimeUpdate);
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
        <div className={tableContainer}>
            {/* Header */}
            <div className={headerRow}>
                <Box style={{ width: 40 }} />
                <Box style={{ width: 50 }}>
                    <Text as="span" size="xs" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        #
                    </Text>
                </Box>
                <Box style={{ flex: '1 1 auto', padding: `0 ${vars.spacing.md}` }}>
                    <Text as="span" size="xs" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Title
                    </Text>
                </Box>
                <Box style={{ width: 150 }} className={hideOnSmall} />
                <Box style={{ width: 60, textAlign: 'right', paddingRight: vars.spacing.xs }}>
                    <Text as="span" size="xs" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Time
                    </Text>
                </Box>
                <Box style={{ width: 40 }} />
            </div>

            {/* Virtualized List */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    <div ref={parentRef} className={scrollContainer}>
                        <div className={virtualList} style={{ height: rowVirtualizer.getTotalSize() }}>
                            {rowVirtualizer.getVirtualItems().map(virtualRow => {
                                const item = queueData[virtualRow.index];
                                const isCurrent = virtualRow.index === currentIndex;
                                const isNext = virtualRow.index === currentIndex + 1;

                                return (
                                    <div
                                        key={item.Id}
                                        className={virtualItem}
                                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                                    >
                                        <SortableRow
                                            item={item}
                                            isCurrent={isCurrent}
                                            isNext={isNext}
                                            imageUrl={getImageUrl(item)}
                                            playbackTime={playbackTime}
                                            formatDuration={formatDuration}
                                            getWaveformPeaks={getWaveformPeaks}
                                            onPlay={onPlay}
                                            onRemove={onRemove}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default QueueTable;
