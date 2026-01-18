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

const showMuteButton = true;
const showVolumeSlider = true;

function showAudioMenu(context: RemoteControlContext, player: Player, button: HTMLElement): void {
    const currentIndex = (playbackManager as any).getAudioStreamIndex(player as any);
    const streams = (playbackManager as any).audioTracks(player as any);
    const menuItems = streams.map(function (s: any) {
        const menuItem: any = {
            name: s.DisplayTitle,
            id: s.Index
        };

        if (s.Index === currentIndex) {
            menuItem.selected = true;
        }

        return menuItem;
    });

    import('../actionSheet/actionSheet').then((actionsheet) => {
        (actionsheet as any).show({
            items: menuItems,
            positionTo: button,
            callback: function (id: string) {
                (playbackManager as any).setAudioStreamIndex(parseInt(id, 10), player as any);
            }
        });
    });
}

function showSubtitleMenu(context: RemoteControlContext, player: Player, button: HTMLElement): void {
    const currentIndex = (playbackManager as any).getSubtitleStreamIndex(player as any);
    const streams = (playbackManager as any).subtitleTracks(player as any);
    const menuItems = streams.map(function (s: any) {
        const menuItem: any = {
            name: s.DisplayTitle,
            id: s.Index
        };

        if (s.Index === currentIndex) {
            menuItem.selected = true;
        }

        return menuItem;
    });
    menuItems.unshift({
        id: -1,
        name: globalize.translate('Off'),
        selected: currentIndex === null
    });

    import('../actionSheet/actionSheet').then((actionsheet) => {
        (actionsheet as any).show({
            items: menuItems,
            positionTo: button,
            callback: function (id: string) {
                (playbackManager as any).setSubtitleStreamIndex(parseInt(id, 10), player as any);
            }
        });
    });
}

function updateNowPlayingInfo(context: RemoteControlContext, state: PlayerState, serverId: string): void {
    const item = state.NowPlayingItem;
    if (item) {
        const lines = getItemTextLines(item);
        const displayName = lines ? lines.join(' - ') : '';
        // Update context elements if they exist
        const pageTitle = context.querySelector('.nowPlayingPageTitle') as HTMLElement | null;
        if (pageTitle) {
            pageTitle.innerHTML = displayName;
            pageTitle.classList.toggle('hide', displayName.length === 0);
        }
        // Set detailed info
        const songName = context.querySelector('.nowPlayingSongName') as HTMLElement | null;
        if (songName) songName.textContent = item.Name || '';
        const artist = context.querySelector('.nowPlayingArtist') as HTMLElement | null;
        if (artist) artist.textContent = item.Artists?.join(', ') || '';
        const album = context.querySelector('.nowPlayingAlbum') as HTMLElement | null;
        if (album) album.textContent = item.Album || '';
        // Set image
        const url = getImageUrl(item, { maxHeight: 300 });
        if (url) {
            setImageUrl(context, state, url);
        }
        // Set backdrops
        setBackdrops([item]);
        // Update user data
        const userDataBtn = context.querySelector('.nowPlayingPageUserDataButtons') as HTMLElement | null;
        if (userDataBtn && item.UserData) {
            userDataBtn.innerHTML = '<button is="emby-ratingbutton" data-id="' + item.Id + '" data-isfavorite="' + item.UserData.IsFavorite + '"><span class="material-icons favorite"></span></button>';
        }
    } else {
        clearBackdrop();
        const userDataBtn = context.querySelector('.nowPlayingPageUserDataButtons') as HTMLElement | null;
        if (userDataBtn) userDataBtn.innerHTML = '';
    }
}

function setImageUrl(context: RemoteControlContext, state: PlayerState, url: string): void {
    const img = context.querySelector('.nowPlayingPageImage') as HTMLImageElement | null;
    if (img) {
        img.src = url;
    }
}

function buttonVisible(btn: HTMLElement, enabled: boolean): void {
    btn.classList.toggle('hide', !enabled);
}

