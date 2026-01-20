import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import Box from '@mui/joy/Box';
import Stack from '@mui/joy/Stack';
import Slider from '@mui/joy/Slider';
import AspectRatio from '@mui/joy/AspectRatio';
import Sheet from '@mui/joy/Sheet';
import Chip from '@mui/joy/Chip';
import Input from '@mui/joy/Input';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import StopIcon from '@mui/icons-material/Stop';
import Replay10Icon from '@mui/icons-material/Replay10';
import Forward30Icon from '@mui/icons-material/Forward30';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import InfoIcon from '@mui/icons-material/Info';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import LyricsIcon from '@mui/icons-material/Lyrics';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import SaveIcon from '@mui/icons-material/Save';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import MenuIcon from '@mui/icons-material/Menu';
import SendIcon from '@mui/icons-material/Send';

import {
    useIsPlaying,
    useCurrentItem,
    useCurrentTime,
    useDuration,
    useVolume,
    useIsMuted,
    useRepeatMode,
    useShuffleMode,
    useQueueItems,
    useCurrentQueueIndex,
    usePlaybackActions,
    useQueueActions,
    useFormattedTime,
    useCurrentPlayer
} from '../../../../store';

import { visualizerSettings } from '../../../../components/visualizer/visualizers.logic';
import type { PlayableItem, QueueItem } from '../../../../store/types';
import { logger } from '../../../../utils/logger';
import './NowPlayingPage.scss';

interface QueueListItemProps {
    item: PlayableItem;
    index: number;
    isCurrent: boolean;
    onPlay: (index: number) => void;
    onRemove: (id: string) => void;
}

