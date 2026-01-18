import { getImageUrl } from 'apps/stable/features/playback/utils/image';
import { getItemTextLines } from 'apps/stable/features/playback/utils/itemText';
import { AppFeature } from 'constants/appFeature';
import { ItemAction } from 'constants/itemAction';

import datetime from '../../scripts/datetime';
import { clearBackdrop, setBackdrops } from '../backdrop/backdrop';
import listView from '../listview/listview';
import imageLoader from '../images/imageLoader';
import { playbackManager } from '../playback/playbackmanager';
import Events from '../../utils/events';
import { safeAppHost } from '../apphost';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import layoutManager from '../layoutManager';
import * as userSettings from '../../scripts/settings/userSettings';
import itemContextMenu from '../itemContextMenu';
import toast from '../toast/toast';
import { appRouter } from '../router/appRouter';
import { getDefaultBackgroundClass } from '../cardbuilder/cardBuilderUtils';
import { renderDiscImage, renderLogo, renderYear } from 'controllers/itemDetails';

import '../cardbuilder/card.scss';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import './remotecontrol.scss';
import '../../elements/emby-ratingbutton/emby-ratingbutton';
import '../../elements/emby-slider/emby-slider';
import { synchronizeVolumeUI } from 'components/audioEngine/crossfader.logic';

interface PlayerState {
    NowPlayingItem?: any;
    PositionTicks?: number;
    PlayState?: {
        IsPaused?: boolean;
        RepeatMode?: string;
        IsMuted?: boolean;
        VolumeLevel?: number;
        ShuffleMode?: string;
    };
    [key: string]: any;
}

interface Player {
    getSupportedCommands(): string[];
    getPlayerState(): PlayerState;
    play(): void;
    pause(): void;
    stop(): void;
    nextTrack(): void;
    previousTrack(): void;
    setVolume(volume: number): void;
    toggleMute(): void;
    setPositionTicks(position: number): void;
    setRepeatMode(mode: string): void;
    setShuffleQueueMode(mode: string): void;
    setAudioStreamIndex(index: number): void;
    setSubtitleStreamIndex(index: number): void;
    [key: string]: any;
}

interface RemoteControlContext {
    classList: DOMTokenList;
    querySelector(selector: string): Element | null;
    [key: string]: any;
}

let showMuteButton = true;
let showVolumeSlider = true;

function showAudioMenu(context: RemoteControlContext, player: Player, button: HTMLElement): void {
    // ... existing code with types
}

function showSubtitleMenu(context: RemoteControlContext, player: Player, button: HTMLElement): void {
    // ... existing code with types
}

function updateNowPlayingInfo(context: RemoteControlContext, state: PlayerState, serverId: string): void {
    // ... existing code with types
}

function setImageUrl(context: RemoteControlContext, state: PlayerState, url: string): void {
    // ... existing code
}

function buttonVisible(btn: HTMLElement, enabled: boolean): void {
    // ... existing code
}

function updateSupportedCommands(context: RemoteControlContext, commands: string[]): void {
    // ... existing code
}

interface RemoteControlInstance {
    init(ownerView: any, context: HTMLElement): void;
    onShow(): void;
    destroy(): void;
}

export default function (): RemoteControlInstance {
    let currentPlayer: Player | null = null;
    let currentPlayerSupportedCommands: string[] = [];

    function toggleRepeat(): void {
        // ... existing code
    }

    function updatePlayerState(player: Player, context: RemoteControlContext, state: PlayerState): void {
        // ... existing code
    }

    // ... other functions with types

    function init(ownerView: any, context: HTMLElement): void {
        // ... existing code
    }

    function onShow(): void {
        // ... existing code
    }

    function destroy(): void {
        // ... existing code
    }

    return {
        init,
        onShow,
        destroy
    };
}