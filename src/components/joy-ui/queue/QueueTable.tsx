import React, { useCallback, useMemo, useState } from 'react';
import { DiscIcon, DragHandleDots2Icon, PlayIcon, TrashIcon } from '@radix-ui/react-icons';

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
import { List, ListItem, ListItemButton, ListItemAvatar, ListItemText } from 'ui-primitives/List';
import { Avatar } from 'ui-primitives/Avatar';
import { IconButton } from 'ui-primitives/IconButton';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

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
            secondaryAction={
                <Flex style={{ alignItems: 'center', gap: vars.spacing.xs }}>
                    <IconButton
                        size='sm'
                        variant='plain'
                        color='neutral'
                        onClick={onRemove}
                        style={{ opacity: 0.7 }}
                    >
                        <TrashIcon />
                    </IconButton>
                    <IconButton
                        {...attributes}
                        {...listeners}
                        size='sm'
                        variant='plain'
                        color='neutral'
                        style={{ cursor: 'grab', opacity: 0.7 }}
                    >
                        <DragHandleDots2Icon />
                    </IconButton>
                </Flex>
            }
            style={{
                backgroundColor: isCurrent ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
                borderRadius: vars.borderRadius.sm,
                marginBottom: vars.spacing.xs,
                padding: 0,
                ...style
            }}
        >
            <ListItemButton
                onClick={onSelect}
                style={{
                    paddingTop: vars.spacing.sm,
                    paddingRight: `calc(${vars.spacing.xl} * 3)`,
                }}
            >
                <ListItemAvatar style={{ minWidth: 56 }}>
                    <Avatar
                        variant='rounded'
                        src={imageUrl || undefined}
                        style={{
                            width: 48,
                            height: 48,
                            backgroundColor: imageUrl ? 'transparent' : vars.colors.actionHover
                        }}
                    >
                        {!imageUrl && <DiscIcon style={{ color: vars.colors.textSecondary }} />}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={
                        <Flex style={{ alignItems: 'center', gap: vars.spacing.xs }}>
                            <Text
                                size="sm"
                                style={{
                                    fontWeight: isCurrent ? 'bold' : 'normal',
                                    color: isCurrent ? vars.colors.primary : vars.colors.text,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '70%'
                                }}
                            >
                                {item.item.name}
                            </Text>
                            {isPlaying && (
                                <PlayIcon style={{ fontSize: 14, color: vars.colors.primary }} />
                            )}
                        </Flex>
                    }
                    secondary={
                        <Text size="xs" color="secondary">
                            {item.item.artist || item.item.album || formatDuration(item.item.runtimeTicks)}
                        </Text>
                    }
                />
                <Box style={{ marginLeft: 'auto', paddingRight: vars.spacing.md }}>
                    <Text size="xs" color="secondary">
                        {formatDuration(item.item.runtimeTicks)}
                    </Text>
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
        <Box className='playlist itemsContainer vertical-list nowPlayingPlaylist' style={{ width: '100%' }}>
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
                            style={{
                                backgroundColor: vars.colors.surface,
                                borderRadius: vars.borderRadius.sm,
                                boxShadow: vars.shadows.lg,
                                padding: vars.spacing.sm,
                                opacity: 0.9
                            }}
                        >
                            <Flex style={{ alignItems: 'center', gap: vars.spacing.sm }}>
                                <Avatar
                                    variant='rounded'
                                    src={activeItem.item.imageUrl || undefined}
                                    style={{ width: 40, height: 40 }}
                                >
                                    <DiscIcon />
                                </Avatar>
                                <Text size="sm">
                                    {activeItem.item.name}
                                </Text>
                            </Flex>
                        </Box>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </Box>
    );
};

export default QueueTable;
