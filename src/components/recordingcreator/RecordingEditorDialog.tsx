import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogPortal,
    DialogOverlayComponent,
    DialogContentComponent,
    DialogCloseButton
} from 'ui-primitives/Dialog';
import { Button } from 'ui-primitives/Button';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Input } from 'ui-primitives/Input';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { TimerInfoDto } from '@jellyfin/sdk/lib/generated-client';
import loading from '../loading/loading';

interface RecordingEditorDialogProps {
    itemId: string;
    serverId: string;
    enableCancel?: boolean;
    onClose: (result: { updated: boolean; deleted?: boolean }) => void;
}

function RecordingEditorDialog({ itemId, serverId, enableCancel, onClose }: RecordingEditorDialogProps) {
    const [open, setOpen] = useState(true);
    const [timer, setTimer] = useState<TimerInfoDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasClosedRef = useRef(false);
    const formRef = useRef<HTMLFormElement>(null);

    const fetchTimer = useCallback(async () => {
        const apiClient = ServerConnections.getApiClient(serverId);
        if (!apiClient) return;

        try {
            const item = await apiClient.getLiveTvTimer(itemId);
            setTimer(item);
        } catch (error) {
            console.error('Failed to fetch timer:', error);
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
                if (enableCancel === false && formRef.current) {
                    const form = formRef.current;
                    const prePaddingInput = form.elements.namedItem('prePadding') as HTMLInputElement;
                    const postPaddingInput = form.elements.namedItem('postPadding') as HTMLInputElement;
                    const prePadding = parseInt(prePaddingInput?.value || '0', 10);
                    const postPadding = parseInt(postPaddingInput?.value || '0', 10);

                    const apiClient = ServerConnections.getApiClient(serverId);
                    if (apiClient && timer) {
                        loading.show();
                        apiClient
                            .updateLiveTvTimer({
                                ...timer,
                                PrePaddingSeconds: prePadding * 60,
                                PostPaddingSeconds: postPadding * 60
                            })
                            .then(() => {
                                handleClose();
                            })
                            .catch(error => {
                                console.error('Failed to auto-save timer:', error);
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
            const prePaddingInput = form.elements.namedItem('prePadding') as HTMLInputElement;
            const postPaddingInput = form.elements.namedItem('postPadding') as HTMLInputElement;
            const prePadding = parseInt(prePaddingInput?.value || '0', 10);
            const postPadding = parseInt(postPaddingInput?.value || '0', 10);

            const apiClient = ServerConnections.getApiClient(serverId);
            if (!apiClient) return;

            loading.show();
            apiClient
                .updateLiveTvTimer({
                    ...timer,
                    PrePaddingSeconds: prePadding * 60,
                    PostPaddingSeconds: postPadding * 60
                })
                .then(() => {
                    onClose({ updated: true });
                })
                .catch(error => {
                    console.error('Failed to update timer:', error);
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
                .cancelTimerWithConfirmation(itemId, serverId)
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
                    <Flex align="center" justify="space-between" style={{ marginBottom: '24px' }}>
                        <Text as="h3" size="lg" weight="bold">
                            {globalize.translate('RecordingSettings')}
                        </Text>
                        <DialogCloseButton onClick={() => setOpen(false)} />
                    </Flex>

                    {isLoading ? (
                        <Box style={{ padding: '40px', textAlign: 'center' }}>
                            <Text>{globalize.translate('Loading')}</Text>
                        </Box>
                    ) : (
                        <form ref={formRef} onSubmit={handleSubmit}>
                            <Box style={{ marginBottom: '24px' }}>
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

                            <Box style={{ marginBottom: '24px' }}>
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

                            <Flex justify="space-between" align="center" style={{ marginTop: '32px' }}>
                                <Button variant="ghost" color="danger" onClick={handleDelete}>
                                    {globalize.translate('DeleteRecording')}
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

export { RecordingEditorDialog };
