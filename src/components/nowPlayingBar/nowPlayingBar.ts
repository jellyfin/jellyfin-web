console.log('nowPlayingBar loaded');

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
import { appHost } from '../apphost';
import { destroyWaveSurferInstance, waveSurferInitialization } from 'components/visualizer/WaveSurfer';
import dom from '../../utils/dom';
import globalize from 'lib/globalize';
import itemContextMenu from '../itemContextMenu';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-ratingbutton/emby-ratingbutton';
import appFooter from '../appFooter/appFooter';
import itemShortcuts from '../shortcuts';
import './nowPlayingBar.scss';
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
    [key: string]: any;
}

let currentPlayer: any = null;
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
let nowPlayingBarElement: HTMLElement | null = null;

let lastUpdateTime = 0;
let lastPlayerState: PlayerState = {};
let isEnabled = false;
let currentRuntimeTicks = 0;

let isVisibilityAllowed = true;

let isLyricPageActive = false;

function getNowPlayingBarHtml(): string {
    let html = '';

    html += '<div class="nowPlayingBar nowPlayingBar-hidden">';

    html += '<div class="nowPlayingBarTop">';
    html += '<div id="barSurfer" class="nowPlayingBarPositionContainer sliderContainer" dir="ltr">';
    html += '<input type="range" is="emby-slider" pin step=".01" min="0" max="100" value="0" class="slider-medium-thumb nowPlayingBarPositionSlider" data-slider-keep-progress="true"/>';
    html += '</div>';

    html += '<div class="nowPlayingBarInfoContainer">';
    html += '<div class="nowPlayingImage"></div>';
    html += '<div class="nowPlayingBarText"></div>';
    html += '</div>';

    // The onclicks are needed due to the return false above
    html += '<div class="nowPlayingBarCenter" dir="ltr">';

    html += `<button is="paper-icon-button-light" class="previousTrackButton mediaButton" title="${globalize.translate('ButtonPreviousTrack')}"><span class="material-icons skip_previous" aria-hidden="true"></span></button>`;

    html += `<button is="paper-icon-button-light" class="playPauseButton mediaButton" title="${globalize.translate('ButtonPause')}"><span class="material-icons pause" aria-hidden="true"></span></button>`;

    html += `<button is="paper-icon-button-light" class="stopButton mediaButton" title="${globalize.translate('ButtonStop')}"><span class="material-icons stop" aria-hidden="true"></span></button>`;
    if (!layoutManager.mobile) {
        html += `<button is="paper-icon-button-light" class="nextTrackButton mediaButton" title="${globalize.translate('ButtonNextTrack')}"><span class="material-icons skip_next" aria-hidden="true"></span></button>`;
    }

    html += '<div class="nowPlayingBarCurrentTime"></div>';
    html += '</div>';

    html += '<div class="nowPlayingBarRight">';

    html += `<button is="paper-icon-button-light" class="muteButton mediaButton" title="${globalize.translate('Mute')}"><span class="material-icons volume_up" aria-hidden="true"></span></button>`;

    html += '<div class="sliderContainer nowPlayingBarVolumeSliderContainer hide" style="width:9em;vertical-align:middle;display:inline-flex;">';
    html += '<input type="range" is="emby-slider" pin step="1" min="0" max="100" value="0" class="slider-medium-thumb nowPlayingBarVolumeSlider"/>';
    html += '</div>';

    html += `<button is="paper-icon-button-light" class="btnAirPlay mediaButton" title="${globalize.translate('AirPlay')}"><span class="material-icons airplay" aria-hidden="true"></span></button>`;

    html += `<button is="paper-icon-button-light" class="openLyricsButton mediaButton hide" title="${globalize.translate('Lyrics')}"><span class="material-icons lyrics" style="top:0.1em" aria-hidden="true"></span></button>`;

    html += `<button is="paper-icon-button-light" class="toggleRepeatButton mediaButton" title="${globalize.translate('Repeat')}"><span class="material-icons repeat" aria-hidden="true"></span></button>`;
    html += `<button is="paper-icon-button-light" class="btnShuffleQueue mediaButton" title="${globalize.translate('Shuffle')}"><span class="material-icons shuffle" aria-hidden="true"></span></button>`;

    html += '<div class="nowPlayingBarUserDataButtons">';
    html += '</div>';

    html += `<button is="paper-icon-button-light" class="playPauseButton mediaButton" title="${globalize.translate('ButtonPause')}"><span class="material-icons pause" aria-hidden="true"></span></button>`;
    if (layoutManager.mobile) {
        html += `<button is="paper-icon-button-light" class="nextTrackButton mediaButton" title="${globalize.translate('ButtonNextTrack')}"><span class="material-icons skip_next" aria-hidden="true"></span></button>`;
    } else {
        html += `<button is="paper-icon-button-light" class="btnToggleContextMenu mediaButton" title="${globalize.translate('ButtonMore')}"><span class="material-icons more_vert" aria-hidden="true"></span></button>`;
    }

    html += '</div>';
    html += '</div>';

    html += '</div>';

    return html;
}

