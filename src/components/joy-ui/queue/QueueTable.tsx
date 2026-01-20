import React, { useCallback, useMemo, useState } from 'react';
import Box from '@mui/material/Box/Box';
import ListItem from '@mui/material/ListItem/ListItem';
import ListItemButton from '@mui/material/ListItemButton/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Avatar from '@mui/material/Avatar/Avatar';
import Typography from '@mui/joy/Typography/Typography';
import IconButton from '@mui/joy/IconButton';
import Tooltip from '@mui/joy/Tooltip';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    type DragEndEvent,
    type DragStartEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { QueueItem } from 'store/types';

export interface QueueTableProps {
    items: QueueItem[];
    currentIndex: number;
    isPlaying: boolean;
    onPlayItem: (itemId: string) => void;
    onRemoveItem: (itemId: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onSelectItem: (item: QueueItem) => void;
}

interface SortableQueueItemProps {
    item: QueueItem;
    index: number;
    isCurrent: boolean;
    isPlaying: boolean;
    onPlay: () => void;
    onRemove: () => void;
    onSelect: () => void;
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

const SortableQueueItem: React.FC<SortableQueueItemProps> = ({
    item,
    isCurrent,
    isPlaying,
    onPlay,
    onRemove,
    onSelect
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1
    };

    const imageUrl = item.item.imageUrl;

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            sx={{
                backgroundColor: isCurrent ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                borderRadius: 1,
                mb: 0.5,
                padding: 0
            }}
            secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                        size='sm'
                        variant='plain'
                        color='neutral'
                        onClick={onRemove}
                        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                    >
                        <DeleteOutlineIcon />
                    </IconButton>
                    <IconButton
                        {...attributes}
                        {...listeners}
                        size='sm'
                        variant='plain'
                        color='neutral'
                        sx={{ cursor: 'grab', opacity: 0.7, '&:hover': { opacity: 1 } }}
                    >
                        <DragIndicatorIcon />
                    </IconButton>
                </Box>
            }
            disablePadding
        >
            <ListItemButton
                onClick={onSelect}
                sx={{
                    py: 1,
                    pr: 8,
                    '&:hover': {
                        backgroundColor: 'action.hover'
                    }
                }}
            >
                <ListItemAvatar sx={{ minWidth: 56 }}>
                    <Avatar
                        variant='rounded'
                        src={imageUrl || undefined}
                        sx={{
                            width: 48,
                            height: 48,
                            backgroundColor: imageUrl ? 'transparent' : 'action.hover'
                        }}
                    >
                        {!imageUrl && <MusicNoteIcon sx={{ color: 'text.secondary' }} />}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                level='body-sm'
                                sx={{
                                    fontWeight: isCurrent ? 'bold' : 'normal',
                                    color: isCurrent ? 'primary.main' : 'text.primary',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '70%'
                                }}
                            >
                                {item.item.name}
                            </Typography>
                            {isPlaying && (
                                <PlayArrowIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                            )}
                        </Box>
                    }
                    secondary={
                        <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                            {item.item.artist || item.item.album || formatDuration(item.item.runtimeTicks)}
                        </Typography>
                    }
                />
                <Box sx={{ ml: 'auto', pr: 2 }}>
                    <Typography level='body-xs' sx={{ color: 'text.secondary' }}>
                        {formatDuration(item.item.runtimeTicks)}
                    </Typography>
                </Box>
            </ListItemButton>
        </ListItem>
    );
};

export const QueueTable: React.FC<QueueTableProps> = ({
    items,
    currentIndex,
    isPlaying,
    onPlayItem,
    onRemoveItem,
    onReorder,
    onSelectItem
}) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const itemIds = useMemo(() => items.map(item => item.id), [items]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                onReorder(oldIndex, newIndex);
            }
        }
    }, [items, onReorder]);

    const activeItem = activeId ? items.find(item => item.id === activeId) : null;

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5'
                }
            }
        })
    };

    return (
        <Box className='playlist itemsContainer vertical-list nowPlayingPlaylist' sx={{ width: '100%' }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={itemIds}
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((item, index) => (
                        <SortableQueueItem
                            key={item.id}
                            item={item}
                            index={index}
                            isCurrent={index === currentIndex}
                            isPlaying={isPlaying && index === currentIndex}
                            onPlay={() => onPlayItem(item.id)}
                            onRemove={() => onRemoveItem(item.id)}
                            onSelect={() => onSelectItem(item)}
                        />
                    ))}
                </SortableContext>
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeItem ? (
                        <Box
                            sx={{
                                backgroundColor: 'background.paper',
                                borderRadius: 1,
                                boxShadow: 3,
                                p: 1,
                                opacity: 0.9
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar
                                    variant='rounded'
                                    src={activeItem.item.imageUrl || undefined}
                                    sx={{ width: 40, height: 40 }}
                                >
                                    <MusicNoteIcon />
                                </Avatar>
                                <Typography level='body-sm'>
                                    {activeItem.item.name}
                                </Typography>
                            </Box>
                        </Box>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </Box>
    );
};

export default QueueTable;
