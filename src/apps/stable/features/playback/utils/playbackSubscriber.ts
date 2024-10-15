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
    protected player: Plugin | undefined;

    private readonly playbackManagerEvents = {
        [PlaybackManagerEvent.PlaybackCancelled]: this.onPlaybackCancelled?.bind(this),
        [PlaybackManagerEvent.PlaybackError]: this.onPlaybackError?.bind(this),
        [PlaybackManagerEvent.PlaybackStart]: this.onPlaybackStart?.bind(this),
        [PlaybackManagerEvent.PlaybackStop]: this.onPlaybackStop?.bind(this),
        [PlaybackManagerEvent.PlayerChange]: this.onPlayerChange?.bind(this),
        [PlaybackManagerEvent.ReportPlayback]: this.onReportPlayback?.bind(this)
    };

    private readonly playerEvents = {
        [PlayerEvent.Error]: this.onPlayerError?.bind(this),
        [PlayerEvent.FullscreenChange]: this.onPlayerFullscreenChange?.bind(this),
        [PlayerEvent.ItemStarted]: this.onPlayerItemStarted?.bind(this),
        [PlayerEvent.ItemStopped]: this.onPlayerItemStopped?.bind(this),
        [PlayerEvent.MediaStreamsChange]: this.onPlayerMediaStreamsChange?.bind(this),
        [PlayerEvent.Pause]: this.onPlayerPause?.bind(this),
        [PlayerEvent.PlaybackStart]: this.onPlayerPlaybackStart?.bind(this),
        [PlayerEvent.PlaybackStop]: this.onPlayerPlaybackStop?.bind(this),
        [PlayerEvent.PlaylistItemAdd]: this.onPlayerPlaylistItemAdd?.bind(this),
        [PlayerEvent.PlaylistItemMove]: this.onPlayerPlaylistItemMove?.bind(this),
        [PlayerEvent.PlaylistItemRemove]: this.onPlayerPlaylistItemRemove?.bind(this),
        [PlayerEvent.RepeatModeChange]: this.onPlayerRepeatModeChange?.bind(this),
        [PlayerEvent.ShuffleModeChange]: this.onPlayerShuffleModeChange?.bind(this),
        [PlayerEvent.Stopped]: this.onPlayerStopped?.bind(this),
        [PlayerEvent.TimeUpdate]: this.onPlayerTimeUpdate?.bind(this),
        [PlayerEvent.Unpause]: this.onPlayerUnpause?.bind(this),
        [PlayerEvent.VolumeChange]: this.onPlayerVolumeChange?.bind(this)
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