function onSlideDownComplete(): void {
    // ... existing code
}

function slideDown(elem: HTMLElement): void {
    // trigger reflow
    void elem.offsetWidth;

    elem.classList.add('nowPlayingBar-hidden');

    dom.addEventListener(elem, dom.whichTransitionEvent(), onSlideDownComplete, {
        once: true
    });

    if (currentPlayer?.isLocalPlayer) {
        destroyWaveSurferInstance().then(legacy => {
            // When opening the same song, preserve the player legacy
            waveSurferInitialization('#barSurfer', legacy, currentPlayer.duration());
        });
    }
}

function slideUp(elem: HTMLElement): void {
    dom.removeEventListener(elem, dom.whichTransitionEvent(), onSlideDownComplete, {
        once: true
    });

    elem.classList.remove('hide');

    // trigger reflow
    void elem.offsetWidth;

    elem.classList.remove('nowPlayingBar-hidden');

    // WaveSurfer integration removed due to async issues
}

function onPlayPauseClick(): void {
    // ... existing code
}

function bindEvents(elem: HTMLElement): void {
    currentTimeElement = elem.querySelector('.nowPlayingBarCurrentTime') as HTMLElement;
    nowPlayingImageElement = elem.querySelector('.nowPlayingImage') as HTMLImageElement;
    nowPlayingTextElement = elem.querySelector('.nowPlayingBarText') as HTMLElement;
    nowPlayingUserData = elem.querySelector('.nowPlayingBarUserDataButtons') as any;
    positionSlider = elem.querySelector('.nowPlayingBarPositionSlider') as HTMLInputElement;
    muteButton = elem.querySelector('.muteButton') as HTMLElement;
    playPauseButtons = elem.querySelectorAll('.playPauseButton') as NodeListOf<HTMLElement>;
    toggleRepeatButton = elem.querySelector('.toggleRepeatButton') as HTMLElement;
    volumeSlider = elem.querySelector('.nowPlayingBarVolumeSlider') as HTMLInputElement;
    volumeSliderContainer = elem.querySelector('.nowPlayingBarVolumeSliderContainer') as HTMLElement;
    lyricButton = elem.querySelector('.openLyricsButton') as HTMLElement;

    muteButton.addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.toggleMute(currentPlayer);
        }
    });

    elem.querySelector('.stopButton')?.addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.stop(currentPlayer);
        }
    });

    playPauseButtons.forEach((button) => {
        button.addEventListener('click', onPlayPauseClick);
    });

    elem.querySelector('.nextTrackButton')?.addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.nextTrack(currentPlayer);
        }
    });

    elem.querySelector('.previousTrackButton')?.addEventListener('click', function (e) {
        if (currentPlayer) {
            if (playbackManager.isPlayingAudio(currentPlayer)) {
                // Cancel this event if doubleclick is fired. The actual previousTrack will be processed by the 'dblclick' event
                if ((e as any).detail > 1 ) {
                    return;
                }

                // Return to start of track, unless we are already (almost) at the beginning. In the latter case, continue and move
                // to the previous track, unless we are at the first track so no previous track exists.
                // currentTime is in msec.

                if (playbackManager.currentTime(currentPlayer) >= 5 * 1000 || playbackManager.getCurrentPlaylistIndex() <= 0) {
                    playbackManager.seekPercent(0);
                    // This is done automatically by playbackManager, however, setting this here gives instant visual feedback.
                    // TODO: Check why seekPercent doesn't reflect the changes inmmediately, so we can remove this workaround.
                    if (positionSlider) positionSlider.value = '0';
                    return;
                }
            }
            playbackManager.previousTrack(currentPlayer);
        }
    });

    elem.querySelector('.previousTrackButton')?.addEventListener('dblclick', function () {
        if (currentPlayer) {
            playbackManager.previousTrack(currentPlayer);
        }
    });

    toggleAirPlayButton = elem.querySelector('.btnAirPlay') as HTMLElement;
    toggleAirPlayButton.addEventListener('click', function () {
        if (currentPlayer) {
            // playbackManager.toggleAirPlay(currentPlayer); // Not implemented
        }
    });

    elem.querySelector('.btnShuffleQueue')?.addEventListener('click', function () {
        if (currentPlayer) {
            playbackManager.toggleQueueShuffleMode();
        }
    });

    lyricButton.addEventListener('click', function() {
        if (isLyricPageActive) {
            appRouter.back();
        } else {
            appRouter.show('lyrics');
        }
    });

    toggleRepeatButton.addEventListener('click', function () {
        switch (playbackManager.getRepeatMode()) {
            case 'RepeatAll':
                playbackManager.setRepeatMode('RepeatOne');
                break;
            case 'RepeatOne':
                playbackManager.setRepeatMode('RepeatNone');
                break;
            case 'RepeatNone':
                playbackManager.setRepeatMode('RepeatAll');
        }
    });

    toggleRepeatButtonIcon = toggleRepeatButton.querySelector('.material-icons') as HTMLElement;

    volumeSliderContainer.classList.toggle('hide', appHost.supports(AppFeature.PhysicalVolumeControl));

    volumeSlider.addEventListener('input', (e) => {
        if (currentPlayer) {
            currentPlayer.setVolume((e.target as HTMLInputElement).value);
        }
    });

    positionSlider.addEventListener('change', function () {
        if (currentPlayer) {
            const newPercent = parseFloat(this.value);

            playbackManager.seekPercent(newPercent);
        }
    });

    (positionSlider as any).getBubbleText = function (value: any) {
        const state = lastPlayerState;

        if (!state?.NowPlayingItem || !currentRuntimeTicks) {
            return '--:--';
        }

        let ticks = currentRuntimeTicks;
        ticks /= 100;
        ticks *= value;

        return datetime.getDisplayRunningTime(ticks);
    };

    elem.addEventListener('click', function (e) {
        if (!dom.parentWithTag(e.target as HTMLElement, ['BUTTON', 'INPUT'])) {
            showRemoteControl();
        }
    });
}

