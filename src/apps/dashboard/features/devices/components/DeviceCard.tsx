import React, { useCallback, useMemo, useState } from 'react';
import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';
import { ChatBubbleIcon, InfoCircledIcon, PauseIcon, PlayIcon, StopIcon } from '@radix-ui/react-icons';
import InputDialog from 'components/InputDialog';
import playmethodhelper from 'components/playback/playmethodhelper';
import globalize from 'lib/globalize';
import getSessionNowPlayingStreamInfo from '../../sessions/utils/getSessionNowPlayingStreamInfo';
import { useSendPlayStateCommand } from '../../sessions/api/usePlayPauseSession';
import { PlaystateCommand } from '@jellyfin/sdk/lib/generated-client/models/playstate-command';
import { useSendMessage } from '../../sessions/api/useSendMessage';
import { Card } from 'ui-primitives/Card';
import { AspectRatio } from 'ui-primitives/AspectRatio';
import { Avatar } from 'ui-primitives/Avatar';
import { IconButton } from 'ui-primitives/IconButton';
import { Progress } from 'ui-primitives/Progress';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';
import { getDeviceIcon } from 'utils/image';
import getNowPlayingName from '../../sessions/utils/getNowPlayingName';
import getSessionNowPlayingTime from '../../sessions/utils/getSessionNowPlayingTime';
import getNowPlayingImageUrl from '../../sessions/utils/getNowPlayingImageUrl';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import SimpleAlert from 'components/SimpleAlert';

interface DeviceCardProps {
    device: SessionInfo;
}

