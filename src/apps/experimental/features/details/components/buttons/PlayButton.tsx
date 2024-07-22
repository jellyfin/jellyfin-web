import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import { useGetChannel } from 'hooks/api/liveTvHooks/useGetChannel';
import globalize from 'scripts/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';

interface PlayButtonProps {
    item: ItemDto;
    isResumable: boolean;
    selectedMediaSourceId?: string;
    selectedAudioTrack?: number;
    selectedSubtitleTrack?: number;
}

const PlayButton: FC<PlayButtonProps> = ({
    item,
    isResumable,
    selectedMediaSourceId,
    selectedAudioTrack,
    selectedSubtitleTrack
}) => {
    const { data: channel } = useGetChannel({
        channelId: item?.ChannelId || ''
    });

    const onPlayClick = useCallback(() => {
        if (item?.Type === ItemKind.Program) {
            playbackManager.play({
                items: [channel]
            });
            return;
        }

        playbackManager.play({
            items: [item],
            startPositionTicks:
                item?.UserData && isResumable ?
                    item.UserData.PlaybackPositionTicks :
                    0,
            mediaSourceId: selectedMediaSourceId,
            audioStreamIndex: selectedAudioTrack || null,
            subtitleStreamIndex: selectedSubtitleTrack
        });
    }, [
        channel,
        isResumable,
        item,
        selectedAudioTrack,
        selectedMediaSourceId,
        selectedSubtitleTrack
    ]);

    return (
        <IconButton
            className='button-flat btnPlay'
            data-action={isResumable ? 'resume' : 'play'}
            title={
                isResumable ?
                    globalize.translate('ButtonResume') :
                    globalize.translate('Play')
            }
            onClick={onPlayClick}
        >
            {isResumable ? <ReplayIcon /> : <PlayArrowIcon />}
        </IconButton>
    );
};

export default PlayButton;
