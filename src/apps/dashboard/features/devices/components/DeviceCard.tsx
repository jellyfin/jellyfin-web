import React, { useCallback, useMemo, useState } from 'react';
import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import { getDeviceIcon } from 'utils/image';
import Stack from '@mui/material/Stack';
import getNowPlayingName from '../../sessions/utils/getNowPlayingName';
import getSessionNowPlayingTime from '../../sessions/utils/getSessionNowPlayingTime';
import getNowPlayingImageUrl from '../../sessions/utils/getNowPlayingImageUrl';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import Comment from '@mui/icons-material/Comment';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Pause from '@mui/icons-material/Pause';
import Stop from '@mui/icons-material/Stop';
import Info from '@mui/icons-material/Info';
import LinearProgress from '@mui/material/LinearProgress';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
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
                setPlaybackInfoDesc(
                    globalize.translate('RemuxHelp1') +
                        '\n' +
                        globalize.translate('RemuxHelp2')
                );
                break;
            case 'DirectStream':
                setPlaybackInfoTitle(globalize.translate('DirectStreaming'));
                setPlaybackInfoDesc(
                    globalize.translate('DirectStreamHelp1') +
                        '\n' +
                        globalize.translate('DirectStreamHelp2')
                );
                break;
            case 'DirectPlay':
                setPlaybackInfoTitle(globalize.translate('DirectPlaying'));
                setPlaybackInfoDesc(globalize.translate('DirectPlayHelp'));
                break;
            case 'Transcode': {
                const transcodeReasons = device.TranscodingInfo
                    ?.TranscodeReasons as string[] | undefined;
                const localizedTranscodeReasons =
                    transcodeReasons?.map((transcodeReason) =>
                        globalize.translate(transcodeReason)
                    ) || [];
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
        () =>
            device.NowPlayingItem &&
            getNowPlayingImageUrl(device.NowPlayingItem),
        [device]
    );

    const runningTime = useMemo(
        () => getSessionNowPlayingTime(device),
        [device]
    );

    const deviceIcon = useMemo(() => getDeviceIcon(device), [device]);

    const canControl = device.ServerId && device.SupportsRemoteControl;
    const isPlayingMedia = !!device.NowPlayingItem;

    return (
        <Card sx={{ width: { xs: '100%', sm: '360px' } }}>
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
            <CardMedia
                sx={{
                    height: 200,
                    display: 'flex'
                }}
                className={getDefaultBackgroundClass(device.Id)}
                image={nowPlayingImage || undefined}
            >
                <Stack
                    justifyContent={'space-between'}
                    flexGrow={1}
                    sx={{
                        backgroundColor: nowPlayingImage
                            ? 'rgba(0, 0, 0, 0.7)'
                            : null,
                        padding: 2
                    }}
                >
                    <Stack direction='row' alignItems='center' spacing={1}>
                        <img
                            src={deviceIcon}
                            style={{
                                maxWidth: '2.5em',
                                maxHeight: '2.5em'
                            }}
                            alt={device.DeviceName || ''}
                        />
                        <Stack>
                            <Typography>{device.DeviceName}</Typography>
                            <Typography>
                                {device.Client +
                                    ' ' +
                                    device.ApplicationVersion}
                            </Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' alignItems={'end'}>
                        <Stack flexGrow={1}>
                            {nowPlayingName.image ? (
                                <img
                                    src={nowPlayingName.image}
                                    style={{
                                        maxHeight: '24px',
                                        maxWidth: '130px',
                                        alignSelf: 'flex-start'
                                    }}
                                    alt='Media Icon'
                                />
                            ) : (
                                <Typography>
                                    {nowPlayingName.topText}
                                </Typography>
                            )}
                            <Typography>{nowPlayingName.bottomText}</Typography>
                        </Stack>
                        {device.NowPlayingItem && (
                            <Typography>
                                {runningTime.start} / {runningTime.end}
                            </Typography>
                        )}
                    </Stack>
                </Stack>
            </CardMedia>
            {device.PlayState?.PositionTicks != null &&
                device.NowPlayingItem?.RunTimeTicks != null && (
                    <LinearProgress
                        variant='buffer'
                        value={
                            (device.PlayState.PositionTicks /
                                device.NowPlayingItem.RunTimeTicks) *
                            100
                        }
                        valueBuffer={
                            device.TranscodingInfo?.CompletionPercentage || 0
                        }
                        sx={{
                            '& .MuiLinearProgress-dashed': {
                                animation: 'none',
                                backgroundImage: 'none',
                                backgroundColor: 'background.paper'
                            },
                            '& .MuiLinearProgress-bar2': {
                                backgroundColor: '#dd4919'
                            }
                        }}
                    />
                )}
            <CardActions disableSpacing>
                <Stack direction='row' flexGrow={1} justifyContent='center'>
                    {canControl && isPlayingMedia && (
                        <>
                            <IconButton onClick={onPlayPauseSession}>
                                {device.PlayState?.IsPaused ? (
                                    <PlayArrow />
                                ) : (
                                    <Pause />
                                )}
                            </IconButton>
                            <IconButton onClick={onStopSession}>
                                <Stop />
                            </IconButton>
                        </>
                    )}
                    {isPlayingMedia && (
                        <IconButton onClick={showPlaybackInfo}>
                            <Info />
                        </IconButton>
                    )}
                    {canControl && (
                        <IconButton onClick={showMessageDialog}>
                            <Comment />
                        </IconButton>
                    )}
                </Stack>
            </CardActions>
            {device.UserName && (
                <Stack
                    direction='row'
                    flexGrow={1}
                    justifyContent='center'
                    sx={{ paddingBottom: 2 }}
                >
                    <Typography>{device.UserName}</Typography>
                </Stack>
            )}
        </Card>
    );
};

export default DeviceCard;
