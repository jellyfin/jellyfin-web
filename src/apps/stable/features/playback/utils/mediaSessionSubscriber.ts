import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

import { getImageUrl } from 'apps/stable/features/playback/utils/image';
import { getItemTextLines } from 'apps/stable/features/playback/utils/itemText';
import { PlaybackSubscriber } from 'apps/stable/features/playback/utils/playbackSubscriber';
import type { PlaybackManager } from 'components/playback/playbackmanager';
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

    DEFAULT_IMAGE_SIZES.forEach((height) => {
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
        /* eslint-disable compat/compat */
        navigator.mediaSession.setActionHandler(
            'pause',
            this.onMediaSessionAction.bind(this)
        );
        navigator.mediaSession.setActionHandler(
            'play',
            this.onMediaSessionAction.bind(this)
        );
        navigator.mediaSession.setActionHandler(
            'stop',
            this.onMediaSessionAction.bind(this)
        );
        navigator.mediaSession.setActionHandler(
            'previoustrack',
            this.onMediaSessionAction.bind(this)
        );
        navigator.mediaSession.setActionHandler(
            'nexttrack',
            this.onMediaSessionAction.bind(this)
        );
        navigator.mediaSession.setActionHandler(
            'seekto',
            this.onMediaSessionAction.bind(this)
        );
        // iOS will only show next/prev track controls or seek controls
        if (!browser.iOS) {
            navigator.mediaSession.setActionHandler(
                'seekbackward',
                this.onMediaSessionAction.bind(this)
            );
            navigator.mediaSession.setActionHandler(
                'seekforward',
                this.onMediaSessionAction.bind(this)
            );
        }
        /* eslint-enable compat/compat */
    }

    private onMediaSessionAction(details: MediaSessionActionDetails) {
        switch (details.action) {
            case 'pause':
                return this.playbackManager.pause(this.player);
            case 'play':
                return this.playbackManager.unpause(this.player);
            case 'stop':
                return this.playbackManager.stop(this.player);
            case 'seekbackward':
                return this.playbackManager.rewind(this.player);
            case 'seekforward':
                return this.playbackManager.fastForward(this.player);
            case 'seekto':
                return this.playbackManager.seekMs(
                    (details.seekTime || 0) * MILLISECONDS_PER_SECOND,
                    this.player
                );
            case 'previoustrack':
                return this.playbackManager.previousTrack(this.player);
            case 'nexttrack':
                return this.playbackManager.nextTrack(this.player);
            default:
                console.info(
                    '[MediaSessionSubscriber] Unhandled media session action',
                    details
                );
        }
    }

    private onMediaSessionUpdate(
        { type: action }: Event,
        state: PlayerState = this.playbackManager.getPlayerState(this.player)
    ) {
        const item = state.NowPlayingItem;

        if (!item) {
            console.debug(
                '[MediaSessionSubscriber] no now playing item; resetting media session',
                state
            );
            return resetMediaSession();
        }

        const isVideo = item.MediaType === MediaType.Video;
        const isLocalPlayer = !!this.player?.isLocalPlayer;

        // Local players do their own notifications
        if (isLocalPlayer && isVideo) {
            console.debug(
                '[MediaSessionSubscriber] ignoring local player update'
            );
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
                duration: item.RunTimeTicks
                    ? Math.round(item.RunTimeTicks / TICKS_PER_MILLISECOND)
                    : 0,
                position: state.PlayState.PositionTicks
                    ? Math.round(
                          state.PlayState.PositionTicks / TICKS_PER_MILLISECOND
                      )
                    : 0,
                imageUrl: getImageUrl(item, { maxHeight: 3_000 }),
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
export const bindMediaSessionSubscriber = (
    playbackManager: PlaybackManager
) => {
    if (hasNativeShell || hasNavigatorSession) {
        return new MediaSessionSubscriber(playbackManager);
    }
};
