import type { Api } from '@jellyfin/sdk/lib/api';
import type { MediaSegmentDto } from '@jellyfin/sdk/lib/generated-client/models/media-segment-dto';
import { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';
import { MediaSegmentsApi } from '@jellyfin/sdk/lib/generated-client/api/media-segments-api';

import type { PlaybackManager } from 'components/playback/playbackmanager';
import ServerConnections from 'components/ServerConnections';
import { TICKS_PER_MILLISECOND, TICKS_PER_SECOND } from 'constants/time';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import type { PlayerState } from 'types/playbackStopInfo';
import type { Event } from 'utils/events';
import { toApi } from 'utils/jellyfin-apiclient/compat';

import { getMediaSegmentAction } from './mediaSegmentSettings';
import { findCurrentSegment } from './mediaSegments';
import { PlaybackSubscriber } from './playbackSubscriber';
import { MediaSegmentAction } from '../constants/mediaSegmentAction';

class MediaSegmentManager extends PlaybackSubscriber {
    private hasSegments = false;
    private lastIndex = 0;
    private mediaSegmentTypeActions: Record<Partial<MediaSegmentType>, MediaSegmentAction> | undefined;
    private mediaSegments: MediaSegmentDto[] = [];

    private async fetchMediaSegments(api: Api, itemId: string, includeSegmentTypes: MediaSegmentType[]) {
        // FIXME: Replace with SDK getMediaSegmentsApi function when available in stable
        const mediaSegmentsApi = new MediaSegmentsApi(api.configuration, undefined, api.axiosInstance);

        try {
            const { data: mediaSegments } = await mediaSegmentsApi.getItemSegments({ itemId, includeSegmentTypes });
            this.mediaSegments = mediaSegments.Items || [];
        } catch (err) {
            console.error('[MediaSegmentManager] failed to fetch segments', err);
            this.mediaSegments = [];
        }
    }

    private performAction(mediaSegment: MediaSegmentDto) {
        if (!this.mediaSegmentTypeActions || !mediaSegment.Type || !this.mediaSegmentTypeActions[mediaSegment.Type]) {
            console.error('[MediaSegmentManager] segment type missing from action map', mediaSegment, this.mediaSegmentTypeActions);
            return;
        }

        const action = this.mediaSegmentTypeActions[mediaSegment.Type];
        if (action === MediaSegmentAction.Skip) {
            // Perform skip
            if (mediaSegment.EndTicks) {
                // Do not skip if duration < 1s to avoid slow stream changes
                if (mediaSegment.StartTicks && mediaSegment.EndTicks - mediaSegment.StartTicks < TICKS_PER_SECOND) {
                    console.info('[MediaSegmentManager] ignoring skipping segment with duration <1s', mediaSegment);
                    return;
                }

                console.debug('[MediaSegmentManager] skipping to %s ms', mediaSegment.EndTicks / TICKS_PER_MILLISECOND);
                this.playbackManager.seek(mediaSegment.EndTicks, this.player);
            } else {
                console.debug('[MediaSegmentManager] skipping to next item in queue');
                this.playbackManager.nextTrack(this.player);
            }
        }
    }

    onPlayerPlaybackStart(_e: Event, state: PlayerState) {
        this.lastIndex = 0;
        this.hasSegments = !!state.MediaSource?.HasSegments;

        const itemId = state.MediaSource?.Id;
        const serverId = state.NowPlayingItem?.ServerId || ServerConnections.currentApiClient()?.serverId();

        if (!this.hasSegments || !serverId || !itemId) return;

        // Get the user settings for media segment actions
        this.mediaSegmentTypeActions = Object.values(MediaSegmentType)
            .map(type => ({
                type,
                action: getMediaSegmentAction(userSettings, type)
            }))
            .filter(({ action }) => !!action && action !== MediaSegmentAction.None)
            .reduce((acc, { type, action }) => {
                if (action) acc[type] = action;
                return acc;
            }, {} as Record<Partial<MediaSegmentType>, MediaSegmentAction>);

        if (!Object.keys(this.mediaSegmentTypeActions).length) {
            console.info('[MediaSegmentManager] user has no media segment actions enabled');
            return;
        }

        const api = toApi(ServerConnections.getApiClient(serverId));
        void this.fetchMediaSegments(
            api,
            itemId,
            Object.keys(this.mediaSegmentTypeActions).map(t => t as keyof typeof MediaSegmentType));
    }

    onPlayerTimeUpdate() {
        if (this.hasSegments && this.mediaSegments.length) {
            const time = this.playbackManager.currentTime(this.player) * TICKS_PER_MILLISECOND;
            const currentSegmentDetails = findCurrentSegment(this.mediaSegments, time, this.lastIndex);
            if (currentSegmentDetails) {
                console.debug(
                    '[MediaSegmentManager] found %s segment at %s ms',
                    currentSegmentDetails.segment.Type,
                    time / TICKS_PER_MILLISECOND,
                    currentSegmentDetails);
                this.performAction(currentSegmentDetails.segment);
                this.lastIndex = currentSegmentDetails.index;
            }
        }
    }
}

export const bindMediaSegmentManager = (playbackManager: PlaybackManager) => new MediaSegmentManager(playbackManager);
