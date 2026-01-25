import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

import { getImageUrl } from 'apps/stable/features/playback/utils/image';
import { getItemTextLines } from 'apps/stable/features/playback/utils/itemText';
import { PlaybackSubscriber } from 'apps/stable/features/playback/utils/playbackSubscriber';
import type { PlaybackManager, Player } from 'components/playback/playbackmanager';
import { MILLISECONDS_PER_SECOND, TICKS_PER_MILLISECOND } from 'constants/time';
import browser from 'scripts/browser';
import shell from 'scripts/shell';
import type { ItemDto } from 'types/base/models/item-dto';
import type { PlayerState } from 'types/playbackStopInfo';
import type { Event } from 'utils/events';

/** The default image resolutions to provide to the media session */
const DEFAULT_IMAGE_SIZES = [96, 128, 192, 256, 384, 512];

const hasNavigatorSession = 'mediaSession' in navigator;
const hasNativeShell = !!window.NativeShell;

const getArtwork = (item: ItemDto): MediaImage[] => {
    const artwork: MediaImage[] = [];

    DEFAULT_IMAGE_SIZES.forEach(height => {
        const src = getImageUrl(item, { height });
        if (src) {
            artwork.push({
                src,
                sizes: `${height}x${height}`
            });
        }
    });

    return artwork;
};

const resetMediaSession = () => {
    if (hasNavigatorSession) {
        navigator.mediaSession.metadata = null;
    } else if (hasNativeShell) {
        shell.hideMediaSession();
    }
};

/** A PlaybackSubscriber that manages MediaSession state and events. */
class MediaSessionSubscriber extends PlaybackSubscriber {
    constructor(playbackManager: PlaybackManager) {
        super(playbackManager);

        resetMediaSession();
        if (hasNavigatorSession) this.bindNavigatorSession();
    }

    private bindNavigatorSession() {
        const actions: MediaSessionAction[] = ['pause', 'play', 'previoustrack', 'nexttrack', 'stop', 'seekto'];

        // iOS will only show next/prev track controls or seek controls
        if (!browser.iOS) actions.push('seekbackward', 'seekforward');

        for (const action of actions) {
            try {
                navigator.mediaSession.setActionHandler(action, this.onMediaSessionAction.bind(this));
            } catch (err) {
                // NOTE: Some legacy (TV) browsers lack support for the stop and seekto actions
                console.warn(`[MediaSessionSubscriber] Failed to add "${action}" action handler`, err);
            }
        }
    }

    private onMediaSessionAction(details: MediaSessionActionDetails) {
        switch (details.action) {
            case 'pause':
                return this.playbackManager.pause(this.player as unknown as Player);
            case 'play':
                return this.playbackManager.unpause(this.player as unknown as Player);
            case 'stop':
                return this.playbackManager.stop(this.player as unknown as Player);
            case 'seekbackward':
                return this.playbackManager.rewind(this.player as unknown as Player);
            case 'seekforward':
                return this.playbackManager.fastForward(this.player as unknown as Player);
            case 'seekto':
                return this.playbackManager.seekMs(
                    (details.seekTime || 0) * MILLISECONDS_PER_SECOND,
                    this.player as unknown as Player
                );
            case 'previoustrack':
                return this.playbackManager.previousTrack(this.player as unknown as Player);
            case 'nexttrack':
                return this.playbackManager.nextTrack(this.player as unknown as Player);
            default:
                console.info('[MediaSessionSubscriber] Unhandled media session action', details);
        }
    }

    private onMediaSessionUpdate({ type: action }: Event, state?: PlayerState) {
        if (!this.player) {
            resetMediaSession();
            return;
        }
        state = state || this.playbackManager.getPlayerState(this.player as unknown as Player);
        if (!state) {
            resetMediaSession();
            return;
        }
        const item = state.NowPlayingItem;

        if (!item) {
            console.debug('[MediaSessionSubscriber] no now playing item; resetting media session', state);
            return resetMediaSession();
        }

        const isVideo = item.MediaType === MediaType.Video;
        const isLocalPlayer = !!this.player?.isLocalPlayer;

        // Local players do their own notifications
        if (isLocalPlayer && isVideo) {
            console.debug('[MediaSessionSubscriber] ignoring local player update');
            return;
        }

        const album = item.Album || undefined;
        const [line1, line2] = getItemTextLines(item, false) || [];
        // The artist will be the second line if present or the first line otherwise
        const artist = line2 || line1;
        // The title will be the first line if there are two lines
        const title = line2 && line1;

        if (hasNavigatorSession) {
            if (
                !navigator.mediaSession.metadata ||
                navigator.mediaSession.metadata.album !== album ||
                navigator.mediaSession.metadata.artist !== artist ||
                navigator.mediaSession.metadata.title !== title
            ) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title,
                    artist,
                    album,
                    artwork: getArtwork(item)
                });
            }
        } else {
            shell.updateMediaSession({
                action,
                isLocalPlayer,
                itemId: item.Id,
                title,
                artist,
                album,
                duration: item.RunTimeTicks ? Math.round(item.RunTimeTicks / TICKS_PER_MILLISECOND) : 0,
                position: state.PlayState.PositionTicks
                    ? Math.round(state.PlayState.PositionTicks / TICKS_PER_MILLISECOND)
                    : 0,
                imageUrl: getImageUrl(item, { maxHeight: 3_000 }) || undefined,
                canSeek: !!state.PlayState.CanSeek,
                isPaused: !!state.PlayState.IsPaused
            });
        }
    }

    onPlayerChange() {
        this.onMediaSessionUpdate({ type: 'timeupdate' });
    }

    onPlayerPause(e: Event) {
        this.onMediaSessionUpdate(e);
    }

    onPlayerPlaybackStart(e: Event, state: PlayerState) {
        this.onMediaSessionUpdate(e, state);
    }

    onPlayerPlaybackStop() {
        resetMediaSession();
    }

    onPlayerStateChange(e: Event, state: PlayerState) {
        this.onMediaSessionUpdate(e, state);
    }

    onPlayerUnpause(e: Event) {
        this.onMediaSessionUpdate(e);
    }
}

/** Bind a new MediaSessionSubscriber to the specified PlaybackManager */
export const bindMediaSessionSubscriber = (playbackManager: PlaybackManager) => {
    if (hasNativeShell || hasNavigatorSession) {
        return new MediaSessionSubscriber(playbackManager);
    }
};
