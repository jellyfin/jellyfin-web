import React, { type FC, useCallback, useMemo } from 'react';
import { IconButton } from 'ui-primitives/IconButton';
import { PlayIcon, ResetIcon } from '@radix-ui/react-icons';
import { useQueryClient } from '@tanstack/react-query';

import { ItemAction } from 'constants/itemAction';
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
        if (item && item.Id) {
            return itemHelper.supportsMediaSourceSelection(item as any)
                ? {
                      startPositionTicks: item.UserData && isResumable ? item.UserData.PlaybackPositionTicks : 0,
                      mediaSourceId: selectedMediaSourceId,
                      audioStreamIndex: selectedAudioTrack || null,
                      subtitleStreamIndex: selectedSubtitleTrack
                  }
                : {};
        }
        return {};
    }, [item, isResumable, selectedMediaSourceId, selectedAudioTrack, selectedSubtitleTrack]);

    const onPlayClick = useCallback(async () => {
        if (item.Type === ItemKind.Program && item.ChannelId) {
            const channel = await queryClient.fetchQuery(
                getChannelQuery(apiContext, {
                    channelId: item.ChannelId
                })
            );
            playbackManager
                .play({
                    items: [channel]
                })
                .catch((err: unknown) => {
                    console.error('[PlayOrResumeButton] failed to play', err);
                });
            return;
        }

        playbackManager
            .play({
                items: [item],
                ...playOptions
            })
            .catch((err: unknown) => {
                console.error('[PlayOrResumeButton] failed to play', err);
            });
    }, [apiContext, item, playOptions, queryClient]);

    return (
        <IconButton
            className="button-flat btnPlayOrResume"
            data-action={isResumable ? ItemAction.Resume : ItemAction.Play}
            title={isResumable ? globalize.translate('ButtonResume') : globalize.translate('Play')}
            onClick={onPlayClick}
        >
            {isResumable ? <ResetIcon /> : <PlayIcon />}
        </IconButton>
    );
};

export default PlayOrResumeButton;