const DeviceCard = ({ device }: DeviceCardProps): React.ReactElement => {
    const [playbackInfoTitle, setPlaybackInfoTitle] = useState('');
    const [playbackInfoDesc, setPlaybackInfoDesc] = useState('');
    const [isPlaybackInfoOpen, setIsPlaybackInfoOpen] = useState(false);
    const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
    const sendMessage = useSendMessage();
    const playStateCommand = useSendPlayStateCommand();

    const onPlayPauseSession = useCallback(() => {
        if (device.Id) {
            playStateCommand.mutate({
                sessionId: device.Id,
                command: PlaystateCommand.PlayPause
            });
        }
    }, [device, playStateCommand]);

    const onStopSession = useCallback(() => {
        if (device.Id) {
            playStateCommand.mutate({
                sessionId: device.Id,
                command: PlaystateCommand.Stop
            });
        }
    }, [device, playStateCommand]);

    const onMessageSend = useCallback(
        (message: string) => {
            if (device.Id) {
                sendMessage.mutate({
                    sessionId: device.Id,
                    messageCommand: {
                        Text: message,
                        TimeoutMs: 5000
                    }
                });
                setIsMessageDialogOpen(false);
            }
        },
        [sendMessage, device]
    );

    const showMessageDialog = useCallback(() => {
        setIsMessageDialogOpen(true);
    }, []);

    const onMessageDialogClose = useCallback(() => {
        setIsMessageDialogOpen(false);
    }, []);

    const closePlaybackInfo = useCallback(() => {
        setIsPlaybackInfoOpen(false);
    }, []);

    const showPlaybackInfo = useCallback(() => {
        const displayPlayMethod = playmethodhelper.getDisplayPlayMethod(device);

        switch (displayPlayMethod) {
            case 'Remux':
                setPlaybackInfoTitle(globalize.translate('Remuxing'));
                setPlaybackInfoDesc(globalize.translate('RemuxHelp1') + '\n' + globalize.translate('RemuxHelp2'));
                break;
            case 'DirectStream':
                setPlaybackInfoTitle(globalize.translate('DirectStreaming'));
                setPlaybackInfoDesc(
                    globalize.translate('DirectStreamHelp1') + '\n' + globalize.translate('DirectStreamHelp2')
                );
                break;
            case 'DirectPlay':
                setPlaybackInfoTitle(globalize.translate('DirectPlaying'));
                setPlaybackInfoDesc(globalize.translate('DirectPlayHelp'));
                break;
            case 'Transcode': {
                const transcodeReasons = device.TranscodingInfo?.TranscodeReasons as string[] | undefined;
                const localizedTranscodeReasons =
                    transcodeReasons?.map(transcodeReason => globalize.translate(transcodeReason)) || [];
                setPlaybackInfoTitle(globalize.translate('Transcoding'));
                setPlaybackInfoDesc(
                    globalize.translate('MediaIsBeingConverted') +
                        '\n\n' +
                        getSessionNowPlayingStreamInfo(device) +
                        '\n\n' +
                        globalize.translate('LabelReasonForTranscoding') +
                        '\n' +
                        localizedTranscodeReasons.join('\n')
                );
                break;
            }
        }

        setIsPlaybackInfoOpen(true);
    }, [device]);

    const nowPlayingName = useMemo(() => getNowPlayingName(device), [device]);

    const nowPlayingImage = useMemo(
        () => device.NowPlayingItem && getNowPlayingImageUrl(device.NowPlayingItem),
        [device]
    );

    const runningTime = useMemo(() => getSessionNowPlayingTime(device), [device]);

    const deviceIcon = useMemo(() => getDeviceIcon(device), [device]);

    const canControl = device.ServerId && device.SupportsRemoteControl;
    const isPlayingMedia = !!device.NowPlayingItem;

    const progressValue =
        device.PlayState?.PositionTicks != null && device.NowPlayingItem?.RunTimeTicks != null
            ? (device.PlayState.PositionTicks / device.NowPlayingItem.RunTimeTicks) * 100
            : 0;

    return (
        <Card style={{ width: '100%', maxWidth: '360px', overflow: 'hidden', padding: 0 }}>
            <InputDialog
                open={isMessageDialogOpen}
                onClose={onMessageDialogClose}
                title={globalize.translate('HeaderSendMessage')}
                label={globalize.translate('LabelMessageText')}
                confirmButtonText={globalize.translate('ButtonSend')}
                onConfirm={onMessageSend}
            />
            <SimpleAlert
                open={isPlaybackInfoOpen}
                title={playbackInfoTitle}
                text={playbackInfoDesc}
                onClose={closePlaybackInfo}
            />
            <AspectRatio ratio="16/9" style={{ borderRadius: 0 }}>
                {nowPlayingImage ? (
                    <img src={nowPlayingImage} alt={nowPlayingName.topText} />
                ) : (
                    <Box className={getDefaultBackgroundClass(device.Id)} />
                )}
                <Box
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.8))',
                        padding: vars.spacing.md,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    <Flex style={{ gap: vars.spacing.md, alignItems: 'center' }}>
                        <Avatar src={deviceIcon} variant="plain" style={{ width: '2.5rem', height: '2.5rem' }} />
                        <Flex style={{ gap: vars.spacing.xs }}>
                            <Heading.H5 style={{ color: vars.colors.text }}>{device.DeviceName}</Heading.H5>
                            <Text size="xs" style={{ color: vars.colors.textSecondary }}>
                                {device.Client + ' ' + device.ApplicationVersion}
                            </Text>
                        </Flex>
                    </Flex>
                    <Flex style={{ gap: vars.spacing.xs, alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <Flex style={{ gap: vars.spacing.xs }}>
                            {nowPlayingName.image ? (
                                <img
                                    src={nowPlayingName.image}
                                    style={{ maxHeight: '24px', maxWidth: '130px' }}
                                    alt="Media Icon"
                                />
                            ) : (
                                <Text
                                    size="sm"
                                    weight="medium"
                                    style={{
                                        color: vars.colors.text,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {nowPlayingName.topText}
                                </Text>
                            )}
                            <Text
                                size="xs"
                                style={{
                                    color: vars.colors.textSecondary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {nowPlayingName.bottomText}
                            </Text>
                        </Flex>
                        {device.NowPlayingItem && (
                            <Text size="xs" style={{ color: vars.colors.text }}>
                                {runningTime.start} / {runningTime.end}
                            </Text>
                        )}
                    </Flex>
                </Box>
            </AspectRatio>

            {isPlayingMedia && <Progress value={progressValue} style={{ height: '4px', borderRadius: 0 }} />}

            <Flex
                style={{
                    gap: vars.spacing.sm,
                    justifyContent: 'center',
                    paddingTop: vars.spacing.sm,
                    paddingBottom: vars.spacing.sm
                }}
            >
                {canControl && isPlayingMedia && (
                    <>
                        <IconButton variant="plain" color="neutral" onClick={onPlayPauseSession}>
                            {device.PlayState?.IsPaused ? <PlayIcon /> : <PauseIcon />}
                        </IconButton>
                        <IconButton variant="plain" color="danger" onClick={onStopSession}>
                            <StopIcon />
                        </IconButton>
                    </>
                )}
                {isPlayingMedia && (
                    <IconButton variant="plain" color="neutral" onClick={showPlaybackInfo}>
                        <InfoCircledIcon />
                    </IconButton>
                )}
                {canControl && (
                    <IconButton variant="plain" color="neutral" onClick={showMessageDialog}>
                        <ChatBubbleIcon />
                    </IconButton>
                )}
            </Flex>

            {device.UserName && (
                <Box
                    style={{
                        borderTop: '1px solid',
                        borderColor: vars.colors.divider,
                        paddingTop: vars.spacing.sm,
                        paddingBottom: vars.spacing.sm,
                        textAlign: 'center'
                    }}
                >
                    <Text size="xs" color="secondary">
                        {device.UserName}
                    </Text>
                </Box>
            )}
        </Card>
    );
};

export default DeviceCard;
