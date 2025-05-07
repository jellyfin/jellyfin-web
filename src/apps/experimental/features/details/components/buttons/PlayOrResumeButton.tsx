import React, { FC, useCallback, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
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
    mediaSourceId?: string | null;
    audioStreamIndex?: number;
    subtitleStreamIndex?: number;
}

const PlayOrResumeButton: FC<PlayOrResumeButtonProps> = ({
    item,
    isResumable,
    mediaSourceId,
    audioStreamIndex,
    subtitleStreamIndex
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
                mediaSourceId,
                audioStreamIndex: audioStreamIndex || null,
                subtitleStreamIndex
            };
        }
    }, [
        item,
        isResumable,
        mediaSourceId,
        audioStreamIndex,
        subtitleStreamIndex
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
            }).catch(err => {
                console.error('[PlayOrResumeButton] failed to play', err);
            });
            return;
        }

        playbackManager.play({
            items: [item],
            ...playOptions
        }).catch(err => {
            console.error('[PlayOrResumeButton] failed to play', err);
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