function updateSupportedCommands(context: RemoteControlContext, commands: string[]): void {
    // Update button visibility based on supported commands
    const audioBtn = context.querySelector('.btnAudioTracks') as HTMLElement | null;
    if (audioBtn) {
        buttonVisible(audioBtn, commands.indexOf('SetAudioStreamIndex') !== -1);
    }
    const subtitleBtn = context.querySelector('.btnSubtitles') as HTMLElement | null;
    if (subtitleBtn) {
        buttonVisible(subtitleBtn, commands.indexOf('SetSubtitleStreamIndex') !== -1);
    }
}

interface RemoteControlInstance {
    init(ownerView: any, context: HTMLElement): void;
    onShow(): void;
    destroy(): void;
}

export default function (): RemoteControlInstance {
    let currentPlayer: Player | null = null;
    const currentPlayerSupportedCommands: string[] = [];

    function toggleRepeat(): void {
        if (currentPlayer) {
            const repeatMode = playbackManager.getRepeatMode();
            switch (repeatMode) {
                case 'RepeatAll':
                    playbackManager.setRepeatMode('RepeatOne');
                    break;
                case 'RepeatOne':
                    playbackManager.setRepeatMode('RepeatNone');
                    break;
                case 'RepeatNone':
                    playbackManager.setRepeatMode('RepeatAll');
                    break;
            }
        }
    }

    function updatePlayerState(player: Player, context: RemoteControlContext, state: PlayerState): void {
        const playState = state.PlayState || {};
        const item = state.NowPlayingItem;

        // Update play/pause button
        const playPauseBtn = context.querySelector('.btnPlayPause') as HTMLElement | null;
        if (playPauseBtn) {
            const icon = playPauseBtn.querySelector('.material-icons') as HTMLElement | null;
            if (icon) {
                icon.classList.remove('play_arrow', 'pause');
                icon.classList.add(playState.IsPaused ? 'play_arrow' : 'pause');
            }
        }

        // Update volume
        const volumeSlider = context.querySelector('.remoteVolumeSlider') as HTMLInputElement | null;
        if (volumeSlider && !(volumeSlider as any).dragging) {
            volumeSlider.value = playState.VolumeLevel?.toString() || '0';
        }

        // Update time display
        const currentTime = context.querySelector('.remoteCurrentTime') as HTMLElement | null;
        const totalTime = context.querySelector('.remoteTotalTime') as HTMLElement | null;
        if (currentTime && totalTime && item) {
            const position = state.PositionTicks || 0;
            const runtime = item.RunTimeTicks || 0;
            currentTime.textContent = datetime.getDisplayRunningTime(position / 10000);
            totalTime.textContent = datetime.getDisplayRunningTime(runtime / 10000);
        }

        // Update supported commands
        const supportedCommands = player.getSupportedCommands();
        updateSupportedCommands(context, supportedCommands);

        // Update now playing info
        if (item?.ServerId) {
            updateNowPlayingInfo(context, state, item.ServerId);
        }
    }

    // ... other functions with types

    function init(ownerView: any, context: HTMLElement): void {
        // Bind events
        const playPauseBtn = context.querySelector('.btnPlayPause') as HTMLElement | null;
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (currentPlayer) {
                    if (playbackManager.isPlaying(currentPlayer as any)) {
                        playbackManager.pause(currentPlayer as any);
                    } else {
                        playbackManager.play(currentPlayer as any);
                    }
                }
            });
        }

        // Add other event bindings as needed
    }

    function onShow(): void {
        // Refresh player state when shown
        if (currentPlayer) {
            const state = currentPlayer.getPlayerState();
            // Assume context is available, update state
        }
    }

    function destroy(): void {
        // Clean up
        currentPlayer = null;
        currentPlayerSupportedCommands.length = 0;
    }

    return {
        init,
        onShow,
        destroy
    };
}
