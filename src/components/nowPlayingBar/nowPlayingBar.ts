import { getImageUrl } from 'apps/stable/features/playback/utils/image';
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

import { synchronizeVolumeUI } from 'components/audioEngine/audioUtils';
import { logger } from 'utils/logger';

// Store imports for migration
import { usePlaybackActions, useQueueActions, useVolume, useIsMuted, usePlaybackStatus, useProgress, useCurrentTime, useDuration, useRepeatMode, useShuffleMode, useIsShuffled, useCurrentItem, useCurrentQueueIndex } from 'store';

interface PlayerState {
    NowPlayingItem?: NowPlayingItem;
    MediaSource?: { RunTimeTicks?: number };
    PlayState?: PlayState;
    IsFullscreen?: boolean;
    NextMediaType?: string;
}

interface NowPlayingItem {
    Id?: string;
    ServerId?: string;
    Name?: string;
    Type?: string;
    MediaType?: string;
    RunTimeTicks?: number;
    HasLyrics?: boolean;
    [key: string]: unknown;
}

interface PlayState {
    IsPaused?: boolean;
    CanSeek?: boolean;
    IsMuted?: boolean;
    VolumeLevel?: number;
    PositionTicks?: number;
}

interface Player {
    isLocalPlayer?: boolean;
    paused(): boolean;
    isMuted(): boolean;
    getVolume(): number;
    setVolume(volume: number): void;
    duration?(): number;
}

interface BufferedRange {
    start: number;
    end: number;
}

let currentPlayer: Player | null = null;
let currentPlayerSupportedCommands: string[] = [];

let currentTimeElement: HTMLElement | null = null;
let nowPlayingImageElement: HTMLElement | null = null;
let nowPlayingImageUrl: string | null = null;
let nowPlayingTextElement: HTMLElement | null = null;
let nowPlayingUserData: HTMLElement | null = null;
let muteButton: HTMLElement | null = null;
let volumeSlider: (HTMLInputElement & { dragging?: boolean }) | null = null;
let volumeSliderContainer: HTMLElement | null = null;
let playPauseButtons: NodeListOf<HTMLElement> | null = null;
let positionSlider: (HTMLInputElement & { dragging?: boolean; disabled?: boolean; setIsClear?(clear: boolean): void; setBufferedRanges?(ranges: BufferedRange[], runtime: number, position: number): void }) | null = null;
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

// Store-backed control functions (migration layer)
function getStoreDuration(): number {
    const duration = useDuration();
    return duration || 0;
}

function getStoreCurrentTime(): number {
    return useCurrentTime();
}

function getStoreIsPlaying(): boolean {
    return usePlaybackStatus() === 'playing';
}

function getStoreIsPaused(): boolean {
    const status = usePlaybackStatus();
    return status === 'paused' || status === 'idle';
}

function getStoreVolume(): number {
    return useVolume();
}

function getStoreIsMuted(): boolean {
    return useIsMuted();
}

function getStoreRepeatMode(): string {
    return useRepeatMode();
}

function getStoreShuffleMode(): string {
    return useShuffleMode();
}

function getStoreIsShuffled(): boolean {
    return useIsShuffled();
}

function getStoreCurrentItem(): ReturnType<typeof useCurrentItem> {
    return useCurrentItem();
}

