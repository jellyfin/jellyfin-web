import { useEffect, useState } from 'react';

import { playbackManager } from 'components/playback/playbackmanager';
import type { ItemDto } from 'types/base/models/item-dto';
import Events from 'utils/events';

export interface PlaybackProgress {
    /** Live playback position in ticks, or the saved resume position when idle. */
    positionTicks: number | null;
    /** True when the current player is loaded with this item. */
    isActiveForItem: boolean;
    /** True when the active player is paused. */
    isPaused: boolean;
}

function isPlayerActiveForItem(item: ItemDto): boolean {
    const player = playbackManager.getCurrentPlayer();
    if (!player) return false;
    const currentItem = playbackManager.currentItem(player);
    return !!currentItem && currentItem.Id === item.Id;
}

function readProgress(item: ItemDto): PlaybackProgress {
    const player = playbackManager.getCurrentPlayer();
    const isActiveForItem = isPlayerActiveForItem(item);

    if (player && isActiveForItem) {
        return {
            positionTicks: playbackManager.getCurrentTicks(player),
            isActiveForItem: true,
            isPaused: playbackManager.paused()
        };
    }

    // Nothing playing this item: fall back to the saved resume position so the
    // idle render still highlights the right chapter.
    return {
        positionTicks: item.UserData?.PlaybackPositionTicks ?? null,
        isActiveForItem: false,
        isPaused: false
    };
}

// Subscribes to playbackManager events and exposes reactive playback state
// for the given item.
export function usePlaybackProgress(item: ItemDto): PlaybackProgress {
    const [progress, setProgress] = useState<PlaybackProgress>(() => readProgress(item));

    useEffect(() => {
        let boundPlayer: unknown = null;

        const update = () => setProgress(readProgress(item));

        const onTimeUpdate = () => {
            const player = playbackManager.getCurrentPlayer();
            if (!player) return;
            const currentItem = playbackManager.currentItem(player);
            if (!currentItem || currentItem.Id !== item.Id) return;
            update();
        };

        const bindPlayerEvents = () => {
            if (boundPlayer) {
                Events.off(boundPlayer, 'timeupdate', onTimeUpdate);
                Events.off(boundPlayer, 'pause', update);
                Events.off(boundPlayer, 'unpause', update);
                Events.off(boundPlayer, 'playbackstop', update);
                boundPlayer = null;
            }

            const player = playbackManager.getCurrentPlayer();
            if (player) {
                boundPlayer = player;
                Events.on(player, 'timeupdate', onTimeUpdate);
                Events.on(player, 'pause', update);
                Events.on(player, 'unpause', update);
                Events.on(player, 'playbackstop', update);
            }
        };

        const onPlayerChange = () => {
            bindPlayerEvents();
            update();
        };

        Events.on(playbackManager, 'playerchange', onPlayerChange);
        bindPlayerEvents();
        // Re-read in case playback state changed between render and effect
        update();

        return () => {
            Events.off(playbackManager, 'playerchange', onPlayerChange);
            if (boundPlayer) {
                Events.off(boundPlayer, 'timeupdate', onTimeUpdate);
                Events.off(boundPlayer, 'pause', update);
                Events.off(boundPlayer, 'unpause', update);
                Events.off(boundPlayer, 'playbackstop', update);
            }
        };
    }, [item]);

    return progress;
}
