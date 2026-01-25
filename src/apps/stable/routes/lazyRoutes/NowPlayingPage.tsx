import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Box, Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Divider } from 'ui-primitives/Divider';
import { IconButton } from 'ui-primitives/IconButton';
import { Input } from 'ui-primitives/Input';
import { List, ListItem, ListItemContent, ListItemDecorator } from 'ui-primitives/List';
import { ListItemButton } from 'ui-primitives/ListItemButton';
import { Paper } from 'ui-primitives/Paper';
import { Slider } from 'ui-primitives/Slider';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';
import { lyricsRoute } from 'routes/lyrics';

import {
    ArrowLeftIcon,
    BookmarkIcon,
    ChatBubbleIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    DiscIcon,
    DotsVerticalIcon,
    DoubleArrowLeftIcon,
    DoubleArrowRightIcon,
    DragHandleDots2Icon,
    EnterFullScreenIcon,
    EnterIcon,
    GearIcon,
    HamburgerMenuIcon,
    HomeIcon,
    InfoCircledIcon,
    LoopIcon,
    MagnifyingGlassIcon,
    PaperPlaneIcon,
    PauseIcon,
    PlayIcon,
    ReaderIcon,
    SpeakerLoudIcon,
    SpeakerOffIcon,
    StackIcon,
    StopIcon,
    ShuffleIcon,
    TrackNextIcon,
    TrackPreviousIcon
} from '@radix-ui/react-icons';

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
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `queue-${item.id}`
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
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
            {...attributes}
            className={`queueListItem ${isCurrent ? 'currentItem' : ''}`}
            style={{
                ...style,
                backgroundColor: isCurrent ? `${vars.colors.primary}1a` : 'transparent',
                borderRadius: vars.borderRadius.sm,
                marginBottom: vars.spacing.xs
            }}
        >
            <ListItemButton onClick={() => onPlay(index)}>
                <ListItemDecorator style={{ width: 24, color: vars.colors.textSecondary }}>
                    {index + 1}
                </ListItemDecorator>
                <ListItemDecorator>
                    <Box
                        style={{
                            width: 40,
                            aspectRatio: '1 / 1',
                            borderRadius: vars.borderRadius.sm,
                            overflow: 'hidden'
                        }}
                    >
                        {imageUrl ? (
                            <img src={imageUrl} alt={trackName} style={{ objectFit: 'cover' }} />
                        ) : (
                            <Box
                                style={{
                                    backgroundColor: vars.colors.surfaceHover,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <DiscIcon style={{ width: 16, height: 16, color: vars.colors.textMuted }} />
                            </Box>
                        )}
                    </Box>
                </ListItemDecorator>
                <ListItemContent>
                    <Text size="sm" weight={isCurrent ? 'bold' : 'normal'}>
                        {trackName}
                    </Text>
                    <Text size="xs" color="muted">
                        {artistName}
                    </Text>
                </ListItemContent>
                <Text size="xs" color="muted" style={{ marginRight: vars.spacing.xs }}>
                    {formatTime(duration)}
                </Text>
                <Box {...listeners} style={{ cursor: 'grab', color: vars.colors.textMuted }}>
                    <DragHandleDots2Icon style={{ width: 16, height: 16 }} />
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
        <Paper variant="outlined" style={{ borderRadius: vars.borderRadius.md, marginBottom: vars.spacing.md }}>
            <Box
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: vars.spacing.sm,
                    cursor: 'pointer',
                    backgroundColor: 'transparent'
                }}
            >
                <Text size="sm" weight="medium">
                    {title}
                </Text>
                <IconButton size="sm" variant="plain">
                    {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
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
                        <Box style={{ padding: vars.spacing.md, paddingTop: 0 }}>{children}</Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Paper>
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
        backgroundColor: 'rgba(255,255,255,0.1)'
    };

    return (
        <CollapseSection title="Navigation" defaultExpanded={false}>
            <Flex direction="column" align="center" gap={vars.spacing.sm}>
                <IconButton style={navButtonSx} onClick={handleNavClick('MoveUp')}>
                    <ChevronUpIcon />
                </IconButton>
                <Flex direction="row" gap={vars.spacing.sm}>
                    <IconButton style={navButtonSx} onClick={handleNavClick('MoveLeft')}>
                        <ChevronLeftIcon />
                    </IconButton>
                    <IconButton style={navButtonSx} onClick={handleNavClick('Select')}>
                        <EnterIcon />
                    </IconButton>
                    <IconButton style={navButtonSx} onClick={handleNavClick('MoveRight')}>
                        <ChevronRightIcon />
                    </IconButton>
                </Flex>
                <Flex direction="row" gap={vars.spacing.sm}>
                    <IconButton style={navButtonSx} onClick={handleNavClick('Back')}>
                        <ArrowLeftIcon />
                    </IconButton>
                    <IconButton style={navButtonSx} onClick={handleNavClick('MoveDown')}>
                        <ChevronDownIcon />
                    </IconButton>
                    <IconButton style={navButtonSx} onClick={handleNavClick('ToggleContextMenu')}>
                        <HamburgerMenuIcon />
                    </IconButton>
                </Flex>
                <Divider style={{ margin: `${vars.spacing.sm} 0`, width: '100%' }} />
                <Flex direction="row" gap={vars.spacing.sm}>
                    <IconButton style={navButtonSx} onClick={handleNavClick('GoHome')}>
                        <HomeIcon />
                    </IconButton>
                    <IconButton style={navButtonSx} onClick={handleNavClick('GoToSearch')}>
                        <MagnifyingGlassIcon />
                    </IconButton>
                    <IconButton style={navButtonSx} onClick={handleNavClick('GoToSettings')}>
                        <GearIcon />
                    </IconButton>
                </Flex>
            </Flex>
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
        <Flex direction="column" gap={vars.spacing.md}>
            <CollapseSection title="Send Message" defaultExpanded={false}>
                <Flex direction="column" gap={vars.spacing.md}>
                    <Input
                        placeholder="Message title"
                        value={messageTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageTitle(e.target.value)}
                    />
                    <Input
                        placeholder="Message text"
                        value={messageText}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageText(e.target.value)}
                    />
                    <Button onClick={handleSendMessage} startDecorator={<PaperPlaneIcon />} size="sm">
                        Send
                    </Button>
                </Flex>
            </CollapseSection>

            <CollapseSection title="Enter Text" defaultExpanded={false}>
                <Flex direction="column" gap={vars.spacing.md}>
                    <Input
                        placeholder="Enter text"
                        value={typeText}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTypeText(e.target.value)}
                        onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSendText()}
                    />
                    <Button onClick={handleSendText} startDecorator={<PaperPlaneIcon />} size="sm">
                        Send
                    </Button>
                </Flex>
            </CollapseSection>
        </Flex>
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
            <Flex direction="row" justify="center" gap={vars.spacing.sm} className="playlistSectionButton">
                <IconButton onClick={handleTogglePlaylist} title="Playlist">
                    <StackIcon />
                </IconButton>
                <IconButton onClick={onSavePlaylist} title="Save" className="btnSavePlaylist">
                    <BookmarkIcon />
                </IconButton>
                <IconButton title="More">
                    <DotsVerticalIcon />
                </IconButton>
            </Flex>
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
    onSeekChange: (value: number[]) => void;
    onSeek: (value: number[]) => void;
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
                        value={[localSeekValue]}
                        onMouseDown={onSeekStart}
                        onTouchStart={onSeekStart}
                        onValueChange={onSeekChange}
                        onValueCommit={onSeek}
                    />
                </Box>
                <Box className="runtime">{durationFormatted}</Box>
            </Box>

            <Flex
                direction="row"
                align="center"
                justify="space-between"
                className="nowPlayingButtonsContainer focuscontainer-x"
                gap={vars.spacing.sm}
            >
                <Flex direction="row" align="center" className="nowPlayingInfoButtons" gap={vars.spacing.xs}>
                    <IconButton
                        onClick={onToggleRepeat}
                        variant="plain"
                        size="sm"
                        color={isRepeatActive ? 'primary' : 'neutral'}
                        title="Repeat"
                    >
                        <LoopIcon />
                    </IconButton>

                    <IconButton onClick={onRewind} variant="plain" size="sm" color="neutral" title="Rewind 10 seconds">
                        <DoubleArrowLeftIcon />
                    </IconButton>

                    <IconButton onClick={onPrevious} variant="plain" size="sm" color="neutral" title="Previous track">
                        <TrackPreviousIcon />
                    </IconButton>

                    <IconButton
                        onClick={onPlayPause}
                        variant="solid"
                        size="lg"
                        style={{ width: 56, height: 56, borderRadius: '50%' }}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <PauseIcon style={{ width: 28, height: 28 }} />
                        ) : (
                            <PlayIcon style={{ width: 28, height: 28 }} />
                        )}
                    </IconButton>

                    <IconButton onClick={onStop} variant="plain" size="sm" color="neutral" title="Stop">
                        <StopIcon />
                    </IconButton>

                    <IconButton onClick={onNext} variant="plain" size="sm" color="neutral" title="Next track">
                        <TrackNextIcon />
                    </IconButton>

                    <IconButton
                        onClick={onFastForward}
                        variant="plain"
                        size="sm"
                        color="neutral"
                        title="Fast-forward 30 seconds"
                    >
                        <DoubleArrowRightIcon />
                    </IconButton>

                    <IconButton
                        onClick={onToggleShuffle}
                        variant="plain"
                        size="sm"
                        color={isShuffleActive ? 'primary' : 'neutral'}
                        title="Shuffle"
                    >
                        <ShuffleIcon />
                    </IconButton>
                </Flex>

                <Flex direction="row" align="center" className="nowPlayingSecondaryButtons" gap={vars.spacing.xs}>
                    {hasAudioTracks && (
                        <IconButton
                            onClick={onAudioTracks}
                            variant="plain"
                            size="sm"
                            color="neutral"
                            title="Audio Tracks"
                        >
                            <DiscIcon />
                        </IconButton>
                    )}

                    {hasSubtitles && (
                        <IconButton onClick={onSubtitles} variant="plain" size="sm" color="neutral" title="Subtitles">
                            <ReaderIcon />
                        </IconButton>
                    )}

                    <Box className="nowPlayingPageUserDataButtons" />

                    {onFullscreen && (
                        <IconButton onClick={onFullscreen} variant="plain" size="sm" color="neutral" title="Fullscreen">
                            <EnterFullScreenIcon />
                        </IconButton>
                    )}

                    {hasLyrics && (
                        <IconButton
                            onClick={onLyrics}
                            variant="plain"
                            size="sm"
                            color="neutral"
                            className="btnLyrics"
                            title="Lyrics"
                        >
                            <ChatBubbleIcon />
                        </IconButton>
                    )}
                </Flex>
            </Flex>

            <Flex direction="row" align="center" gap={vars.spacing.xs} style={{ marginTop: vars.spacing.xs }}>
                <IconButton onClick={onToggleMute} variant="plain" size="sm" color="neutral">
                    {muted ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
                </IconButton>
                <Slider
                    min={0}
                    max={100}
                    value={[muted ? 0 : volume]}
                    onValueChange={value => onSetVolume(value[0] ?? 0)}
                    style={{ width: 80 }}
                />
            </Flex>
        </>
    );
}

