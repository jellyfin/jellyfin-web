import React, { FC, useCallback, useMemo } from 'react';
import { IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { getChannelQuery } from 'hooks/api/liveTvHooks/useGetChannel';
import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';
import itemHelper from 'components/itemHelper';

interface PlayOrResumeButtonProps {
    item: ItemDto;
    isResumable?: boolean;
    selectedMediaSourceId?: string | null;
    selectedAudioTrack?: number;
    selectedSubtitleTrack?: number;
}

const PlayOrResumeButton: FC<PlayOrResumeButtonProps> = ({
    item,
    isResumable,
    selectedMediaSourceId,
    selectedAudioTrack,
    selectedSubtitleTrack
}) => {
    const apiContext = useApi();
    const queryClient = useQueryClient();

    const playOptions = useMemo(() => {
        if (itemHelper.supportsMediaSourceSelection(item)) {
            return {
                startPositionTicks:
                    item.UserData && isResumable ?
                        item.UserData.PlaybackPositionTicks :
                        0,
                mediaSourceId: selectedMediaSourceId,
                audioStreamIndex: selectedAudioTrack || null,
                subtitleStreamIndex: selectedSubtitleTrack
            };
        }
    }, [
        item,
        isResumable,
        selectedMediaSourceId,
        selectedAudioTrack,
        selectedSubtitleTrack
    ]);

    const onPlayClick = useCallback(async () => {
        if (item.Type === ItemKind.Program && item.ChannelId) {
            const channel = await queryClient.fetchQuery(
                getChannelQuery(apiContext, {
                    channelId: item.ChannelId
                })
            );
            playbackManager.play({
                items: [channel]
            });
            return;
        }

        playbackManager.play({
            items: [item],
            ...playOptions
        });
    }, [apiContext, item, playOptions, queryClient]);

    return (
        <IconButton
            className='button-flat btnPlayOrResume'
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

export default PlayOrResumeButton;
