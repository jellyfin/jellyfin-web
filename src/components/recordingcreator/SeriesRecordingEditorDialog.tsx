import { vars } from 'styles/tokens.css.ts';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogPortal,
    DialogOverlayComponent,
    DialogContentComponent,
    DialogCloseButton
} from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Box, Flex } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { SeriesTimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import loading from '../loading/loading';
import toast from '../toast/toast';
import datetime from '../../scripts/datetime';

interface SeriesRecordingEditorDialogProps {
    itemId: string;
    serverId: string;
    enableCancel?: boolean;
    onClose: (result: { updated: boolean; deleted?: boolean }) => void;
}

const KEEP_UP_TO_OPTIONS = [
    { value: '0', label: globalize.translate('AsManyAsPossible') },
    { value: '1', label: globalize.translate('ValueOneEpisode') },
    ...Array.from({ length: 49 }, (_, i) => ({
        value: String(i + 2),
        label: globalize.translate('ValueEpisodeCount', i + 2)
    }))
];

function SeriesRecordingEditorDialog({ itemId, serverId, enableCancel, onClose }: SeriesRecordingEditorDialogProps) {
    const [open, setOpen] = useState(true);
    const [timer, setTimer] = useState<SeriesTimerInfoDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasClosedRef = useRef(false);
    const formRef = useRef<HTMLFormElement>(null);

    const fetchTimer = useCallback(async () => {
        const apiClient = ServerConnections.getApiClient(serverId);
        if (!apiClient) return;

        try {
            const item = await apiClient.getLiveTvSeriesTimer(itemId);
            setTimer(item);
        } catch (error) {
            console.error('Failed to fetch series timer:', error);
        } finally {
            setIsLoading(false);
        }
    }, [itemId, serverId]);

    useEffect(() => {
        fetchTimer();
    }, [fetchTimer]);

    const handleClose = useCallback(() => {
        if (hasClosedRef.current) return;
        hasClosedRef.current = true;
        onClose({ updated: false });
    }, [onClose]);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            if (!next) {
                if (enableCancel === false && formRef.current && timer) {
                    const form = formRef.current;
                    const apiClient = ServerConnections.getApiClient(serverId);
                    if (apiClient) {
                        const prePadding = parseInt(
                            (form.elements.namedItem('prePadding') as HTMLInputElement)?.value || '0',
                            10
                        );
                        const postPadding = parseInt(
                            (form.elements.namedItem('postPadding') as HTMLInputElement)?.value || '0',
                            10
                        );

                        loading.show();
                        apiClient
                            .updateLiveTvSeriesTimer({
                                ...timer,
                                PrePaddingSeconds: prePadding * 60,
                                PostPaddingSeconds: postPadding * 60,
                                RecordAnyChannel:
                                    (form.elements.namedItem('recordAnyChannel') as HTMLInputElement)?.checked ?? false,
                                RecordAnyTime:
                                    (form.elements.namedItem('recordAnyTime') as HTMLInputElement)?.checked ?? false,
                                RecordNewOnly:
                                    (form.elements.namedItem('recordNewOnly') as HTMLInputElement)?.checked ?? false,
                                SkipEpisodesInLibrary:
                                    (form.elements.namedItem('skipEpisodesInLibrary') as HTMLInputElement)?.checked ??
                                    false,
                                KeepUpTo: parseInt(
                                    (form.elements.namedItem('keepUpTo') as HTMLSelectElement)?.value || '0',
                                    10
                                )
                            })
                            .then(() => {
                                handleClose();
                            })
                            .catch(error => {
                                console.error('Failed to auto-save series timer:', error);
                                loading.hide();
                            });
                        return;
                    }
                }
                handleClose();
            }
            setOpen(next);
        },
        [handleClose, enableCancel, serverId, timer]
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!timer) return;

            const form = e.currentTarget;
            const apiClient = ServerConnections.getApiClient(serverId);
            if (!apiClient) return;

            const prePadding = parseInt((form.elements.namedItem('prePadding') as HTMLInputElement)?.value || '0', 10);
            const postPadding = parseInt(
                (form.elements.namedItem('postPadding') as HTMLInputElement)?.value || '0',
                10
            );

            loading.show();
            apiClient
                .updateLiveTvSeriesTimer({
                    ...timer,
                    PrePaddingSeconds: prePadding * 60,
                    PostPaddingSeconds: postPadding * 60,
                    RecordAnyChannel:
                        (form.elements.namedItem('recordAnyChannel') as HTMLInputElement)?.checked ?? false,
                    RecordAnyTime: (form.elements.namedItem('recordAnyTime') as HTMLInputElement)?.checked ?? false,
                    RecordNewOnly: (form.elements.namedItem('recordNewOnly') as HTMLInputElement)?.checked ?? false,
                    SkipEpisodesInLibrary:
                        (form.elements.namedItem('skipEpisodesInLibrary') as HTMLInputElement)?.checked ?? false,
                    KeepUpTo: parseInt((form.elements.namedItem('keepUpTo') as HTMLSelectElement)?.value || '0', 10)
                })
                .then(() => {
                    onClose({ updated: true });
                })
                .catch(error => {
                    console.error('Failed to update series timer:', error);
                    loading.hide();
                });
        },
        [timer, serverId, onClose]
    );

    const handleDelete = useCallback(() => {
        const apiClient = ServerConnections.getApiClient(serverId);
        if (!apiClient) return;

        loading.show();
        import('./recordinghelper').then(({ default: recordingHelper }) => {
            recordingHelper
                .cancelSeriesTimerWithConfirmation(itemId, serverId)
                .then(() => {
                    onClose({ updated: true, deleted: true });
                })
                .catch(() => {
                    loading.hide();
                });
        });
    }, [itemId, serverId, onClose]);

    const prePaddingMinutes = timer ? Math.round((timer.PrePaddingSeconds || 0) / 60) : 0;
    const postPaddingMinutes = timer ? Math.round((timer.PostPaddingSeconds || 0) / 60) : 0;

    const channelInfo = timer?.ChannelName
        ? globalize.translate('ChannelNameOnly', timer.ChannelName)
        : globalize.translate('OneChannel');

    const aroundTime = timer?.StartDate
        ? globalize.translate('AroundTime', datetime.getDisplayTime(datetime.parseISO8601Date(timer.StartDate)))
        : '';

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogPortal>
                <DialogOverlayComponent />
                <DialogContentComponent
                    style={{
                        padding: '32px',
                        maxWidth: '500px',
                        width: 'min(94vw, 500px)',
                        borderRadius: '16px'
                    }}
                >
                    <Flex align="center" justify="space-between" style={{ marginBottom: vars.spacing['5'] }}>
                        <Text as="h3" size="lg" weight="bold">
                            {globalize.translate('SeriesSettings')}
                        </Text>
                        <DialogCloseButton onClick={() => setOpen(false)} />
                    </Flex>

                    {isLoading ? (
                        <Box style={{ padding: '40px', textAlign: 'center' }}>
                            <Text>{globalize.translate('Loading')}</Text>
                        </Box>
                    ) : (
                        <form ref={formRef} onSubmit={handleSubmit}>
                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Input
                                    label={globalize.translate('PrePadding')}
                                    name="prePadding"
                                    type="number"
                                    min={0}
                                    step={1}
                                    defaultValue={prePaddingMinutes}
                                    helperText={globalize.translate('MinutesAfterProgramStarts')}
                                />
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Input
                                    label={globalize.translate('PostPadding')}
                                    name="postPadding"
                                    type="number"
                                    min={0}
                                    step={1}
                                    defaultValue={postPaddingMinutes}
                                    helperText={globalize.translate('MinutesBeforeProgram Ends')}
                                />
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <Text size="sm" style={{ marginBottom: vars.spacing['2'], color: 'var(--text-secondary)' }}>
                                    {globalize.translate('Channel')}
                                </Text>
                                <Text size="md">{channelInfo}</Text>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['4'] }}>
                                <Text size="sm" style={{ marginBottom: vars.spacing['2'], color: 'var(--text-secondary)' }}>
                                    {globalize.translate('AirTime')}
                                </Text>
                                <Text size="md">{aroundTime}</Text>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Select name="recordAnyChannel" defaultValue={timer?.RecordAnyChannel ? 'all' : 'one'}>
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('RecordAnyChannel')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="one">{globalize.translate('OneChannel')}</SelectItem>
                                        <SelectItem value="all">{globalize.translate('AllChannels')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Select name="recordAnyTime" defaultValue={timer?.RecordAnyTime ? 'any' : 'original'}>
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('AirTime')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="original">
                                            {globalize.translate('OriginalAirDate')}
                                        </SelectItem>
                                        <SelectItem value="any">{globalize.translate('AnyTime')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Select name="recordNewOnly" defaultValue={timer?.RecordNewOnly ? 'new' : 'all'}>
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('RecordNewOnly')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{globalize.translate('AllEpisodes')}</SelectItem>
                                        <SelectItem value="new">{globalize.translate('NewEpisodesOnly')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Checkbox name="skipEpisodesInLibrary" defaultChecked={timer?.SkipEpisodesInLibrary}>
                                    {globalize.translate('SkipEpisodesInLibrary')}
                                </Checkbox>
                            </Box>

                            <Box style={{ marginBottom: vars.spacing['5'] }}>
                                <Select name="keepUpTo" defaultValue={String(timer?.KeepUpTo || 0)}>
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('KeepUpTo')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {KEEP_UP_TO_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Box>

                            <Flex justify="space-between" align="center" style={{ marginTop: '32px' }}>
                                <Button variant="ghost" color="danger" onClick={handleDelete}>
                                    {globalize.translate('DeleteSeries')}
                                </Button>
                                <Flex gap="12px">
                                    {enableCancel !== false && (
                                        <Button variant="ghost" onClick={() => setOpen(false)}>
                                            {globalize.translate('Cancel')}
                                        </Button>
                                    )}
                                    <Button variant="primary" type="submit">
                                        {globalize.translate('Save')}
                                    </Button>
                                </Flex>
                            </Flex>
                        </form>
                    )}
                </DialogContentComponent>
            </DialogPortal>
        </Dialog>
    );
}

export { SeriesRecordingEditorDialog };
