import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box/Box';
import Table from '@mui/material/Table/Table';
import TableBody from '@mui/material/TableBody/TableBody';
import TableCell from '@mui/material/TableCell/TableCell';
import TableContainer from '@mui/material/TableContainer/TableContainer';
import TableHead from '@mui/material/TableHead/TableHead';
import TableRow from '@mui/material/TableRow/TableRow';
import Avatar from '@mui/material/Avatar/Avatar';
import IconButton from '@mui/material/IconButton/IconButton';
import Menu from '@mui/material/Menu/Menu';
import MenuItem from '@mui/material/MenuItem/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon/ListItemIcon';
import ListItemText from '@mui/material/ListItemText/ListItemText';
import Typography from '@mui/material/Typography/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    ColumnDef,
    flexRender,
    Row,
    SortingState
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
    arrayMove,
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
const SCROLL_DEBOUNCE_MS = 150;

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
    sortableProps?: Record<string, unknown>;
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
        attributes,
        listeners,
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
        backgroundColor: isDragging ? 'rgba(0, 164, 220, 0.2)' : 'transparent'
    };

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            sx={{
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                cursor: 'pointer'
            }}
        >
            {children}
        </TableRow>
    );
};

const DraggableCell: React.FC<{
    children: React.ReactNode;
    dragHandleProps?: Record<string, unknown>;
}> = ({ children, dragHandleProps }) => {
    return (
        <TableCell
            sx={{ width: 40, p: 1, verticalAlign: 'middle' }}
            {...dragHandleProps}
        >
            {children}
        </TableCell>
    );
};

export const QueueTable: React.FC<QueueTableProps> = ({
    queueData,
    currentIndex,
    onReorder,
    onRemove,
    onPlay
}) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
    const [playbackTime, setPlaybackTime] = useState(0);
    const parentRef = React.useRef<HTMLDivElement>(null);
    const scrollTimeoutRef = React.useRef<number | null>(null);
    const previousIndexRef = React.useRef(currentIndex);
    const rowVirtualizerRef = useRef<any>(null);

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
                    size='small'
                    sx={{ color: 'grey.600', cursor: 'grab' }}
                    {...row.original.sortableProps}
                >
                    <DragIndicatorIcon fontSize='small' />
                </IconButton>
            ),
            size: 40
        },
        {
            id: 'index',
            header: '#',
            cell: ({ row }) => {
                const index = parseInt(row.id, 10);
                const isCurrent = index === currentIndex;
                return (
                    <Avatar
                        src={getImageUrl(row.original)}
                        sx={{
                            bgcolor: isCurrent ? '#00a4dc' : '#444',
                            width: 40,
                            height: 40,
                            fontSize: '0.875rem'
                        }}
                    >
                        {isCurrent ? (
                            <PlayArrowIcon sx={{ color: 'white', fontSize: 20 }} />
                        ) : (
                            <Typography sx={{ color: 'white' }}>{index + 1}</Typography>
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
                            variant='body1'
                            sx={{
                                color: isCurrent ? '#00a4dc' : 'white',
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
                            variant='body2'
                            sx={{
                                color: 'grey.400',
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
                <Typography variant='body2' sx={{ color: 'grey.500', width: 50 }}>
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
                    size='small'
                    onClick={(e) => handleContextMenu(e, row.original)}
                    sx={{ color: 'grey.500', '&:hover': { color: 'error.main' } }}
                >
                    <MoreVertIcon fontSize='small' />
                </IconButton>
            ),
            size: 40
        }
    ], [currentIndex, getImageUrl, formatDuration, getWaveformPeaks, handleContextMenu, playbackTime]);

    const table = useReactTable({
        data: queueData,
        columns,
        state: {
            sorting
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: false
    });

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 70,
        overscan: 5
    });

    rowVirtualizerRef.current = rowVirtualizer;

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
                                                color: 'grey.400',
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
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                position: 'relative'
                            }}
                        >
                            <SortableContext
                                items={rows.map((row) => row.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                    const row = rows[virtualRow.index];
                                    return (
                                        <div
                                            key={row.id}
                                            style={{
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
                                        </div>
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
                PaperProps={{
                    sx: { bgcolor: 'grey.900', color: 'white' }
                }}
            >
                <MenuItem onClick={handleMenuPlay}>
                    <ListItemIcon>
                        <PlayArrowIcon fontSize='small' sx={{ color: 'grey.400' }} />
                    </ListItemIcon>
                    <ListItemText>Play</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleMenuRemove} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText>Remove</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default QueueTable;
