import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Box,
    Button,
    Dialog,
    DialogCloseButton,
    DialogContentComponent,
    DialogOverlayComponent,
    DialogPortal,
    Flex,
    Text
} from 'ui-primitives';
import serverNotifications from '../../scripts/serverNotifications';
import Events, { Callback as EventsCallback, Event as EventsEvent } from '../../utils/events';
import loading from '../loading/loading';
import { playbackManager } from '../playback/playbackmanager';
import toast from '../toast/toast';
import PlaceholderImage from './empty.png';
import recordingHelper from './recordinghelper';

type LiveTvProgram = BaseItemDto & {
    PrimaryImageTag?: string;
};

interface RecordingCreatorDialogProps {
    serverId: string;
    programId: string;
    onClose: (result: { changed: boolean }) => void;
}

function getProgramImage(program: LiveTvProgram | null, serverId: string): string | null {
    if (!program?.Id) {
        return null;
    }

    const apiClient = ServerConnections.getApiClient(serverId);
    if (!apiClient) {
        return null;
    }

    const imageTags = { ...(program.ImageTags || {}) } as Record<string, string>;
    if (program.PrimaryImageTag) {
        imageTags.Primary = program.PrimaryImageTag;
    }

    if (imageTags.Primary) {
        return apiClient.getScaledImageUrl(program.Id, {
            type: 'Primary',
            maxHeight: 340,
            tag: imageTags.Primary
        });
    }

    if (imageTags.Thumb) {
        return apiClient.getScaledImageUrl(program.Id, {
            type: 'Thumb',
            maxHeight: 340,
            tag: imageTags.Thumb
        });
    }

    return null;
}