const NowPlayingPage: React.FC = () => {
    const router = useRouter();
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

    const { togglePlayPause, stop, seek, seekPercent, setVolume, toggleMute, setPlaybackRate } = usePlaybackActions();

    const { next, previous, toggleRepeatMode, toggleShuffleMode, setQueue, removeFromQueue, moveItem } =
        useQueueActions();

    const supportedCommands = currentPlayer?.supportedCommands || [];
    const hasAudioTracks = supportedCommands.includes('SetAudioStreamIndex');
    const hasSubtitles = supportedCommands.includes('SetSubtitleStreamIndex');
    const hasFullscreen = supportedCommands.includes('ToggleFullscreen');
    const hasLyrics =
        (currentItem as PlayableItem & { hasLyrics?: boolean }).hasLyrics ||
        (currentItem as PlayableItem & { Type?: string }).Type === 'Audio';

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
    const imageUrl =
        currentItem?.imageUrl ||
        currentItem?.artwork?.find(img => img.type === 'Primary')?.url ||
        currentItem?.artwork?.[0]?.url;
    const discImageUrl = currentItem?.artwork?.find(img => img.type === 'Disc')?.url;

    const handleSeekChange = (value: number[]) => {
        setLocalSeekValue(value[0] ?? 0);
    };

    const handleSeekEnd = (value: number[]) => {
        const seekValue = value[0] ?? 0;
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
        navigate({ to: '/lyrics' });
    };

    if (!currentItem) {
        return (
            <Box
                className="nowPlayingPageEmpty"
                style={{
                    position: 'relative',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <IconButton
                    onClick={() => router.history.back()}
                    variant="plain"
                    color="neutral"
                    style={{ position: 'absolute', top: 20, left: 20 }}
                >
                    <ArrowLeftIcon />
                </IconButton>
                <Text size="lg" color="secondary">
                    No track playing
                </Text>
            </Box>
        );
    }

    return (
        <Box className="nowPlayingPage" style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            <Box className="fullscreenBackground" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <Box
                    className="gradientOverlay"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))'
                    }}
                />
            </Box>

            <Flex
                as="header"
                direction="row"
                justify="space-between"
                align="center"
                style={{ position: 'relative', zIndex: 1, padding: vars.spacing.md }}
            >
                <IconButton onClick={() => router.history.back()} variant="plain" color="neutral">
                    <ArrowLeftIcon />
                </IconButton>
                <Text size="sm" color="secondary">
                    {albumName}
                </Text>
                <IconButton
                    onClick={() => setShowTechnicalInfo(!showTechnicalInfo)}
                    variant="plain"
                    color={showTechnicalInfo ? 'primary' : 'neutral'}
                >
                    <InfoCircledIcon />
                </IconButton>
            </Flex>

            <Flex
                as="main"
                direction={isMobile ? 'column' : 'row'}
                gap={vars.spacing.xl}
                align="center"
                justify="center"
                style={{
                    position: 'relative',
                    zIndex: 1,
                    flex: 1,
                    padding: vars.spacing.xl,
                    height: 'calc(100vh - 80px)'
                }}
            >
                <Box className="nowPlayingInfoContainer" style={{ flex: '1 1 auto', maxWidth: 600 }}>
                    <Flex direction="column" gap={vars.spacing.lg}>
                        <Flex direction="row" gap={vars.spacing.lg} align="flex-start">
                            <Box style={{ position: 'relative' }}>
                                <motion.div layoutId="now-playing-art">
                                    <Box
                                        style={{
                                            width: isMobile ? 280 : 360,
                                            aspectRatio: '1 / 1',
                                            borderRadius: vars.borderRadius.lg,
                                            overflow: 'hidden',
                                            boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                            backgroundColor: vars.colors.surface
                                        }}
                                    >
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={trackName} style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <Box
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: vars.colors.surfaceHover
                                                }}
                                            >
                                                <DiscIcon
                                                    style={{ width: 80, height: 80, color: vars.colors.textMuted }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
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
                                            backgroundSize: 'cover'
                                        }}
                                        animate={{ rotate: isPlaying ? 360 : 0 }}
                                        transition={{
                                            duration: isPlaying ? 20 : 0,
                                            repeat: isPlaying ? Infinity : 0,
                                            ease: 'linear'
                                        }}
                                    />
                                )}
                            </Box>

                            <Box className="infoContainer flex" style={{ flex: 1, minWidth: 0 }}>
                                <Box className="nowPlayingInfoContainerMedia">
                                    <Text
                                        as="h2"
                                        size="xl"
                                        weight="bold"
                                        style={{
                                            color: vars.colors.text,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {trackName}
                                    </Text>
                                    <Text
                                        size="lg"
                                        color="secondary"
                                        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    >
                                        {artistName}
                                    </Text>
                                    <Text size="sm" color="muted">
                                        {albumName}
                                    </Text>
                                </Box>
                                <Box className="nowPlayingPageUserDataButtonsTitle" />
                            </Box>
                        </Flex>

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
                    </Flex>
                </Box>

                <Box
                    className="remoteControlSection"
                    style={{ flex: '0 0 280px', marginLeft: vars.spacing.lg, display: isMobile ? 'none' : 'block' }}
                >
                    <Flex direction="column" gap={vars.spacing.md}>
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
                    </Flex>
                </Box>
            </Flex>

            <AnimatePresence>
                {showTechnicalInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 10 }}
                    >
                        <Paper
                            variant="outlined"
                            style={{
                                padding: vars.spacing.lg,
                                borderRadius: vars.borderRadius.lg,
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(20px)'
                            }}
                        >
                            <Text
                                size="sm"
                                weight="medium"
                                style={{ color: vars.colors.text, marginBottom: vars.spacing.md }}
                            >
                                Technical Stream Info
                            </Text>
                            <Flex direction="row" gap={vars.spacing.lg} wrap="wrap">
                                <Box>
                                    <Text size="xs" color="muted">
                                        Codec
                                    </Text>
                                    <Text size="sm" style={{ color: vars.colors.text }}>
                                        {currentItem.streamInfo?.codec?.toUpperCase() || 'Unknown'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text size="xs" color="muted">
                                        Bitrate
                                    </Text>
                                    <Text size="sm" style={{ color: vars.colors.text }}>
                                        {currentItem.streamInfo?.bitrate
                                            ? `${Math.round(currentItem.streamInfo.bitrate / 1000)} kbps`
                                            : 'Unknown'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text size="xs" color="muted">
                                        Play Method
                                    </Text>
                                    <Text size="sm" style={{ color: vars.colors.text }}>
                                        {currentItem.streamInfo?.playMethod || 'Unknown'}
                                    </Text>
                                </Box>
                                <Box>
                                    <Text size="xs" color="muted">
                                        Engine
                                    </Text>
                                    <Text size="sm" style={{ color: vars.colors.text }}>
                                        Web Audio
                                    </Text>
                                </Box>
                            </Flex>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {showPlaylist && (
                <Box
                    className="playlistOverlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        zIndex: 100,
                        padding: vars.spacing.lg,
                        overflow: 'auto'
                    }}
                >
                    <Flex direction="column" gap={vars.spacing.md}>
                        <Flex direction="row" justify="space-between" align="center">
                            <Text size="lg" weight="bold">
                                Playlist
                            </Text>
                            <IconButton onClick={() => setShowPlaylist(false)}>
                                <ArrowLeftIcon />
                            </IconButton>
                        </Flex>
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
                    </Flex>
                </Box>
            )}
        </Box>
    );
};

export default NowPlayingPage;
