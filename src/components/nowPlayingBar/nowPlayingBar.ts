import { getItemTextLines } from 'apps/stable/features/playback/utils/itemText';
import { appRouter, isLyricsPage } from 'components/router/appRouter';
import { AppFeature } from 'constants/appFeature';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import datetime from '../../scripts/datetime';
import Events from '../../utils/events';
import browser from '../../scripts/browser';
import imageLoader from '../images/imageLoader';
import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import { safeAppHost } from '../apphost';
import dom from '../../utils/dom';
import globalize from 'lib/globalize';
import itemContextMenu from '../itemContextMenu';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-ratingbutton/emby-ratingbutton';
import appFooter from '../appFooter/appFooter';
import itemShortcuts from '../shortcuts';
import './nowPlayingBar.scss';
import '../../elements/emby-slider/emby-slider';
import { destroyWaveSurferInstance, waveSurferInitialization } from 'components/visualizer/lazyWaveSurfer';
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
    [key: string]: any;
}

let currentPlayer: Player | null = null;
let currentPlayerSupportedCommands: string[] = [];

let currentTimeElement: HTMLElement | null = null;
let nowPlayingImageElement: HTMLImageElement | null = null;
let nowPlayingImageUrl: string | null = null;
let nowPlayingTextElement: HTMLElement | null = null;
let nowPlayingUserData: any = null;
let muteButton: HTMLElement | null = null;
let volumeSlider: HTMLInputElement | null = null;
let volumeSliderContainer: HTMLElement | null = null;
let playPauseButtons: NodeListOf<HTMLElement> | null = null;
let positionSlider: HTMLInputElement | null = null;
let toggleAirPlayButton: HTMLElement | null = null;
let toggleRepeatButton: HTMLElement | null = null;
let toggleRepeatButtonIcon: HTMLElement | null = null;
let lyricButton: HTMLElement | null = null;

let lastUpdateTime = 0;
let lastPlayerState: PlayerState = {};
let isEnabled = false;
let currentRuntimeTicks = 0;

let isVisibilityAllowed = true;

let isLyricPageActive = false;

function getNowPlayingBarHtml(): string {
    // ... existing code
    return '';
}

function onSlideDownComplete(): void {
    // ... existing code
}

function slideDown(elem: HTMLElement): void {
    // ... existing code
}

function slideUp(elem: HTMLElement): void {
    // ... existing code
}

function onPlayPauseClick(): void {
    // ... existing code
}

function bindEvents(elem: HTMLElement): void {
    // ... existing code with typed event listeners
    playPauseButtons = elem.querySelectorAll('.btnPlayPause') as NodeListOf<HTMLElement>;
    positionSlider = elem.querySelector('.nowPlayingBarPositionSlider') as HTMLInputElement;
    muteButton = elem.querySelector('.muteButton') as HTMLElement;
    volumeSlider = elem.querySelector('.nowPlayingBarVolumeSlider') as HTMLInputElement;
    volumeSliderContainer = elem.querySelector('.nowPlayingBarVolumeSliderContainer') as HTMLElement;
    toggleAirPlayButton = elem.querySelector('.btnAirPlay') as HTMLElement;
    toggleRepeatButton = elem.querySelector('.btnRepeat') as HTMLElement;
    toggleRepeatButtonIcon = elem.querySelector('.btnRepeat i') as HTMLElement;
    lyricButton = elem.querySelector('.btnLyrics') as HTMLElement;

    // Add event listeners with proper types
    muteButton.addEventListener('click', function () {
        // ... existing code
    });

    // ... more event listeners
}

function showRemoteControl(): void {
    // ... existing code
}

function getNowPlayingBar(): HTMLElement | null {
    // ... existing code
    return null;
}

function updatePlayPauseState(isPaused: boolean): void {
    // ... existing code
}

function updatePlayerStateInternal(event: any, state: PlayerState, player: Player): void {
    // ... existing code
}

function updateRepeatModeDisplay(repeatMode: string): void {
    // ... existing code
}

function updateTimeDisplay(positionTicks: number, runtimeTicks: number, bufferedRanges: any): void {
    // ... existing code
}

function updatePlayerVolumeState(isMuted: boolean, volumeLevel: number): void {
    // ... existing code
}

function updateLyricButton(item: any): void {
    // ... existing code
}

function setLyricButtonActiveStatus(): void {
    // ... existing code
}

function updateNowPlayingInfo(state: PlayerState): void {
    // ... existing code
}

function onPlaybackStart(e: any, state: PlayerState): void {
    // ... existing code
}

function onRepeatModeChange(): void {
    // ... existing code
}

function onQueueShuffleModeChange(): void {
    // ... existing code
}

function showNowPlayingBar(): void {
    // ... existing code
}

function hideNowPlayingBar(): void {
    // ... existing code
}

function onPlaybackStopped(e: any, state: PlayerState): void {
    // ... existing code
}

function onPlayPauseStateChanged(): void {
    // ... existing code
}

function onStateChanged(event: any, state: PlayerState): void {
    // ... existing code
}

function onTimeUpdate(): void {
    // ... existing code
}

function releaseCurrentPlayer(): void {
    // ... existing code
}

function onVolumeChanged(): void {
    // ... existing code
}

function refreshFromPlayer(player: Player, type: string): void {
    // ... existing code
}

function bindToPlayer(player: Player | null): void {
    // ... existing code
}

// Event listeners
Events.on(playbackManager, 'playerchange', function () {
    bindToPlayer((playbackManager as any).getCurrentPlayer());
});

bindToPlayer((playbackManager as any).getCurrentPlayer());

document.addEventListener('viewbeforeshow', function (e: any) {
    isLyricPageActive = isLyricsPage();
    setLyricButtonActiveStatus();
    if (!e.detail.options.enableMediaControl) {
        if (isVisibilityAllowed) {
            isVisibilityAllowed = false;
            hideNowPlayingBar();
        }
    } else if (!isVisibilityAllowed) {
        isVisibilityAllowed = true;
        if (currentPlayer) {
            refreshFromPlayer(currentPlayer, 'refresh');
        } else {
            hideNowPlayingBar();
        }
    }
});