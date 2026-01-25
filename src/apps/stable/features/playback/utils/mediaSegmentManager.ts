import type { Api } from '@jellyfin/sdk/lib/api';
import type { MediaSegmentDto } from '@jellyfin/sdk/lib/generated-client/models/media-segment-dto';
import { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';
import { getMediaSegmentsApi } from '@jellyfin/sdk/lib/utils/api/media-segments-api';

import type { PlaybackManager, Player } from 'components/playback/playbackmanager';
import { TICKS_PER_MILLISECOND, TICKS_PER_SECOND } from 'constants/time';
import { ServerConnections } from 'lib/jellyfin-apiclient';
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
    private isLastSegmentIgnored = false;
    private lastSegmentIndex = 0;
    private lastTime = -1;
    private mediaSegmentTypeActions: Record<Partial<MediaSegmentType>, MediaSegmentAction> | undefined;
    private mediaSegments: MediaSegmentDto[] = [];

    private async fetchMediaSegments(api: Api, itemId: string, includeSegmentTypes: MediaSegmentType[]) {
        try {
            const { data: mediaSegments } = await getMediaSegmentsApi(api).getItemSegments({
                itemId,
                includeSegmentTypes
            });
            this.mediaSegments = mediaSegments.Items || [];
        } catch (err) {
            console.error('[MediaSegmentManager] failed to fetch segments', err);
            this.mediaSegments = [];
        }
    }

    skipSegment(mediaSegment: MediaSegmentDto) {
        // Ignore segment if playback progress has passed the segment's start time
        if (mediaSegment.StartTicks !== undefined && this.lastTime > mediaSegment.StartTicks) {
            console.info(
                '[MediaSegmentManager] ignoring skipping segment that has been seeked back into',
                mediaSegment
            );
            this.isLastSegmentIgnored = true;
        } else if (mediaSegment.EndTicks) {
            // If there is an end time, seek to it
            // Do not skip if duration < 1s to avoid slow stream changes
            if (mediaSegment.StartTicks && mediaSegment.EndTicks - mediaSegment.StartTicks < TICKS_PER_SECOND) {
                console.info('[MediaSegmentManager] ignoring skipping segment with duration <1s', mediaSegment);
                this.isLastSegmentIgnored = true;
                return;
            }
            console.debug('[MediaSegmentManager] skipping to %s ms', mediaSegment.EndTicks / TICKS_PER_MILLISECOND);
            this.playbackManager.seek(mediaSegment.EndTicks, this.player as unknown as Player);
        } else {
            // If there is no end time, skip to the next track
            console.debug('[MediaSegmentManager] skipping to next item in queue');
            this.playbackManager.nextTrack(this.player as unknown as Player);
        }
    }

    promptToSkip(mediaSegment: MediaSegmentDto) {
        if (
            mediaSegment.StartTicks &&
            mediaSegment.EndTicks &&
            mediaSegment.EndTicks - mediaSegment.StartTicks < TICKS_PER_SECOND * 3
        ) {
            console.info('[MediaSegmentManager] ignoring segment prompt with duration <3s', mediaSegment);
            this.isLastSegmentIgnored = true;
            return;
        }
        this.playbackManager.promptToSkip(mediaSegment);
    }

    private performAction(mediaSegment: MediaSegmentDto) {
        if (!this.mediaSegmentTypeActions || !mediaSegment.Type || !this.mediaSegmentTypeActions[mediaSegment.Type]) {
            console.error(
                '[MediaSegmentManager] segment type missing from action map',
                mediaSegment,
                this.mediaSegmentTypeActions
            );
            return;
        }

        const action = this.mediaSegmentTypeActions[mediaSegment.Type];
        if (action === MediaSegmentAction.Skip) {
            this.skipSegment(mediaSegment);
        } else if (action === MediaSegmentAction.AskToSkip) {
            this.promptToSkip(mediaSegment);
        }
    }

    onPlayerPlaybackStart(_e: Event, state: PlayerState) {
        this.isLastSegmentIgnored = false;
        this.lastSegmentIndex = 0;
        this.lastTime = -1;
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
            .reduce(
                (acc, { type, action }) => {
                    if (action) acc[type] = action;
                    return acc;
                },
                {} as Record<Partial<MediaSegmentType>, MediaSegmentAction>
            );

        if (!Object.keys(this.mediaSegmentTypeActions).length) {
            console.info('[MediaSegmentManager] user has no media segment actions enabled');
            return;
        }

        const api = toApi(ServerConnections.getApiClient(serverId));
        void this.fetchMediaSegments(
            api,
            itemId,
            Object.keys(this.mediaSegmentTypeActions).map(t => t as keyof typeof MediaSegmentType)
        );
    }

    onPlayerTimeUpdate() {
        if (this.hasSegments && this.mediaSegments.length) {
            const time = this.playbackManager.currentTime(this.player as unknown as Player) * TICKS_PER_MILLISECOND;
            const currentSegmentDetails = findCurrentSegment(this.mediaSegments, time, this.lastSegmentIndex);
            if (
                // The current time falls within a segment
                currentSegmentDetails &&
                // and the last segment is not ignored or the segment index has changed
                (!this.isLastSegmentIgnored || this.lastSegmentIndex !== currentSegmentDetails.index)
            ) {
                console.debug(
                    '[MediaSegmentManager] found %s segment at %s ms',
                    currentSegmentDetails.segment.Type,
                    time / TICKS_PER_MILLISECOND,
                    currentSegmentDetails
                );
                this.isLastSegmentIgnored = false;
                this.performAction(currentSegmentDetails.segment);
                this.lastSegmentIndex = currentSegmentDetails.index;
            }
            this.lastTime = time;
        }
    }
}

export const bindMediaSegmentManager = (playbackManager: PlaybackManager) => new MediaSegmentManager(playbackManager);
