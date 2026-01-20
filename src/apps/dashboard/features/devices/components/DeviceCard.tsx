import React, { useCallback, useMemo, useState } from 'react';
import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';
import Box from '@mui/joy/Box';
import Card from '@mui/joy/Card';
import Typography from '@mui/joy/Typography';
import AspectRatio from '@mui/joy/AspectRatio';
import { getDeviceIcon } from 'utils/image';
import Stack from '@mui/joy/Stack';
import getNowPlayingName from '../../sessions/utils/getNowPlayingName';
import getSessionNowPlayingTime from '../../sessions/utils/getSessionNowPlayingTime';
import getNowPlayingImageUrl from '../../sessions/utils/getNowPlayingImageUrl';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import Comment from '@mui/icons-material/Comment';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import Stop from '@mui/icons-material/Stop';
import Info from '@mui/icons-material/Info';
import LinearProgress from '@mui/joy/LinearProgress';
import IconButton from '@mui/joy/IconButton';
import SimpleAlert from 'components/SimpleAlert';
import playmethodhelper from 'components/playback/playmethodhelper';
import globalize from 'lib/globalize';
import getSessionNowPlayingStreamInfo from '../../sessions/utils/getSessionNowPlayingStreamInfo';
import { useSendPlayStateCommand } from '../../sessions/api/usePlayPauseSession';
import { PlaystateCommand } from '@jellyfin/sdk/lib/generated-client/models/playstate-command';
import InputDialog from 'components/InputDialog';
import { useSendMessage } from '../../sessions/api/useSendMessage';

type DeviceCardProps = {
    device: SessionInfo;
};

const DeviceCard = ({ device }: DeviceCardProps) => {
    const [ playbackInfoTitle, setPlaybackInfoTitle ] = useState('');
    const [ playbackInfoDesc, setPlaybackInfoDesc ] = useState('');
    const [ isPlaybackInfoOpen, setIsPlaybackInfoOpen ] = useState(false);
    const [ isMessageDialogOpen, setIsMessageDialogOpen ] = useState(false);
    const sendMessage = useSendMessage();
    const playStateCommand = useSendPlayStateCommand();

    const onPlayPauseSession = useCallback(() => {
        if (device.Id) {
            playStateCommand.mutate({
                sessionId: device.Id,
                command: PlaystateCommand.PlayPause
            });
        }
    }, [ device, playStateCommand ]);

    const onStopSession = useCallback(() => {
        if (device.Id) {
            playStateCommand.mutate({
                sessionId: device.Id,
                command: PlaystateCommand.Stop
            });
        }
    }, [ device, playStateCommand ]);

    const onMessageSend = useCallback((message: string) => {
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
    }, [ sendMessage, device ]);

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
                setPlaybackInfoDesc(globalize.translate('DirectStreamHelp1') + '\n' + globalize.translate('DirectStreamHelp2'));
                break;
            case 'DirectPlay':
                setPlaybackInfoTitle(globalize.translate('DirectPlaying'));
                setPlaybackInfoDesc(globalize.translate('DirectPlayHelp'));
                break;
            case 'Transcode': {
                const transcodeReasons = device.TranscodingInfo?.TranscodeReasons as string[] | undefined;
                const localizedTranscodeReasons = transcodeReasons?.map(transcodeReason => globalize.translate(transcodeReason)) || [];
                setPlaybackInfoTitle(globalize.translate('Transcoding'));
                setPlaybackInfoDesc(
                    globalize.translate('MediaIsBeingConverted')
                    + '\n\n' + getSessionNowPlayingStreamInfo(device)
                    + '\n\n' + globalize.translate('LabelReasonForTranscoding')
                    + '\n' + localizedTranscodeReasons.join('\n')
                );
                break;
            }
        }

        setIsPlaybackInfoOpen(true);
    }, [ device ]);

    const nowPlayingName = useMemo(() => (
        getNowPlayingName(device)
    ), [ device ]);

    const nowPlayingImage = useMemo(() => (
        device.NowPlayingItem && getNowPlayingImageUrl(device.NowPlayingItem)
    ), [device]);

    const runningTime = useMemo(() => (
        getSessionNowPlayingTime(device)
    ), [ device ]);

    const deviceIcon = useMemo(() => (
        getDeviceIcon(device)
    ), [ device ]);

    const canControl = device.ServerId && device.SupportsRemoteControl;
    const isPlayingMedia = !!device.NowPlayingItem;

    const progressValue = (device.PlayState?.PositionTicks != null && device.NowPlayingItem?.RunTimeTicks != null) ?
        (device.PlayState.PositionTicks / device.NowPlayingItem.RunTimeTicks) * 100 : 0;

    return (
        <Card variant="outlined" sx={{ width: { xs: '100%', sm: '360px' }, overflow: 'hidden', p: 0 }}>
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
            <AspectRatio ratio="16/9" sx={{ borderRadius: 0 }}>
                {nowPlayingImage ? (
                    <img src={nowPlayingImage} alt={nowPlayingName.topText} />
                ) : (
                    <Box className={getDefaultBackgroundClass(device.Id)} />
                )}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.8))',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                    <Stack direction='row' alignItems='center' spacing={1.5}>
                        <Avatar src={deviceIcon} variant="plain" sx={{ '--Avatar-size': '2.5rem' }} />
                        <Stack>
                            <Typography level="title-md" textColor="white">{device.DeviceName}</Typography>
                            <Typography level="body-xs" textColor="neutral.300">{device.Client + ' ' + device.ApplicationVersion}</Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' alignItems='flex-end' justifyContent="space-between">
                        <Stack spacing={0.5}>
                            {nowPlayingName.image ? (
                                <img
                                    src={nowPlayingName.image}
                                    style={{ maxHeight: '24px', maxWidth: '130px' }}
                                    alt='Media Icon'
                                />
                            ) : (
                                <Typography level="title-sm" textColor="white" noWrap>{nowPlayingName.topText}</Typography>
                            )}
                            <Typography level="body-xs" textColor="neutral.300" noWrap>{nowPlayingName.bottomText}</Typography>
                        </Stack>
                        {device.NowPlayingItem && (
                            <Typography level="body-xs" textColor="white">{runningTime.start} / {runningTime.end}</Typography>
                        )}
                    </Stack>
                </Box>
            </AspectRatio>

            {isPlayingMedia && (
                <LinearProgress
                    determinate
                    value={progressValue}
                    color="primary"
                    sx={{ '--LinearProgress-thickness': '4px', borderRadius: 0 }}
                />
            )}

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ py: 1 }}>
                {canControl && isPlayingMedia && (
                    <>
                        <IconButton variant="plain" color="neutral" onClick={onPlayPauseSession}>
                            {device.PlayState?.IsPaused ? <PlayArrow /> : <Pause />}
                        </IconButton>
                        <IconButton variant="plain" color="danger" onClick={onStopSession}>
                            <Stop />
                        </IconButton>
                    </>
                )}
                {isPlayingMedia && (
                    <IconButton variant="plain" color="neutral" onClick={showPlaybackInfo}>
                        <Info />
                    </IconButton>
                )}
                {canControl && (
                    <IconButton variant="plain" color="neutral" onClick={showMessageDialog}>
                        <Comment />
                    </IconButton>
                )}
            </Stack>

            {device.UserName && (
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 1, textAlign: 'center' }}>
                    <Typography level="body-xs" color="neutral">{device.UserName}</Typography>
                </Box>
            )}
        </Card>
    );
};

export default DeviceCard;