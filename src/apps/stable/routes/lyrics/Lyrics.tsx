/**
 * Lyrics View
 *
 * React-based lyrics display with synchronized scrolling during playback.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api/lyrics-api';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { Box, Flex } from 'ui-primitives';
import { Text, Heading } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { LoadingView } from 'components/feedback/LoadingView';
import { vars } from 'styles/tokens.css.ts';

import { ChevronUpIcon, ChevronDownIcon, PlayIcon, PauseIcon } from '@radix-ui/react-icons';

interface LyricLine {
    Start?: number | null | undefined;
    Text?: string | null | undefined;
}

type AutoScroll = 'instant' | 'smooth' | 'none';

export const Lyrics: React.FC = () => {
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoScroll, setAutoScroll] = useState<AutoScroll>('smooth');
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);

    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const currentLineRef = useRef<HTMLDivElement>(null);

    const playbackManager = (window as any).playbackManager;
    const currentItem = playbackManager?.getPlayerState?.()?.NowPlayingItem;

    const fetchLyrics = useCallback(async () => {
        if (!currentItem?.ServerId || !currentItem?.Id) {
            setError('No current track');
            setIsLoading(false);
            return;
        }

        try {
            const apiClient = ServerConnections.getApiClient(currentItem.ServerId);
            const lyricsApi = getLyricsApi(toApi(apiClient));

            const { data } = await lyricsApi.getLyrics({ itemId: currentItem.Id });

            if (!data.Lyrics?.length) {
                setError('No lyrics available');
                setIsLoading(false);
                return;
            }

            setLyrics(data.Lyrics);
            setIsLoading(false);
        } catch (err) {
            setError('Failed to load lyrics');
            setIsLoading(false);
        }
    }, [currentItem]);

    useEffect(() => {
        fetchLyrics();
    }, [fetchLyrics]);

    useEffect(() => {
        if (!lyrics.length) return;

        const updateTime = () => {
            const time = playbackManager?.currentTime?.() || 0;
            setCurrentTime(time);

            const ticks = time * 10000;
            const lineIndex = lyrics.findLastIndex(
                (line, i) => (line.Start ?? 0) <= ticks && (lyrics[i + 1]?.Start ?? Infinity) > ticks
            );
            setCurrentLineIndex(lineIndex);
        };

        const onTimeUpdate = () => updateTime();
        const onPlayStateChange = () => {
            setIsPlaying(!playbackManager?.paused?.());
        };

        const interval = setInterval(updateTime, 500);

        if (playbackManager) {
            playbackManager.addEventListener?.('timeupdate', onTimeUpdate);
            playbackManager.addEventListener?.('playbackstart', onPlayStateChange);
            playbackManager.addEventListener?.('playbackstop', onPlayStateChange);
        }

        return () => {
            clearInterval(interval);
            if (playbackManager) {
                playbackManager.removeEventListener?.('timeupdate', onTimeUpdate);
                playbackManager.removeEventListener?.('playbackstart', onPlayStateChange);
                playbackManager.removeEventListener?.('playbackstop', onPlayStateChange);
            }
        };
    }, [lyrics, playbackManager]);

    useEffect(() => {
        if (autoScroll === 'none' || currentLineIndex < 0 || !currentLineRef.current) return;

        currentLineRef.current.scrollIntoView({
            behavior: autoScroll === 'smooth' ? 'smooth' : 'auto',
            block: 'center'
        });
    }, [currentLineIndex, autoScroll]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return <LoadingView message="Loading lyrics..." />;
    }

    if (error) {
        return (
            <Box style={{ padding: vars.spacing['7'], textAlign: 'center' }}>
                <Heading.H3 style={{ marginBottom: vars.spacing['5'] }}>Lyrics</Heading.H3>
                <Text color="secondary">{error}</Text>
                <Text size="sm" color="secondary" style={{ marginTop: vars.spacing['4'] }}>
                    Play a song to view its lyrics
                </Text>
            </Box>
        );
    }

    return (
        <Box style={{ padding: vars.spacing['6'], maxWidth: 800, margin: '0 auto' }}>
            <Flex style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: vars.spacing['6'] }}>
                <Heading.H3>Lyrics</Heading.H3>
                <Flex style={{ gap: vars.spacing['4'], alignItems: 'center' }}>
                    <Button
                        variant={autoScroll === 'smooth' ? 'soft' : 'plain'}
                        size="sm"
                        onClick={() => setAutoScroll(autoScroll === 'smooth' ? 'none' : 'smooth')}
                    >
                        Auto-scroll
                    </Button>
                </Flex>
            </Flex>

            {currentItem && (
                <Box
                    style={{
                        marginBottom: vars.spacing['6'],
                        padding: vars.spacing['5'],
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.md
                    }}
                >
                    <Text weight="bold">{currentItem.Name}</Text>
                    {currentItem.Artists && (
                        <Text size="sm" color="secondary">
                            {currentItem.Artists.join(', ')}
                        </Text>
                    )}
                </Box>
            )}

            <Box
                ref={lyricsContainerRef}
                style={{
                    maxHeight: 500,
                    overflowY: 'auto',
                    padding: vars.spacing['5'],
                    backgroundColor: vars.colors.backgroundLevel2,
                    borderRadius: vars.borderRadius.md
                }}
            >
                {lyrics.map((line, index) => (
                    <Box
                        key={`${line.Start ?? index}-${line.Text ?? index}`}
                        ref={index === currentLineIndex ? currentLineRef : null}
                        data-lyrictime={line.Start}
                        style={{
                            padding: vars.spacing['4'],
                            marginBottom: vars.spacing['2'],
                            borderRadius: vars.borderRadius.sm,
                            backgroundColor: index === currentLineIndex ? vars.colors.primary + '20' : 'transparent',
                            textAlign: 'center',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        <Text
                            style={{
                                color: index === currentLineIndex ? vars.colors.text : vars.colors.textSecondary,
                                fontWeight: index === currentLineIndex ? 'bold' : 'normal'
                            }}
                        >
                            {line.Text || '...'}
                        </Text>
                    </Box>
                ))}
            </Box>

            <Flex style={{ justifyContent: 'center', gap: vars.spacing['5'], marginTop: vars.spacing['6'] }}>
                <Button
                    variant="plain"
                    onClick={() => {
                        setAutoScroll(autoScroll === 'smooth' ? 'none' : 'smooth');
                    }}
                >
                    {autoScroll === 'smooth' ? 'Disable' : 'Enable'} Auto-scroll
                </Button>
            </Flex>

            {currentItem && (
                <Box style={{ marginTop: vars.spacing['7'], textAlign: 'center' }}>
                    <Text size="sm" color="secondary">
                        {formatTime(currentTime)} / {formatTime((currentItem.RunTimeTicks || 0) / 10000000)}
                    </Text>
                </Box>
            )}
        </Box>
    );
};

export default Lyrics;