function showRemoteControl(): void {
    // ... existing code
}

function getNowPlayingBar(): HTMLElement | null {
    if (nowPlayingBarElement) {
        return nowPlayingBarElement;
    }

    nowPlayingBarElement = document.body.querySelector('.nowPlayingBar');

    if (nowPlayingBarElement) {
        return nowPlayingBarElement;
    }

    document.body.insertAdjacentHTML('beforeend', getNowPlayingBarHtml());
    (window as any).customElements.upgradeSubtree(document.body);

    nowPlayingBarElement = document.body.querySelector('.nowPlayingBar');

    if (nowPlayingBarElement) {
        if (layoutManager.mobile) {
            nowPlayingBarElement.querySelector('.btnShuffleQueue')?.classList.add('hide');
            nowPlayingBarElement.querySelector('.nowPlayingBarCenter')?.classList.add('hide');
        }

        if (browser.safari) {
            // Not handled well here. The wrong elements receive events, bar doesn't update quickly enough, etc.
            nowPlayingBarElement.classList.add('noMediaProgress');
        }

        itemShortcuts.on(nowPlayingBarElement);

        bindEvents(nowPlayingBarElement);
    }

    return nowPlayingBarElement;
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
    console.log('bindToPlayer called', player);
    isLyricPageActive = isLyricsPage();
    if (player === currentPlayer) {
        return;
    }

    releaseCurrentPlayer();

    currentPlayer = player;

    if (!player) {
        return;
    }

    refreshFromPlayer(player, 'init');

    Events.on(player, 'playbackstart', onPlaybackStart);
    Events.on(player, 'statechange', onStateChanged);
    Events.on(player, 'repeatmodechange', onRepeatModeChange);
    Events.on(player, 'shufflequeuemodechange', onQueueShuffleModeChange);
    Events.on(player, 'playbackstop', onPlaybackStopped);
    Events.on(player, 'volumechange', onVolumeChanged);
    Events.on(player, 'pause', onPlayPauseStateChanged);
    Events.on(player, 'unpause', onPlayPauseStateChanged);
    Events.on(player, 'timeupdate', onTimeUpdate);
}

// Event listeners
Events.on(playbackManager, 'playerchange', () => {
bindToPlayer((playbackManager as any).getCurrentPlayer());

// Create the bar element immediately
getNowPlayingBar();
// Force show for debugging
showNowPlayingBar();
});

bindToPlayer((playbackManager as any).getCurrentPlayer());

document.addEventListener('viewbeforeshow', (e: any) => {
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
