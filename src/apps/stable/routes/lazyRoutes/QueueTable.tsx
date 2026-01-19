import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
    Row
} from '@tanstack/react-table';
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

const SortableRow = ({
    row,
    children
}: {
    row: Row<QueueItem>;
    children: React.ReactNode
}) => {
    const {
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: row.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        '--Table-row-hover-bg': 'rgba(0, 164, 220, 0.08)'
    } as React.CSSProperties;

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            hover
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(0, 164, 220, 0.08)' } }}
        >
            {children}
        </TableRow>
    );
};

export const QueueTable: React.FC<QueueTableProps> = ({
    queueData,
    currentIndex,
    onReorder,
    onRemove,
    onPlay
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
    const [playbackTime, setPlaybackTime] = useState(0);
    const parentRef = React.useRef<HTMLDivElement>(null);
    const previousIndexRef = React.useRef(currentIndex);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleContextMenu = useCallback((event: React.MouseEvent<HTMLElement>, item: QueueItem) => {
        event.preventDefault();
        setAnchorEl(event.currentTarget);
        setSelectedItem(item);
    }, []);

    const handleCloseMenu = useCallback(() => {
        setAnchorEl(null);
        setSelectedItem(null);
    }, []);

    const handleMenuPlay = useCallback(() => {
        if (selectedItem) {
            onPlay(selectedItem);
        }
        handleCloseMenu();
    }, [selectedItem, onPlay, handleCloseMenu]);

    const handleMenuRemove = useCallback(() => {
        if (selectedItem) {
            onRemove(selectedItem);
        }
        handleCloseMenu();
    }, [selectedItem, onRemove, handleCloseMenu]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = parseInt(active.id as string, 10);
            const newIndex = parseInt(over.id as string, 10);
            onReorder(oldIndex, newIndex);
        }
    }, [onReorder]);

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

    useEffect(() => {
        const savedScroll = localStorage.getItem(SCROLL_POSITION_KEY);
        if (savedScroll && parentRef.current) {
            parentRef.current.scrollTop = parseInt(savedScroll, 10);
        }
    }, []);

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

    const columns = useMemo<ColumnDef<QueueItem>[]>(() => [
        {
            id: 'drag',
            header: '',
            cell: ({ row }) => (
                <IconButton
                    size='sm'
                    variant='plain'
                    sx={{ color: 'neutral.600', cursor: 'grab' }}
                >
                    <DragIndicatorIcon />
                </IconButton>
            ),
            size: 40
        },
        {
            id: 'index',
            header: '#',
            cell: ({ row }) => {
                const index = parseInt(row.id, 10);
                const isCurrentTrack = index === currentIndex;
                return (
                    <Avatar
                        src={getImageUrl(row.original)}
                        sx={{
                            bgcolor: isCurrentTrack ? '#00a4dc' : 'neutral.600',
                            width: 36,
                            height: 36,
                            fontSize: '0.75rem'
                        }}
                    >
                        {isCurrentTrack ? (
                            <PlayArrowIcon sx={{ color: 'white', fontSize: 16 }} />
                        ) : (
                            <Typography sx={{ color: 'white', fontSize: '0.75rem' }}>
                                {index + 1}
                            </Typography>
                        )}
                    </Avatar>
                );
            },
            size: 50
        },
        {
            accessorKey: 'Name',
            header: 'Title',
            cell: ({ row }) => {
                const index = parseInt(row.id, 10);
                const isCurrent = index === currentIndex;
                const artist = row.original.Artists?.[0] || row.original.AlbumArtist || '';
                return (
                    <Box>
                        <Typography
                            level='body-md'
                            sx={{
                                color: isCurrent ? 'var(--joy-palette-primary-500)' : 'text.primary',
                                fontWeight: isCurrent ? 600 : 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 200
                            }}
                        >
                            {row.original.Name}
                        </Typography>
                        <Typography
                            level='body-xs'
                            sx={{
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 200
                            }}
                        >
                            {artist}{row.original.Album ? ` • ${row.original.Album}` : ''}
                        </Typography>
                    </Box>
                );
            },
            size: 250
        },
        {
            id: 'waveform',
            header: '',
            cell: ({ row }) => {
                const index = parseInt(row.id, 10);
                const isCurrent = index === currentIndex;
                const isNext = index === currentIndex + 1;
                const peaks = getWaveformPeaks(row.original);
                return (
                    <WaveformCell
                        itemId={row.original.Id}
                        peaks={peaks}
                        duration={row.original.RunTimeTicks}
                        currentTime={isCurrent ? playbackTime : 0}
                        isCurrentTrack={isCurrent}
                        isNextTrack={isNext}
                        height={36}
                    />
                );
            },
            size: 150
        },
        {
            accessorKey: 'RunTimeTicks',
            header: 'Duration',
            cell: ({ row }) => (
                <Typography level='body-sm' sx={{ color: 'text.secondary', width: 50 }}>
                    {formatDuration(row.original.RunTimeTicks)}
                </Typography>
            ),
            size: 50
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <IconButton
                    size='sm'
                    variant='plain'
                    onClick={(e) => handleContextMenu(e, row.original)}
                    sx={{ color: 'neutral.500', '&:hover': { color: 'danger.main' } }}
                >
                    <MoreVertIcon />
                </IconButton>
            ),
            size: 40
        }
    ], [currentIndex, getImageUrl, formatDuration, getWaveformPeaks, handleContextMenu, playbackTime]);

    const table = useReactTable({
        data: queueData,
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 70,
        overscan: 5
    });

    useEffect(() => {
        if (currentIndex !== previousIndexRef.current && currentIndex >= 0) {
            const virtualItems = rowVirtualizer.getVirtualItems();
            const currentItem = virtualItems.find(
                item => {
                    const row = rows[item.index];
                    return row && parseInt(row.id, 10) === currentIndex;
                }
            );

            if (currentItem && parentRef.current) {
                const firstItem = virtualItems[0];
                const scrollToIndex = currentItem.start - (firstItem?.start || 0);
                parentRef.current.scrollTo({
                    top: scrollToIndex,
                    behavior: 'smooth'
                });
            }

            previousIndexRef.current = currentIndex;
        }
    }, [currentIndex, rows, rowVirtualizer]);

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

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <TableContainer
                    component='div'
                    ref={parentRef}
                    sx={{
                        height: 'calc(100vh - 200px)',
                        overflow: 'auto'
                    }}
                >
                    <Table stickyHeader size='small'>
                        <TableHead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableCell
                                            key={header.id}
                                            sx={{
                                                bgcolor: 'rgba(0, 0, 0, 0.8)',
                                                color: 'text.secondary',
                                                fontSize: '0.75rem',
                                                py: 1,
                                                borderBottom: 'none'
                                            }}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHead>
                        <TableBody
                            sx={{
                                position: 'relative',
                                height: `${rowVirtualizer.getTotalSize()}px`
                            }}
                        >
                            <SortableContext
                                items={rows.map((row) => row.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const row = rows[virtualRow.index];
                                    return (
                                        <Box
                                            key={row.id}
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`
                                            }}
                                        >
                                            <SortableRow row={row}>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        sx={{
                                                            bgcolor: 'transparent',
                                                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                            py: 1,
                                                            verticalAlign: 'middle'
                                                        }}
                                                    >
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </SortableRow>
                                        </Box>
                                    );
                                })}
                            </SortableContext>
                        </TableBody>
                    </Table>
                </TableContainer>
            </DndContext>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                <MenuItem onClick={handleMenuPlay}>
                    <ListItemIcon>
                        <PlayArrowIcon />
                    </ListItemIcon>
                    <ListItemText>Play</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuRemove} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText>Remove</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default QueueTable;