function QueueListItem({ item, index, isCurrent, onPlay, onRemove }: QueueListItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: `queue-${item.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const trackName = item.name || item.title || 'Unknown Track';
    const artistName = item.artist || item.albumArtist || '';
    const duration = item.duration || 0;
    const imageUrl = item.imageUrl || item.artwork?.[0]?.url;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <ListItem
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`queueListItem ${isCurrent ? 'currentItem' : ''}`}
            sx={{
                bgcolor: isCurrent ? 'rgba(var(--joy-palette-primary-main-rgb), 0.1)' : 'transparent',
                borderRadius: 'sm',
                mb: 0.5,
            }}
        >
            <ListItemButton onClick={() => onPlay(index)}>
                <ListItemDecorator sx={{ width: 24, color: 'text.secondary' }}>
                    {index + 1}
                </ListItemDecorator>
                <ListItemDecorator>
                    <AspectRatio ratio="1" sx={{ width: 40, borderRadius: 'xs', overflow: 'hidden' }}>
                        {imageUrl ? (
                            <img src={imageUrl} alt={trackName} style={{ objectFit: 'cover' }} />
                        ) : (
                            <Box sx={{ bgcolor: 'neutral.700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <MusicNoteIcon sx={{ fontSize: 16, color: 'neutral.400' }} />
                            </Box>
                        )}
                    </AspectRatio>
                </ListItemDecorator>
                <ListItemContent>
                    <Typography level="body-sm" sx={{ fontWeight: isCurrent ? 'bold' : 'normal' }}>
                        {trackName}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>
                        {artistName}
                    </Typography>
                </ListItemContent>
                <Typography level="body-xs" sx={{ color: 'neutral.400', mr: 1 }}>
                    {formatTime(duration)}
                </Typography>
                <Box {...listeners} sx={{ cursor: 'grab', color: 'neutral.400', '&:hover': { color: 'text.primary' } }}>
                    <DragIndicatorIcon fontSize="small" />
                </Box>
            </ListItemButton>
        </ListItem>
    );
}

interface CollapseSectionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

function CollapseSection({ title, children, defaultExpanded = true }: CollapseSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <Sheet variant="outlined" sx={{ borderRadius: 'md', mb: 2 }}>
            <Box
                onClick={() => setExpanded(!expanded)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                }}
            >
                <Typography level="title-sm">{title}</Typography>
                <IconButton size="sm" variant="plain">
                    {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
            </Box>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <Box sx={{ p: 2, pt: 0 }}>
                            {children}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Sheet>
    );
}

interface RemoteControlSectionProps {
    onCommand: (command: string) => void;
}

function RemoteControlSection({ onCommand }: RemoteControlSectionProps) {
    const handleNavClick = (command: string) => () => {
        onCommand(command);
    };

    const navButtonSx = {
        width: 48,
        height: 48,
        bgcolor: 'rgba(255,255,255,0.1)',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
    };

    return (
        <CollapseSection title="Navigation" defaultExpanded={false}>
            <Stack spacing={1} alignItems="center">
                <IconButton sx={navButtonSx} onClick={handleNavClick('MoveUp')}>
                    <KeyboardArrowUpIcon />
                </IconButton>
                <Stack direction="row" spacing={1}>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('MoveLeft')}>
                        <KeyboardArrowLeftIcon />
                    </IconButton>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('Select')}>
                        <KeyboardReturnIcon />
                    </IconButton>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('MoveRight')}>
                        <KeyboardArrowRightIcon />
                    </IconButton>
                </Stack>
                <Stack direction="row" spacing={1}>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('Back')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('MoveDown')}>
                        <KeyboardArrowDownIcon />
                    </IconButton>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('ToggleContextMenu')}>
                        <MenuIcon />
                    </IconButton>
                </Stack>
                <Divider sx={{ my: 1, width: '100%' }} />
                <Stack direction="row" spacing={1}>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('GoHome')}>
                        <HomeIcon />
                    </IconButton>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('GoToSearch')}>
                        <SearchIcon />
                    </IconButton>
                    <IconButton sx={navButtonSx} onClick={handleNavClick('GoToSettings')}>
                        <SettingsIcon />
                    </IconButton>
                </Stack>
            </Stack>
        </CollapseSection>
    );
}

interface MessageSectionProps {
    onSendMessage: (title: string, text: string) => void;
    onSendText: (text: string) => void;
}

function MessageSection({ onSendMessage, onSendText }: MessageSectionProps) {
    const [messageTitle, setMessageTitle] = useState('');
    const [messageText, setMessageText] = useState('');
    const [typeText, setTypeText] = useState('');

    const handleSendMessage = () => {
        if (messageTitle.trim() || messageText.trim()) {
            onSendMessage(messageTitle, messageText);
            setMessageTitle('');
            setMessageText('');
        }
    };

    const handleSendText = () => {
        if (typeText.trim()) {
            onSendText(typeText);
            setTypeText('');
        }
    };

    return (
        <Stack spacing={2}>
                    <CollapseSection title="Send Message" defaultExpanded={false}>
                        <Stack spacing={2}>
                            <Input
                                placeholder="Message title"
                                value={messageTitle}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageTitle(e.target.value)}
                                size="sm"
                            />
                            <Input
                                placeholder="Message text"
                                value={messageText}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageText(e.target.value)}
                                size="sm"
                            />
                            <Button onClick={handleSendMessage} startDecorator={<SendIcon />} size="sm">
                                Send
                            </Button>
                        </Stack>
                    </CollapseSection>

                    <CollapseSection title="Enter Text" defaultExpanded={false}>
                        <Stack spacing={2}>
                            <Input
                                placeholder="Enter text"
                                value={typeText}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTypeText(e.target.value)}
                                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSendText()}
                            />
                            <Button onClick={handleSendText} startDecorator={<SendIcon />} size="sm">
                                Send
                            </Button>
                        </Stack>
                    </CollapseSection>
        </Stack>
    );
}

interface PlaylistSectionProps {
    items: PlayableItem[];
    currentIndex: number;
    onPlayItem: (index: number) => void;
    onRemoveItem: (id: string) => void;
    onMoveItem: (fromIndex: number, toIndex: number) => void;
    onSavePlaylist: () => void;
    onTogglePlaylist: () => void;
}

function PlaylistSection({
    items,
    currentIndex,
    onPlayItem,
    onRemoveItem,
    onMoveItem,
    onSavePlaylist,
    onTogglePlaylist
}: PlaylistSectionProps) {
    const [showPlaylist, setShowPlaylist] = useState(false);

    const handleTogglePlaylist = () => {
        setShowPlaylist(!showPlaylist);
        onTogglePlaylist();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Box className="playlistSection">
            <Stack direction="row" spacing={1} justifyContent="center" className="playlistSectionButton">
                <IconButton onClick={handleTogglePlaylist} title="Playlist">
                    <QueueMusicIcon />
                </IconButton>
                <IconButton onClick={onSavePlaylist} title="Save" className="btnSavePlaylist">
                    <SaveIcon />
                </IconButton>
                <IconButton title="More">
                    <MoreVertIcon />
                </IconButton>
            </Stack>
            <AnimatePresence>
                {showPlaylist && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <List className="playlist itemsContainer vertical-list nowPlayingPlaylist">
                            {items.map((item: PlayableItem, index: number) => (
                                <QueueListItem
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    isCurrent={index === currentIndex}
                                    onPlay={onPlayItem}
                                    onRemove={onRemoveItem}
                                />
                            ))}
                        </List>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
}

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onStop: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onRewind: () => void;
    onFastForward: () => void;
    onSeekChange: (_: React.SyntheticEvent | Event, value: number | number[]) => void;
    onSeek: (_: React.SyntheticEvent | Event, value: number | number[]) => void;
    onSeekStart: () => void;
    onSetVolume: (volume: number) => void;
    onToggleMute: () => void;
    repeatMode: string;
    onToggleRepeat: () => void;
    shuffleMode: string;
    onToggleShuffle: () => void;
    volume: number;
    muted: boolean;
    currentTime: number;
    duration: number;
    currentTimeFormatted: string;
    durationFormatted: string;
    isMobile: boolean;
    localSeekValue: number;
    hasAudioTracks?: boolean;
    hasSubtitles?: boolean;
    onAudioTracks?: () => void;
    onSubtitles?: () => void;
    onFullscreen?: () => void;
    hasLyrics?: boolean;
    onLyrics?: () => void;
}

function PlaybackControls({
    isPlaying,
    onPlayPause,
    onStop,
    onNext,
    onPrevious,
    onRewind,
    onFastForward,
    onSeek,
    onSeekStart,
    onSeekChange,
    onSetVolume,
    onToggleMute,
    repeatMode,
    onToggleRepeat,
    shuffleMode,
    onToggleShuffle,
    volume,
    muted,
    currentTime,
    duration,
    currentTimeFormatted,
    durationFormatted,
    isMobile,
    localSeekValue,
    hasAudioTracks,
    hasSubtitles,
    onAudioTracks,
    onSubtitles,
    onFullscreen,
    hasLyrics,
    onLyrics
}: PlaybackControlsProps) {
    const isRepeatActive = repeatMode !== 'RepeatNone';
    const isShuffleActive = shuffleMode === 'Shuffle';

    return (
        <>
            <Box className="sliderContainer flex" dir="ltr">
                <Box className="positionTime">{currentTimeFormatted}</Box>
                <Box className="nowPlayingPositionSliderContainer mdl-slider-container">
                    <Slider
                        min={0}
                        max={duration || 100}
                        step={0.1}
                        value={localSeekValue}
                        onMouseDown={onSeekStart}
                        onTouchStart={onSeekStart}
                        onChange={onSeekChange}
                        onChangeCommitted={onSeek}
                        size="lg"
                        sx={{
                            '--Slider-trackSize': '6px',
                            '--Slider-thumbSize': '16px',
                            color: 'primary.500',
                        }}
                    />
                </Box>
                <Box className="runtime">{durationFormatted}</Box>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" className="nowPlayingButtonsContainer focuscontainer-x">
                <Stack direction="row" spacing={0.5} alignItems="center" className="nowPlayingInfoButtons">
                    <IconButton
                        onClick={onToggleRepeat}
                        variant="plain"
                        size="sm"
                        sx={{ color: isRepeatActive ? 'primary.500' : 'neutral.50' }}
                        title="Repeat"
                    >
                        {repeatMode === 'RepeatOne' ? <RepeatOneIcon /> : <RepeatIcon />}
                    </IconButton>

                    <IconButton
                        onClick={onRewind}
                        variant="plain"
                        size="sm"
                        sx={{ color: 'neutral.50' }}
                        title="Rewind 10 seconds"
                    >
                        <Replay10Icon />
                    </IconButton>

                    <IconButton
                        onClick={onPrevious}
                        variant="plain"
                        size="sm"
                        sx={{ color: 'neutral.50' }}
                        title="Previous track"
                    >
                        <SkipPreviousIcon />
                    </IconButton>

                    <IconButton
                        onClick={onPlayPause}
                        variant="solid"
                        color="primary"
                        size="lg"
                        sx={{ width: 56, height: 56, borderRadius: '50%' }}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? <PauseIcon sx={{ fontSize: 28 }} /> : <PlayArrowIcon sx={{ fontSize: 28 }} />}
                    </IconButton>

                    <IconButton
                        onClick={onStop}
                        variant="plain"
                        size="sm"
                        sx={{ color: 'neutral.50' }}
                        title="Stop"
                    >
                        <StopIcon />
                    </IconButton>

                    <IconButton
                        onClick={onNext}
                        variant="plain"
                        size="sm"
                        sx={{ color: 'neutral.50' }}
                        title="Next track"
                    >
                        <SkipNextIcon />
                    </IconButton>

                    <IconButton
                        onClick={onFastForward}
                        variant="plain"
                        size="sm"
                        sx={{ color: 'neutral.50' }}
                        title="Fast-forward 30 seconds"
                    >
                        <Forward30Icon />
                    </IconButton>

                    <IconButton
                        onClick={onToggleShuffle}
                        variant="plain"
                        size="sm"
                        sx={{ color: isShuffleActive ? 'primary.500' : 'neutral.50' }}
                        title="Shuffle"
                    >
                        <ShuffleIcon />
                    </IconButton>
                </Stack>

                <Stack direction="row" spacing={0.5} alignItems="center" className="nowPlayingSecondaryButtons">
                    {hasAudioTracks && (
                        <IconButton
                            onClick={onAudioTracks}
                            variant="plain"
                            size="sm"
                            sx={{ color: 'neutral.50' }}
                            title="Audio Tracks"
                        >
                            <AudiotrackIcon />
                        </IconButton>
                    )}

                    {hasSubtitles && (
                        <IconButton
                            onClick={onSubtitles}
                            variant="plain"
                            size="sm"
                            sx={{ color: 'neutral.50' }}
                            title="Subtitles"
                        >
                            <ClosedCaptionIcon />
                        </IconButton>
                    )}

                    <Box className="nowPlayingPageUserDataButtons" />

                    {onFullscreen && (
                        <IconButton
                            onClick={onFullscreen}
                            variant="plain"
                            size="sm"
                            sx={{ color: 'neutral.50' }}
                            title="Fullscreen"
                        >
                            <FullscreenIcon />
                        </IconButton>
                    )}

                    {hasLyrics && (
                        <IconButton
                            onClick={onLyrics}
                            variant="plain"
                            size="sm"
                            sx={{ color: 'neutral.50' }}
                            className="btnLyrics"
                            title="Lyrics"
                        >
                            <LyricsIcon />
                        </IconButton>
                    )}
                </Stack>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                <IconButton
                    onClick={onToggleMute}
                    variant="plain"
                    size="sm"
                    sx={{ color: 'neutral.50' }}
                >
                    {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                <Slider
                    min={0}
                    max={100}
                    value={muted ? 0 : volume}
                    onChange={(_, value) => onSetVolume(Array.isArray(value) ? value[0] : value)}
                    size="sm"
                    sx={{
                        width: 80,
                        '--Slider-trackSize': '3px',
                        '--Slider-thumbSize': '10px',
                        color: 'primary.500',
                    }}
                />
            </Stack>
        </>
    );
}

const NowPlayingPage: React.FC = () => {
    const navigate = useNavigate();
    const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [localSeekValue, setLocalSeekValue] = useState(0);
    const [showPlaylist, setShowPlaylist] = useState(false);
    const [messageTitle, setMessageTitle] = useState('');
    const [messageText, setMessageText] = useState('');
    const [typeText, setTypeText] = useState('');

    const isPlaying = useIsPlaying();
    const currentItem = useCurrentItem();
    const currentTime = useCurrentTime();
    const duration = useDuration();
    const volume = useVolume();
    const muted = useIsMuted();
    const repeatMode = useRepeatMode();
    const shuffleMode = useShuffleMode();
    const queueItems = useQueueItems();
    const currentQueueIndex = useCurrentQueueIndex();
    const { currentTimeFormatted, durationFormatted } = useFormattedTime();
    const currentPlayer = useCurrentPlayer();

    const {
        togglePlayPause,
        stop,
        seek,
        seekPercent,
        setVolume,
        toggleMute,
        setPlaybackRate
    } = usePlaybackActions();

    const {
        next,
        previous,
        toggleRepeatMode,
        toggleShuffleMode,
        setQueue,
        removeFromQueue,
        moveItem
    } = useQueueActions();

    const supportedCommands = currentPlayer?.supportedCommands || [];
    const hasAudioTracks = supportedCommands.includes('SetAudioStreamIndex');
    const hasSubtitles = supportedCommands.includes('SetSubtitleStreamIndex');
    const hasFullscreen = supportedCommands.includes('ToggleFullscreen');
    const hasLyrics = (currentItem as PlayableItem & { hasLyrics?: boolean }).hasLyrics || (currentItem as PlayableItem & { Type?: string }).Type === 'Audio';

    const isMobile = window.innerWidth < 600;

    useEffect(() => {
        const originalState = visualizerSettings.butterchurn.enabled;
        visualizerSettings.butterchurn.enabled = true;
        document.body.classList.add('is-fullscreen-player');

        return () => {
            visualizerSettings.butterchurn.enabled = originalState;
            document.body.classList.remove('is-fullscreen-player');
        };
    }, []);

    useEffect(() => {
        if (!isDragging) {
            setLocalSeekValue(currentTime);
        }
    }, [currentTime, isDragging]);

    const trackName = currentItem?.name || currentItem?.title || 'Unknown Track';
    const artistName = currentItem?.artist || currentItem?.albumArtist || '';
    const albumName = currentItem?.album || '';
    const imageUrl = currentItem?.imageUrl || currentItem?.artwork?.find(img => img.type === 'Primary')?.url || currentItem?.artwork?.[0]?.url;
    const discImageUrl = currentItem?.artwork?.find(img => img.type === 'Disc')?.url;

    const handleSeekChange = (_: React.SyntheticEvent | Event, value: number | number[]) => {
        const seekValue = Array.isArray(value) ? value[0] : value;
        setLocalSeekValue(seekValue);
    };

    const handleSeekEnd = (_: React.SyntheticEvent | Event, value: number | number[]) => {
        const seekValue = Array.isArray(value) ? value[0] : value;
        setIsDragging(false);
        if (duration > 0) {
            const percent = (seekValue / duration) * 100;
            seekPercent(percent);
        }
    };

    const handleSeekStart = () => setIsDragging(true);

    const handlePrevious = () => {
        if (currentTime >= 5 || currentQueueIndex <= 0) {
            seek(0);
        } else {
            previous();
        }
    };

    const handleRewind = () => {
        const newTime = Math.max(0, currentTime - 10);
        seek(newTime);
    };

    const handleFastForward = () => {
        const newTime = Math.min(duration, currentTime + 30);
        seek(newTime);
    };

    const handlePlayItem = (index: number) => {
        setQueue(queueItems, index);
    };

    const handleRemoveItem = (id: string) => {
        removeFromQueue([id]);
    };

    const handleMoveItem = (fromIndex: number, toIndex: number) => {
        moveItem(fromIndex, toIndex);
    };

    const handleSendMessage = (title: string, text: string) => {
        logger.debug('Send message', { component: 'NowPlayingPage', title, text });
        setMessageTitle('');
        setMessageText('');
    };

    const handleSendText = (text: string) => {
        logger.debug('Send text', { component: 'NowPlayingPage', text });
        setTypeText('');
    };

    const handleRemoteCommand = (command: string) => {
        logger.debug('Remote command', { component: 'NowPlayingPage', command });
    };

    const handleSavePlaylist = () => {
        logger.info('Save playlist', { component: 'NowPlayingPage' });
    };

    const handleFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    };

    const handleLyrics = () => {
        navigate('/lyrics');
    };

    if (!currentItem) {
        return (
            <Box className="nowPlayingPageEmpty" sx={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconButton
                    onClick={() => navigate(-1)}
                    variant="plain"
                    sx={{ color: 'neutral.50', position: 'absolute', top: 20, left: 20 }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Typography level="body-lg" sx={{ color: 'neutral.400' }}>No track playing</Typography>
            </Box>
        );
    }

    return (
        <Box className="nowPlayingPage" sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            <Box className="fullscreenBackground" sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <Box className="gradientOverlay" sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))' }} />
            </Box>

            <Stack
                component="header"
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ position: 'relative', zIndex: 1, p: 2 }}
            >
                <IconButton onClick={() => navigate(-1)} variant="plain" sx={{ color: 'neutral.50' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography level="body-sm" sx={{ color: 'neutral.300' }}>
                    {albumName}
                </Typography>
                <IconButton
                    onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
                    variant="plain"
                    sx={{ color: showTechnicalInfo ? 'primary.500' : 'neutral.50' }}
                >
                    <InfoIcon />
                </IconButton>
            </Stack>

            <Stack
                component="main"
                direction={{ xs: 'column', md: 'row' }}
                spacing={4}
                alignItems="center"
                justifyContent="center"
                sx={{ position: 'relative', zIndex: 1, flex: 1, p: 4, height: 'calc(100vh - 80px)' }}
            >
                <Box className="nowPlayingInfoContainer" sx={{ flex: '1 1 auto', maxWidth: 600 }}>
                    <Stack spacing={3}>
                        <Stack direction="row" spacing={3} alignItems="flex-start">
                            <Box sx={{ position: 'relative' }}>
                                <motion.div layoutId="now-playing-art">
                                    <AspectRatio
                                        ratio="1"
                                        sx={{
                                            width: { xs: 280, sm: 320, md: 360 },
                                            borderRadius: 'lg',
                                            overflow: 'hidden',
                                            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                            bgcolor: 'neutral.800',
                                        }}
                                    >
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={trackName} style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'neutral.700' }}>
                                                <MusicNoteIcon sx={{ fontSize: 80, color: 'neutral.400' }} />
                                            </Box>
                                        )}
                                    </AspectRatio>
                                </motion.div>
                                {discImageUrl && (
                                    <motion.div
                                        className="discImage"
                                        style={{
                                            position: 'absolute',
                                            top: -20,
                                            right: -20,
                                            width: 120,
                                            height: 120,
                                            borderRadius: '50%',
                                            backgroundImage: `url(${discImageUrl})`,
                                            backgroundSize: 'cover',
                                        }}
                                        animate={{ rotate: isPlaying ? 360 : 0 }}
                                        transition={{ duration: isPlaying ? 20 : 0, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
                                    />
                                )}
                            </Box>

                            <Box className="infoContainer flex" sx={{ flex: 1, minWidth: 0 }}>
                                <Box className="nowPlayingInfoContainerMedia">
                                    <Typography level="h2" sx={{ color: 'neutral.50', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {trackName}
                                    </Typography>
                                    <Typography level="title-md" sx={{ color: 'neutral.300', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {artistName}
                                    </Typography>
                                    <Typography level="body-sm" sx={{ color: 'neutral.400' }}>
                                        {albumName}
                                    </Typography>
                                </Box>
                                <Box className="nowPlayingPageUserDataButtonsTitle" />
                            </Box>
                        </Stack>

                        <PlaybackControls
                            isPlaying={isPlaying}
                            onPlayPause={togglePlayPause}
                            onStop={stop}
                            onNext={next}
                            onPrevious={handlePrevious}
                            onRewind={handleRewind}
                            onFastForward={handleFastForward}
                            onSeek={handleSeekEnd}
                            onSeekStart={handleSeekStart}
                            onSeekChange={handleSeekChange}
                            onSetVolume={setVolume}
                            onToggleMute={toggleMute}
                            repeatMode={repeatMode}
                            onToggleRepeat={toggleRepeatMode}
                            shuffleMode={shuffleMode}
                            onToggleShuffle={toggleShuffleMode}
                            volume={volume}
                            muted={muted}
                            currentTime={currentTime}
                            duration={duration}
                            currentTimeFormatted={currentTimeFormatted}
                            durationFormatted={durationFormatted}
                            isMobile={isMobile}
                            localSeekValue={localSeekValue}
                            hasAudioTracks={hasAudioTracks}
                            hasSubtitles={hasSubtitles}
                            onAudioTracks={() => {}}
                            onSubtitles={() => {}}
                            onFullscreen={hasFullscreen ? handleFullscreen : undefined}
                            hasLyrics={hasLyrics}
                            onLyrics={handleLyrics}
                        />
                    </Stack>
                </Box>

                <Box className="remoteControlSection" sx={{ flex: '0 0 280px', ml: 3, display: { xs: 'none', lg: 'block' } }}>
                    <Stack spacing={2}>
                        <RemoteControlSection onCommand={handleRemoteCommand} />
                        <MessageSection onSendMessage={handleSendMessage} onSendText={handleSendText} />
                        <PlaylistSection
                            items={queueItems}
                            currentIndex={currentQueueIndex}
                            onPlayItem={handlePlayItem}
                            onRemoveItem={handleRemoveItem}
                            onMoveItem={handleMoveItem}
                            onSavePlaylist={handleSavePlaylist}
                            onTogglePlaylist={() => setShowPlaylist(!showPlaylist)}
                        />
                    </Stack>
                </Box>
            </Stack>

            <AnimatePresence>
                {showTechnicalInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 10 }}
                    >
                        <Sheet
                            variant="soft"
                            sx={{
                                p: 3,
                                borderRadius: 'lg',
                                bgcolor: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            <Typography level="title-sm" sx={{ color: 'neutral.50', mb: 2 }}>
                                Technical Stream Info
                            </Typography>
                            <Stack direction="row" spacing={4} flexWrap="wrap">
                                <Box>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>Codec</Typography>
                                    <Typography level="body-sm" sx={{ color: 'neutral.50' }}>
                                        {currentItem.streamInfo?.codec?.toUpperCase() || 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>Bitrate</Typography>
                                    <Typography level="body-sm" sx={{ color: 'neutral.50' }}>
                                        {currentItem.streamInfo?.bitrate ? `${Math.round(currentItem.streamInfo.bitrate / 1000)} kbps` : 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>Play Method</Typography>
                                    <Typography level="body-sm" sx={{ color: 'neutral.50' }}>
                                        {currentItem.streamInfo?.playMethod || 'Unknown'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography level="body-xs" sx={{ color: 'neutral.400' }}>Engine</Typography>
                                    <Typography level="body-sm" sx={{ color: 'neutral.50' }}>Web Audio</Typography>
                                </Box>
                            </Stack>
                        </Sheet>
                    </motion.div>
                )}
            </AnimatePresence>

            {showPlaylist && (
                <Box
                    className="playlistOverlay"
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'rgba(0,0,0,0.9)',
                        zIndex: 100,
                        p: 3,
                        overflow: 'auto',
                    }}
                >
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography level="title-lg">Playlist</Typography>
                            <IconButton onClick={() => setShowPlaylist(false)}>
                                <ArrowBackIcon />
                            </IconButton>
                        </Stack>
                        <List>
                            {queueItems.map((item, index) => (
                                <QueueListItem
                                    key={`queue-${item.id}`}
                                    item={item}
                                    index={index}
                                    isCurrent={index === currentQueueIndex}
                                    onPlay={handlePlayItem}
                                    onRemove={handleRemoveItem}
                                />
                            ))}
                        </List>
                    </Stack>
                </Box>
            )}
        </Box>
    );
};

export default NowPlayingPage;
