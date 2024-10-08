import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';

import type { PlaybackManager } from 'components/playback/playbackmanager';
import type { MediaError } from 'types/mediaError';
import type { PlayTarget } from 'types/playTarget';
import type { PlaybackStopInfo, PlayerState } from 'types/playbackStopInfo';
import type { Plugin } from 'types/plugin';
import Events, { type Event } from 'utils/events';

import { PlaybackManagerEvent } from '../constants/playbackManagerEvent';
import { PlayerEvent } from '../constants/playerEvent';
import type { ManagedPlayerStopInfo, MovedItem, PlayerError, PlayerErrorCode, PlayerStopInfo, RemovedItems } from '../types/callbacks';

export interface PlaybackSubscriber {
    onPlaybackCancelled?(e: Event): void
    onPlaybackError?(e: Event, errorType: MediaError): void
    onPlaybackStart?(e: Event, player: Plugin, state: PlayerState): void
    onPlaybackStop?(e: Event, info: PlaybackStopInfo): void
    onPlayerChange?(e: Event, player: Plugin, target: PlayTarget, previousPlayer: Plugin): void
    onPlayerError?(e: Event, error: PlayerError): void
    onPlayerFullscreenChange?(e: Event): void
    onPlayerItemStarted?(e: Event, item?: BaseItemDto, mediaSource?: MediaSourceInfo): void
    onPlayerItemStopped?(e: Event, info: ManagedPlayerStopInfo): void
    onPlayerMediaStreamsChange?(e: Event): void
    onPlayerPause?(e: Event): void
    onPlayerPlaybackStart?(e: Event, state: PlayerState): void
    onPlayerPlaybackStop?(e: Event, state: PlayerState): void
    onPlayerPlaylistItemAdd?(e: Event): void
    onPlayerPlaylistItemMove?(e: Event, item: MovedItem): void
    onPlayerPlaylistItemRemove?(e: Event, items?: RemovedItems): void
    onPlayerRepeatModeChange?(e: Event): void
    onPlayerShuffleModeChange?(e: Event): void
    onPlayerStopped?(e: Event, info?: PlayerStopInfo | PlayerErrorCode): void
    onPlayerTimeUpdate?(e: Event): void
    onPlayerUnpause?(e: Event): void
    onPlayerVolumeChange?(e: Event): void
    onReportPlayback?(e: Event, isServerItem: boolean): void
}

export abstract class PlaybackSubscriber {
    private player: Plugin | undefined;

    private readonly playbackManagerEvents = {
        [PlaybackManagerEvent.PlaybackCancelled]: this.onPlaybackCancelled,
        [PlaybackManagerEvent.PlaybackError]: this.onPlaybackError,
        [PlaybackManagerEvent.PlaybackStart]: this.onPlaybackStart,
        [PlaybackManagerEvent.PlaybackStop]: this.onPlaybackStop,
        [PlaybackManagerEvent.PlayerChange]: this.onPlayerChange,
        [PlaybackManagerEvent.ReportPlayback]: this.onReportPlayback
    };

    private readonly playerEvents = {
        [PlayerEvent.Error]: this.onPlayerError,
        [PlayerEvent.FullscreenChange]: this.onPlayerFullscreenChange,
        [PlayerEvent.ItemStarted]: this.onPlayerItemStarted,
        [PlayerEvent.ItemStopped]: this.onPlayerItemStopped,
        [PlayerEvent.MediaStreamsChange]: this.onPlayerMediaStreamsChange,
        [PlayerEvent.Pause]: this.onPlayerPause,
        [PlayerEvent.PlaybackStart]: this.onPlayerPlaybackStart,
        [PlayerEvent.PlaybackStop]: this.onPlayerPlaybackStop,
        [PlayerEvent.PlaylistItemAdd]: this.onPlayerPlaylistItemAdd,
        [PlayerEvent.PlaylistItemMove]: this.onPlayerPlaylistItemMove,
        [PlayerEvent.PlaylistItemRemove]: this.onPlayerPlaylistItemRemove,
        [PlayerEvent.RepeatModeChange]: this.onPlayerRepeatModeChange,
        [PlayerEvent.ShuffleModeChange]: this.onPlayerShuffleModeChange,
        [PlayerEvent.Stopped]: this.onPlayerStopped,
        [PlayerEvent.TimeUpdate]: this.onPlayerTimeUpdate,
        [PlayerEvent.Unpause]: this.onPlayerUnpause,
        [PlayerEvent.VolumeChange]: this.onPlayerVolumeChange
    };

    constructor(
        protected readonly playbackManager: PlaybackManager
    ) {
        Object.entries(this.playbackManagerEvents).forEach(([event, handler]) => {
            if (handler) Events.on(playbackManager, event, handler);
        });

        this.bindPlayerEvents();
        Events.on(playbackManager, PlaybackManagerEvent.PlayerChange, this.bindPlayerEvents.bind(this));
    }

    private bindPlayerEvents() {
        const newPlayer = this.playbackManager.getCurrentPlayer();
        if (this.player === newPlayer) return;

        if (this.player) {
            Object.entries(this.playerEvents).forEach(([event, handler]) => {
                if (handler) Events.off(this.player, event, handler);
            });
        }

        this.player = newPlayer;
        if (!this.player) return;

        Object.entries(this.playerEvents).forEach(([event, handler]) => {
            if (handler) Events.on(this.player, event, handler);
        });
    }
}