export function getNowPlayingBarHtml(): string {
    let html = '';

    html += '<div class="nowPlayingBar hide nowPlayingBar-hidden">';

    html += '<div class="nowPlayingBarTop">';
    html += '<div id="barSurfer" class="nowPlayingBarPositionContainer sliderContainer" dir="ltr">';
    html += '<input type="range" is="emby-slider" pin step=".01" min="0" max="100" value="0" class="slider-medium-thumb nowPlayingBarPositionSlider" data-slider-keep-progress="true"/>';
    html += '</div>';

    html += '<div class="nowPlayingBarInfoContainer">';
    html += '<div class="nowPlayingImage"></div>';
    html += '<div class="nowPlayingBarText"></div>';
    html += '</div>';

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

function onSlideDownComplete(this: HTMLElement): void {
    this.classList.add('hide');
}

function slideDown(elem: HTMLElement): void {
    // trigger reflow
    void elem.offsetWidth;

    elem.classList.add('nowPlayingBar-hidden');

    dom.addEventListener(elem, dom.whichTransitionEvent(), onSlideDownComplete, {
        once: true
    });

    void destroyWaveSurferInstance().then(legacy => {
        if (!currentPlayer?.isLocalPlayer) return;
        waveSurferInitialization('#inputSurfer', legacy, getStoreDuration());
    });
}

function slideUp(elem: HTMLElement): void {
    dom.removeEventListener(elem, dom.whichTransitionEvent(), onSlideDownComplete, {
        once: true
    });

    elem.classList.remove('hide');

    // trigger reflow
    void elem.offsetWidth;

    elem.classList.remove('nowPlayingBar-hidden');

    void destroyWaveSurferInstance().then(legacy => {
        if (!currentPlayer?.isLocalPlayer) return;
        waveSurferInitialization('#barSurfer', legacy, getStoreDuration());
    });
}

export function onPlayPauseClick(): void {
    const { togglePlayPause } = usePlaybackActions();
    togglePlayPause();
}

export function bindEvents(elem: HTMLElement): void {
    currentTimeElement = elem.querySelector('.nowPlayingBarCurrentTime');
    nowPlayingImageElement = elem.querySelector('.nowPlayingImage');
    nowPlayingTextElement = elem.querySelector('.nowPlayingBarText');
    nowPlayingUserData = elem.querySelector('.nowPlayingBarUserDataButtons');
    positionSlider = elem.querySelector('.nowPlayingBarPositionSlider');
    muteButton = elem.querySelector('.muteButton');
    playPauseButtons = elem.querySelectorAll('.playPauseButton');
    toggleRepeatButton = elem.querySelector('.toggleRepeatButton');
    volumeSlider = elem.querySelector('.nowPlayingBarVolumeSlider');
    volumeSliderContainer = elem.querySelector('.nowPlayingBarVolumeSliderContainer');
    lyricButton = elem.querySelector('.openLyricsButton');

    muteButton?.addEventListener('click', () => {
        const { toggleMute } = usePlaybackActions();
        toggleMute();
    });

    elem.querySelector('.stopButton')?.addEventListener('click', () => {
        const { stop } = usePlaybackActions();
        stop();
    });

    playPauseButtons?.forEach((button) => {
        button.addEventListener('click', onPlayPauseClick);
    });

    elem.querySelector('.nextTrackButton')?.addEventListener('click', () => {
        const { next } = useQueueActions();
        next();
    });

    elem.querySelector('.previousTrackButton')?.addEventListener('click', (e: Event) => {
        if (getStoreIsPlaying()) {
            if ((e as MouseEvent).detail > 1) {
                return;
            }
            if (getStoreCurrentTime() >= 5 || useCurrentQueueIndex() <= 0) {
                const { seek } = usePlaybackActions();
                seek(0);
                if (positionSlider) positionSlider.value = '0';
                return;
            }
        }
        const { previous } = useQueueActions();
        previous();
    });

    elem.querySelector('.previousTrackButton')?.addEventListener('dblclick', () => {
        const { previous } = useQueueActions();
        previous();
    });

    toggleAirPlayButton = elem.querySelector('.btnAirPlay');
    toggleAirPlayButton?.addEventListener('click', () => {
        if (currentPlayer) {
            playbackManager.toggleAirPlay(currentPlayer);
        }
    });

    elem.querySelector('.btnShuffleQueue')?.addEventListener('click', () => {
        const { toggleShuffleMode } = useQueueActions();
        toggleShuffleMode();
    });

    lyricButton?.addEventListener('click', () => {
        if (isLyricPageActive) {
            appRouter.back();
        } else {
            appRouter.show('lyrics');
        }
    });

    toggleRepeatButton = elem.querySelector('.toggleRepeatButton');
    toggleRepeatButton?.addEventListener('click', () => {
        const { toggleRepeatMode } = useQueueActions();
        toggleRepeatMode();
    });

    toggleRepeatButtonIcon = toggleRepeatButton?.querySelector('.material-icons') ?? null;

    volumeSliderContainer?.classList.toggle('hide', appHost.supports(AppFeature.PhysicalVolumeControl));

    volumeSlider?.addEventListener('input', (e) => {
        const { setVolume } = usePlaybackActions();
        setVolume(parseInt((e.target as HTMLInputElement).value, 10));
    });

    positionSlider?.addEventListener('change', function(this: HTMLInputElement) {
        const { seekPercent } = usePlaybackActions();
        const newPercent = parseFloat(this.value);
        seekPercent(newPercent);
    });

    if (positionSlider) {
        (positionSlider as HTMLInputElement & { getBubbleText?: (value: number) => string }).getBubbleText = (value: number): string => {
            const state = lastPlayerState;

            if (!state?.NowPlayingItem || !currentRuntimeTicks) {
                return '--:--';
            }

            let ticks = currentRuntimeTicks;
            ticks /= 100;
            ticks *= value;

            return datetime.getDisplayRunningTime(ticks);
        };
    }

    elem.addEventListener('click', (e) => {
        if (!dom.parentWithTag(e.target as HTMLElement, ['BUTTON', 'INPUT'])) {
            showRemoteControl();
        }
    });
}

function showRemoteControl(): void {
    appRouter.showNowPlaying();
}

function getNowPlayingBar(): HTMLElement | null {
    if (nowPlayingBarElement) {
        return nowPlayingBarElement;
    }

    const parentContainer = appFooter.element;
    nowPlayingBarElement = parentContainer?.querySelector('.nowPlayingBar') ?? null;

    if (nowPlayingBarElement) {
        return nowPlayingBarElement;
    }

    if (parentContainer) {
        parentContainer.insertAdjacentHTML('afterbegin', getNowPlayingBarHtml());
        (window as Window & { CustomElements?: { upgradeSubtree(elem: Element): void } }).CustomElements?.upgradeSubtree(parentContainer);

        nowPlayingBarElement = parentContainer.querySelector('.nowPlayingBar');

        if (nowPlayingBarElement) {
            if (layoutManager.mobile) {
                nowPlayingBarElement.querySelector('.btnShuffleQueue')?.classList.add('hide');
                nowPlayingBarElement.querySelector('.nowPlayingBarCenter')?.classList.add('hide');
            }

            if (browser.safari && browser.slow) {
                nowPlayingBarElement.classList.add('noMediaProgress');
            }

            itemShortcuts.on(nowPlayingBarElement);
            bindEvents(nowPlayingBarElement);
            synchronizeVolumeUI();
        }
    }

    return nowPlayingBarElement;
}

export function updatePlayPauseState(isPaused: boolean): void {
    if (playPauseButtons) {
        playPauseButtons.forEach((button) => {
            const icon = button.querySelector('.material-icons');
            if (icon) {
                icon.classList.remove('play_arrow', 'pause');
                icon.classList.add(isPaused ? 'play_arrow' : 'pause');
            }
            button.title = globalize.translate(isPaused ? 'Play' : 'ButtonPause');
        });
    }
}

function updatePlayerStateInternal(event: Event, state: PlayerState, player: Player): void {
    showNowPlayingBar();

    lastPlayerState = state;

    const playerInfo = playbackManager.getPlayerInfo();
    const playState = state.PlayState || {};

    updatePlayPauseState(playState.IsPaused ?? false);

    const supportedCommands = playerInfo?.supportedCommands ?? [];
    currentPlayerSupportedCommands = supportedCommands;

    if (supportedCommands.indexOf('SetRepeatMode') === -1) {
        toggleRepeatButton?.classList.add('hide');
    } else {
        toggleRepeatButton?.classList.remove('hide');
    }

    const hideAirPlayButton = supportedCommands.indexOf('AirPlay') === -1;
    toggleAirPlayButton?.classList.toggle('hide', hideAirPlayButton);

    updateRepeatModeDisplay(playbackManager.getRepeatMode());
    onQueueShuffleModeChange();

    updatePlayerVolumeState(playState.IsMuted ?? false, playState.VolumeLevel ?? 0);

    if (positionSlider && !positionSlider.dragging) {
        positionSlider.disabled = !playState.CanSeek;

        // determines if both forward and backward buffer progress will be visible
        const isProgressClear = state.MediaSource?.RunTimeTicks == null;
        positionSlider.setIsClear?.(isProgressClear);
    }

    const nowPlayingItem = state.NowPlayingItem || {};
    updateTimeDisplay(
        playState.PositionTicks ?? 0,
        nowPlayingItem.RunTimeTicks ?? 0,
        playbackManager.getBufferedRanges(player)
    );

    updateNowPlayingInfo(state);
    updateLyricButton(nowPlayingItem);
}

export function updateRepeatModeDisplay(repeatMode: string): void {
    if (!toggleRepeatButtonIcon) return;

    toggleRepeatButtonIcon.classList.remove('repeat', 'repeat_one');
    const cssClass = 'buttonActive';

    switch (repeatMode) {
        case 'RepeatAll':
            toggleRepeatButtonIcon.classList.add('repeat');
            toggleRepeatButton?.classList.add(cssClass);
            break;
        case 'RepeatOne':
            toggleRepeatButtonIcon.classList.add('repeat_one');
            toggleRepeatButton?.classList.add(cssClass);
            break;
        case 'RepeatNone':
        default:
            toggleRepeatButtonIcon.classList.add('repeat');
            toggleRepeatButton?.classList.remove(cssClass);
            break;
    }
}

export function updateTimeDisplay(positionTicks: number, runtimeTicks: number, bufferedRanges: BufferedRange[]): void {
    // See bindEvents for why this is necessary
    if (positionSlider && !positionSlider.dragging) {
        if (runtimeTicks) {
            let pct = positionTicks / runtimeTicks;
            pct *= 100;
            positionSlider.value = String(pct);
        } else {
            positionSlider.value = '0';
        }
    }

    positionSlider?.setBufferedRanges?.(bufferedRanges, runtimeTicks, positionTicks);

    if (currentTimeElement) {
        let timeText = positionTicks == null ? '--:--' : datetime.getDisplayRunningTime(positionTicks);
        if (runtimeTicks) {
            timeText += ' / ' + datetime.getDisplayRunningTime(runtimeTicks);
        }
        currentTimeElement.innerHTML = timeText;
    }
}

export function updatePlayerVolumeState(isMuted: boolean, volumeLevel: number): void {
    const supportedCommands = currentPlayerSupportedCommands;

    let showMuteButton = true;
    let showVolumeSlider = true;

    if (supportedCommands.indexOf('ToggleMute') === -1) {
        showMuteButton = false;
    }

    if (muteButton) {
        const muteButtonIcon = muteButton.querySelector('.material-icons');
        if (muteButtonIcon) {
            muteButtonIcon.classList.remove('volume_off', 'volume_up');
            muteButtonIcon.classList.add(isMuted ? 'volume_off' : 'volume_up');
        }
        muteButton.title = globalize.translate(isMuted ? 'Unmute' : 'Mute');
    }

    if (supportedCommands.indexOf('SetVolume') === -1) {
        showVolumeSlider = false;
    }

    if (currentPlayer?.isLocalPlayer && appHost.supports(AppFeature.PhysicalVolumeControl)) {
        showMuteButton = false;
        showVolumeSlider = false;
    }

    muteButton?.classList.toggle('hide', !showMuteButton);

    if (volumeSlider) {
        volumeSliderContainer?.classList.toggle('hide', !showVolumeSlider);

        if (!volumeSlider.dragging) {
            volumeSlider.value = String(volumeLevel || 0);
        }
    }
}

export function updateLyricButton(item: NowPlayingItem): void {
    if (!isEnabled || !lyricButton) return;

    const hasLyrics = item?.Type === 'Audio' && item.HasLyrics;
    lyricButton.classList.toggle('hide', !hasLyrics);
    setLyricButtonActiveStatus();
}

function setLyricButtonActiveStatus(): void {
    if (!isEnabled || !lyricButton) return;

    lyricButton.classList.toggle('buttonActive', isLyricPageActive);
}

export function updateNowPlayingInfo(state: PlayerState): void {
    const nowPlayingItem = state.NowPlayingItem;

    const textLines = nowPlayingItem ? getItemTextLines(nowPlayingItem) : undefined;
    if (nowPlayingTextElement) {
        nowPlayingTextElement.innerHTML = '';
        if (textLines) {
            const itemText = document.createElement('div');
            const secondaryText = document.createElement('div');
            secondaryText.classList.add('nowPlayingBarSecondaryText');

            if (textLines.length > 1 && textLines[1]) {
                const text = document.createElement('a');
                text.innerText = textLines[1];
                secondaryText.appendChild(text);
            }

            if (textLines[0]) {
                const text = document.createElement('a');
                text.innerText = textLines[0];
                itemText.appendChild(text);
            }

            nowPlayingTextElement.appendChild(itemText);
            nowPlayingTextElement.appendChild(secondaryText);
        }
    }

    const imgHeight = 70;

    const url = nowPlayingItem ? getImageUrl(nowPlayingItem, { height: imgHeight }) : null;

    if (url !== nowPlayingImageUrl && nowPlayingImageElement) {
        if (url) {
            nowPlayingImageUrl = url;
            imageLoader.lazyImage(nowPlayingImageElement, nowPlayingImageUrl);
            nowPlayingImageElement.style.display = '';
            if (nowPlayingTextElement) nowPlayingTextElement.style.marginLeft = '';
        } else {
            nowPlayingImageUrl = null;
            (nowPlayingImageElement as HTMLElement).style.backgroundImage = '';
            nowPlayingImageElement.style.display = 'none';
            if (nowPlayingTextElement) nowPlayingTextElement.style.marginLeft = '1em';
        }
    }

    if (nowPlayingItem?.Id && nowPlayingItem.ServerId && nowPlayingUserData && nowPlayingBarElement) {
        const apiClient = ServerConnections.getApiClient(nowPlayingItem.ServerId);
        apiClient.getItem(apiClient.getCurrentUserId(), nowPlayingItem.Id).then((item: { UserData?: { Likes?: boolean; IsFavorite?: boolean }; Id: string; ServerId: string; Type: string }) => {
            const userData = item.UserData || {};
            const likes = userData.Likes == null ? '' : userData.Likes;

            if (!layoutManager.mobile && nowPlayingBarElement) {
                let contextButton = nowPlayingBarElement.querySelector('.btnToggleContextMenu');
                if (contextButton) {
                    // We remove the previous event listener by replacing the item in each update event
                    const contextButtonClone = contextButton.cloneNode(true);
                    contextButton.parentNode?.replaceChild(contextButtonClone, contextButton);
                    contextButton = nowPlayingBarElement.querySelector('.btnToggleContextMenu');

                    const options = {
                        play: false,
                        queue: false,
                        stopPlayback: true,
                        clearQueue: true,
                        positionTo: contextButton
                    };

                    apiClient.getCurrentUser().then((user: unknown) => {
                        contextButton?.addEventListener('click', () => {
                            itemContextMenu.show(Object.assign({
                                item: item,
                                user: user
                            }, options))
                                .catch(() => { /* no-op */ });
                        });
                    });
                }
            }

            if (nowPlayingUserData) {
                nowPlayingUserData.innerHTML = '<button is="emby-ratingbutton" type="button" class="mediaButton paper-icon-button-light" data-id="' + item.Id + '" data-serverid="' + item.ServerId + '" data-itemtype="' + item.Type + '" data-likes="' + likes + '" data-isfavorite="' + (userData.IsFavorite) + '"><span class="material-icons favorite" aria-hidden="true"></span></button>';
            }
        });
    } else if (nowPlayingUserData) {
        nowPlayingUserData.innerHTML = '';
    }
}

function onPlaybackStart(this: Player, e: Event, state: PlayerState): void {
    logger.debug('nowplaying event: ' + e.type, { component: 'nowPlayingBar' });
    onStateChanged.call(this, e, state);
}

function onRepeatModeChange(): void {
    if (!isEnabled) return;
    updateRepeatModeDisplay(playbackManager.getRepeatMode());
}

function onQueueShuffleModeChange(): void {
    if (!isEnabled || !nowPlayingBarElement) return;

    const shuffleMode = playbackManager.getQueueShuffleMode();
    const cssClass = 'buttonActive';
    const toggleShuffleButton = nowPlayingBarElement.querySelector('.btnShuffleQueue');

    switch (shuffleMode) {
        case 'Shuffle':
            toggleShuffleButton?.classList.add(cssClass);
            break;
        case 'Sorted':
        default:
            toggleShuffleButton?.classList.remove(cssClass);
            break;
    }
}

export function showNowPlayingBar(): void {
    if (!isVisibilityAllowed) {
        hideNowPlayingBar();
        return;
    }

    const elem = getNowPlayingBar();
    if (elem) {
        slideUp(elem);
    }
}

export function hideNowPlayingBar(): void {
    isEnabled = false;

    // Don't call getNowPlayingBar here because we don't want to end up creating it just to hide it
    const elem = document.querySelector('.nowPlayingBar') as HTMLElement | null;
    if (elem) {
        slideDown(elem);
    }
}

function onPlaybackStopped(this: Player, e: Event, state: PlayerState): void {
    logger.debug('[nowPlayingBar:onPlaybackStopped] event: ' + e.type, { component: 'nowPlayingBar' });

    if (this.isLocalPlayer) {
        if (state.NextMediaType !== 'Audio') {
            hideNowPlayingBar();
        }
    } else if (!state.NextMediaType) {
        hideNowPlayingBar();
    }
}

function onPlayPauseStateChanged(this: Player): void {
    if (!isEnabled) return;
    updatePlayPauseState(this.paused());
}

export function onStateChanged(this: Player, event: Event, state: PlayerState): void {
    if (event.type === 'init') {
        // skip non-ready state
        return;
    }

    logger.debug('[nowPlayingBar:onStateChanged] event: ' + event.type, { component: 'nowPlayingBar' });

    if (!state.NowPlayingItem || layoutManager.tv || state.IsFullscreen === false) {
        hideNowPlayingBar();
        return;
    }

    if (this.isLocalPlayer && state.NowPlayingItem && state.NowPlayingItem.MediaType === 'Video') {
        hideNowPlayingBar();
        return;
    }

    isEnabled = true;

    if (nowPlayingBarElement) {
        updatePlayerStateInternal(event, state, this);
        return;
    }

    getNowPlayingBar();
    updateLyricButton(state.NowPlayingItem);
    updatePlayerStateInternal(event, state, this);
}

function onTimeUpdate(this: Player): void {
    if (!isEnabled) return;

    // Try to avoid hammering the document with changes
    const now = new Date().getTime();
    if ((now - lastUpdateTime) < 700) {
        return;
    }
    lastUpdateTime = now;

    currentRuntimeTicks = playbackManager.duration(this);
    updateTimeDisplay(
        playbackManager.currentTime(this) * 10000,
        currentRuntimeTicks,
        playbackManager.getBufferedRanges(this)
    );
}

function releaseCurrentPlayer(): void {
    const player = currentPlayer;

    if (player) {
        Events.off(player, 'playbackstart', onPlaybackStart);
        Events.off(player, 'statechange', onPlaybackStart);
        Events.off(player, 'repeatmodechange', onRepeatModeChange);
        Events.off(player, 'shufflequeuemodechange', onQueueShuffleModeChange);
        Events.off(player, 'playbackstop', onPlaybackStopped);
        Events.off(player, 'volumechange', onVolumeChanged);
        Events.off(player, 'pause', onPlayPauseStateChanged);
        Events.off(player, 'unpause', onPlayPauseStateChanged);
        Events.off(player, 'timeupdate', onTimeUpdate);

        currentPlayer = null;
        hideNowPlayingBar();
    }
}

function onVolumeChanged(this: Player): void {
    if (!isEnabled) return;
    updatePlayerVolumeState(this.isMuted(), this.getVolume());
}

function refreshFromPlayer(player: Player, type: string): void {
    const state = playbackManager.getPlayerState(player);
    onStateChanged.call(player, { type } as unknown as Event, state);
}

function bindToPlayer(player: Player | null): void {
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
    Events.on(player, 'statechange', onPlaybackStart);
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
    bindToPlayer(playbackManager.getCurrentPlayer());
});

bindToPlayer(playbackManager.getCurrentPlayer());

document.addEventListener('viewbeforeshow', (e: Event) => {
    const detail = (e as CustomEvent<{ options?: { enableMediaControl?: boolean } }>).detail;
    isLyricPageActive = isLyricsPage();
    setLyricButtonActiveStatus();

    if (!detail?.options?.enableMediaControl) {
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