function RecordingCreatorDialog({ programId, serverId, onClose }: RecordingCreatorDialogProps) {
    const [open, setOpen] = useState(true);
    const [program, setProgram] = useState<LiveTvProgram | null>(null);
    const [timerId, setTimerId] = useState<string | null>(null);
    const [seriesTimerId, setSeriesTimerId] = useState<string | null>(null);
    const [timerStatus, setTimerStatus] = useState<string | null>(null);
    const changedRef = useRef(false);
    const closeActionRef = useRef<'play' | null>(null);
    const hasClosedRef = useRef(false);
    const timerIdRef = useRef<string | null>(null);
    const seriesTimerIdRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    const markDirty = useCallback(() => {
        if (!changedRef.current) {
            changedRef.current = true;
        }
    }, []);

    const fetchProgram = useCallback(async () => {
        const apiClient = ServerConnections.getApiClient(serverId);
        if (!apiClient) {
            return;
        }

        loading.show();
        try {
            const item = await apiClient.getLiveTvProgram(programId, apiClient.getCurrentUserId());
            if (!mountedRef.current) {
                return;
            }
            setProgram(item);
            setTimerId(item.TimerId || null);
            setTimerStatus(item.Status || null);
            setSeriesTimerId(item.SeriesTimerId || null);
        } catch (error) {
            // swallow to keep dialog usable
        } finally {
            loading.hide();
        }
    }, [programId, serverId]);

    useEffect(() => {
        mountedRef.current = true;
        fetchProgram();
        return () => {
            mountedRef.current = false;
            loading.hide();
        };
    }, [fetchProgram]);

    useEffect(() => {
        timerIdRef.current = timerId;
    }, [timerId]);

    useEffect(() => {
        seriesTimerIdRef.current = seriesTimerId;
    }, [seriesTimerId]);

    useEffect(() => {
        const handler: EventsCallback = (_event: EventsEvent, data: any) => {
            if (
                data?.ProgramId === programId ||
                data?.Id === timerIdRef.current ||
                data?.Id === seriesTimerIdRef.current
            ) {
                fetchProgram();
            }
        };

        Events.on(serverNotifications, 'TimerCreated', handler);
        Events.on(serverNotifications, 'TimerCancelled', handler);
        Events.on(serverNotifications, 'SeriesTimerCreated', handler);
        Events.on(serverNotifications, 'SeriesTimerCancelled', handler);

        return () => {
            Events.off(serverNotifications, 'TimerCreated', handler);
            Events.off(serverNotifications, 'TimerCancelled', handler);
            Events.off(serverNotifications, 'SeriesTimerCreated', handler);
            Events.off(serverNotifications, 'SeriesTimerCancelled', handler);
        };
    }, [fetchProgram, programId]);

    const imageUrl = useMemo(() => getProgramImage(program, serverId), [program, serverId]);
    const displayGenres = useMemo(() => (program?.Genres || []).join(' / '), [program?.Genres]);
    const hasActiveTimer = Boolean(timerId && timerStatus && timerStatus !== 'Cancelled');
    const hasSeriesTimer = Boolean(seriesTimerId);
    const showSeriesControls = Boolean(program?.IsSeries);
    const recordButtonLabel = hasActiveTimer
        ? timerStatus === 'InProgress'
            ? globalize.translate('StopRecording')
            : globalize.translate('DoNotRecord')
        : globalize.translate('Record');
    const seriesButtonLabel = hasSeriesTimer
        ? globalize.translate('CancelSeries')
        : globalize.translate('RecordSeries');

    const handleDialogClose = useCallback(() => {
        if (hasClosedRef.current) {
            return;
        }
        hasClosedRef.current = true;

        const finish = () => {
            onClose({ changed: changedRef.current });
        };

        if (closeActionRef.current === 'play') {
            const apiClient = ServerConnections.getApiClient(serverId);
            if (!apiClient) {
                finish();
                return;
            }

            apiClient
                .getLiveTvProgram(programId, apiClient.getCurrentUserId())
                .then((item) => {
                    const channelId = item?.ChannelId || item?.Id;
                    if (channelId) {
                        playbackManager.play({ ids: [channelId], serverId });
                    }
                })
                .finally(finish);
        } else {
            finish();
        }
    }, [onClose, programId, serverId]);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!next) {
                handleDialogClose();
            }
            setOpen(next);
        },
        [handleDialogClose]
    );

    const toggleRecording = useCallback(async () => {
        const apiClient = ServerConnections.getApiClient(serverId);
        if (!apiClient) {
            return;
        }

        if (!hasActiveTimer || !timerId) {
            await recordingHelper.createRecording(apiClient, programId);
        } else {
            await recordingHelper.cancelTimer(apiClient, timerId, true);
        }

        markDirty();
        fetchProgram();
    }, [fetchProgram, hasActiveTimer, programId, serverId, timerId, markDirty]);

    const toggleSeriesRecording = useCallback(async () => {
        if (!program) {
            return;
        }

        const apiClient = ServerConnections.getApiClient(serverId);
        if (!apiClient) {
            return;
        }

        if (!seriesTimerId) {
            if (timerId && timerStatus && timerStatus !== 'Cancelled') {
                await recordingHelper.changeRecordingToSeries(apiClient, timerId, programId);
            } else {
                await recordingHelper.createRecording(apiClient, programId, true);
            }
        } else {
            await apiClient.cancelLiveTvSeriesTimer(seriesTimerId);
            toast(globalize.translate('RecordingCancelled'));
        }

        markDirty();
        fetchProgram();
    }, [
        fetchProgram,
        markDirty,
        program,
        programId,
        serverId,
        seriesTimerId,
        timerId,
        timerStatus
    ]);

    const handlePlay = useCallback(() => {
        closeActionRef.current = 'play';
        setOpen(false);
    }, []);

    const handleManageRecording = useCallback(() => {
        if (!timerId) {
            return;
        }

        import('./recordingeditor').then(({ default: recordingEditor }) => {
            recordingEditor.show(timerId, serverId, { enableCancel: false }).then(() => {
                markDirty();
                fetchProgram();
            });
        });
    }, [fetchProgram, markDirty, serverId, timerId]);

    const handleManageSeriesRecording = useCallback(() => {
        if (!seriesTimerId) {
            return;
        }

        import('./seriesrecordingeditor').then(({ default: seriesRecordingEditor }) => {
            seriesRecordingEditor
                .show(seriesTimerId, serverId, { enableCancel: false })
                .then(() => {
                    markDirty();
                    fetchProgram();
                });
        });
    }, [fetchProgram, markDirty, serverId, seriesTimerId]);

    const heroTitle = program?.Name || globalize.translate('Record');

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogPortal>
                <DialogOverlayComponent />
                <DialogContentComponent
                    style={{
                        padding: '32px',
                        maxWidth: '760px',
                        width: 'min(94vw, 760px)',
                        borderRadius: '24px'
                    }}
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        style={{ marginBottom: vars.spacing['4'] }}
                    >
                        <Text as="h3" size="xl" weight="bold">
                            {heroTitle}
                        </Text>
                        <DialogCloseButton onClick={() => setOpen(false)} />
                    </Flex>

                    <Flex
                        direction="row"
                        align="flex-start"
                        gap="24px"
                        style={{ marginBottom: vars.spacing['4'] }}
                    >
                        <Box
                            style={{
                                width: 160,
                                minWidth: 160,
                                height: 240,
                                borderRadius: 16,
                                overflow: 'hidden',
                                backgroundColor: 'var(--surface)'
                            }}
                        >
                            <img
                                src={imageUrl || PlaceholderImage}
                                alt={program?.Name || globalize.translate('Record')}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </Box>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                            {program?.Overview && (
                                <Text
                                    size="md"
                                    style={{
                                        marginBottom: vars.spacing['2'],
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    {program.Overview}
                                </Text>
                            )}
                            {displayGenres && (
                                <Text size="sm" style={{ color: 'var(--text-secondary)' }}>
                                    {displayGenres}
                                </Text>
                            )}
                        </Box>
                    </Flex>

                    {showSeriesControls && (
                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <Text
                                size="sm"
                                style={{
                                    marginBottom: vars.spacing['2'],
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                {globalize.translate('RecordSeries')}
                            </Text>
                            <Flex align="center" gap="12px">
                                <Button
                                    variant={hasSeriesTimer ? 'danger' : 'primary'}
                                    size="md"
                                    startIcon={
                                        <span className="material-icons">fiber_smart_record</span>
                                    }
                                    onClick={toggleSeriesRecording}
                                >
                                    {seriesButtonLabel}
                                </Button>
                                {hasSeriesTimer && (
                                    <Button
                                        variant="ghost"
                                        size="md"
                                        color="neutral"
                                        onClick={handleManageSeriesRecording}
                                    >
                                        {globalize.translate('SeriesSettings')}
                                    </Button>
                                )}
                            </Flex>
                        </Box>
                    )}

                    <Box style={{ marginBottom: vars.spacing['5'] }}>
                        <Text
                            size="sm"
                            style={{
                                marginBottom: vars.spacing['2'],
                                color: 'var(--text-secondary)'
                            }}
                        >
                            {globalize.translate('Record')}
                        </Text>
                        <Flex align="center" gap="12px">
                            <Button
                                variant={hasActiveTimer ? 'danger' : 'primary'}
                                size="md"
                                startIcon={
                                    <span className="material-icons">fiber_manual_record</span>
                                }
                                onClick={toggleRecording}
                            >
                                {recordButtonLabel}
                            </Button>
                            {hasActiveTimer && (
                                <Button
                                    variant="ghost"
                                    size="md"
                                    color="neutral"
                                    onClick={handleManageRecording}
                                >
                                    {globalize.translate('Settings')}
                                </Button>
                            )}
                        </Flex>
                    </Box>

                    <Flex justify="flex-end">
                        <Button
                            variant="ghost"
                            size="md"
                            color="neutral"
                            startIcon={<span className="material-icons">play_arrow</span>}
                            onClick={handlePlay}
                        >
                            {globalize.translate('Play')}
                        </Button>
                    </Flex>
                </DialogContentComponent>
            </DialogPortal>
        </Dialog>
    );
}

export { RecordingCreatorDialog };
