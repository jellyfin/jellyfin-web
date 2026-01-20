import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api/lyrics-api';
import escapeHtml from 'escape-html';

import { AutoScroll } from 'apps/stable/features/lyrics/constants/autoScroll';
import autoFocuser from 'components/autoFocuser';
import { appRouter } from 'components/router/appRouter';
import layoutManager from 'components/layoutManager';
import { playbackManager } from 'components/playback/playbackmanager';
import scrollManager from 'components/scrollManager';
import focusManager from 'components/focusManager';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import keyboardNavigation from 'scripts/keyboardNavigation';
import LibraryMenu from 'scripts/libraryMenu';
import Events from 'utils/events';
import { toApi } from 'utils/jellyfin-apiclient/compat';

import '../styles/lyrics.scss';

let currentPlayer: any;
let currentItem: any;

let savedLyrics: any[];
let isDynamicLyric = false;
let autoScroll = AutoScroll.Instant;

function lyricHtmlReducer(htmlAccumulator: string, lyric: any, index: number) {
    const elem = layoutManager.tv ? 'button' : 'div';
    const classes = [];
    if (isDynamicLyric) classes.push('dynamicLyric');
    if (layoutManager.tv) classes.push('listItem', 'show-focus');
    const lyricTime = typeof lyric.Start !== 'undefined' ? `data-lyrictime="${lyric.Start}"` : '';

    htmlAccumulator += `<${elem} class="lyricsLine ${classes.join(' ')}" id="lyricPosition${index}" ${lyricTime}>
    <bdi>${escapeHtml(lyric.Text)}</bdi>
</${elem}>`;

    return htmlAccumulator;
}

function getLyricIndex(time: number, lyrics: any[]) {
    return lyrics.findLastIndex(lyric => lyric.Start <= time);
}

function getCurrentPlayTime() {
    let currentTime = playbackManager.currentTime();
    if (currentTime === undefined) currentTime = 0;
    return currentTime * 10000;
}

export default function (view: HTMLElement) {
    function setPastLyricClassOnLine(line: number) {
        const lyric = view.querySelector(`#lyricPosition${line}`);
        if (lyric) {
            lyric.classList.remove('futureLyric');
            lyric.classList.add('pastLyric');
        }
    }

    function setFutureLyricClassOnLine(line: number) {
        const lyric = view.querySelector(`#lyricPosition${line}`);
        if (lyric) {
            lyric.classList.remove('pastLyric');
            lyric.classList.add('futureLyric');
        }
    }

    function setCurrentLyricClassOnLine(line: number) {
        const lyric = view.querySelector(`#lyricPosition${line}`) as HTMLElement;
        if (lyric) {
            lyric.classList.remove('pastLyric');
            lyric.classList.remove('futureLyric');
            if (autoScroll !== AutoScroll.NoScroll) {
                scrollManager.scrollToElement(lyric, autoScroll === AutoScroll.Smooth);
                focusManager.focus(lyric);
                autoScroll = AutoScroll.Smooth;
            }
        }
    }

    function updateAllLyricLines(currentLine: number, lyrics: any[]) {
        for (let lyricIndex = 0; lyricIndex <= lyrics.length; lyricIndex++) {
            if (lyricIndex < currentLine) {
                setPastLyricClassOnLine(lyricIndex);
            } else if (lyricIndex === currentLine) {
                setCurrentLyricClassOnLine(lyricIndex);
            } else if (lyricIndex > currentLine) {
                setFutureLyricClassOnLine(lyricIndex);
            }
        }
    }

    function renderNoLyricMessage() {
        const itemsContainer = view.querySelector('.lyricsContainer');
        if (itemsContainer) {
            itemsContainer.innerHTML = `<h1>${globalize.translate('HeaderNoLyrics')}</h1>`;
        }
        autoFocuser.autoFocus();
    }

    function renderLyrics(lyrics: any[]) {
        const itemsContainer = view.querySelector('.lyricsContainer') as HTMLElement;
        if (itemsContainer) {
            itemsContainer.innerHTML = lyrics.reduce(lyricHtmlReducer, '');
        }

        if (isDynamicLyric && itemsContainer) {
            const lyricLineArray = itemsContainer.querySelectorAll('.lyricsLine');
            lyricLineArray.forEach(element => {
                element.addEventListener('click', () => onLyricClick(element.getAttribute('data-lyrictime')));
            });

            const currentIndex = getLyricIndex(getCurrentPlayTime(), lyrics);
            updateAllLyricLines(currentIndex, savedLyrics);
        }
    }

    function updateLyrics(lyrics: any[]) {
        savedLyrics = lyrics;
        isDynamicLyric = Object.prototype.hasOwnProperty.call(lyrics[0], 'Start');
        renderLyrics(savedLyrics);
        autoFocuser.autoFocus(view);
    }

    function getLyrics(serverId: string, itemId: string) {
        const apiClient = ServerConnections.getApiClient(serverId);
        const lyricsApi = getLyricsApi(toApi(apiClient));

        return lyricsApi.getLyrics({ itemId })
            .then(({ data }) => {
                if (!data.Lyrics?.length) throw new Error('No lyrics returned');
                return data.Lyrics;
            });
    }

    function bindToPlayer(player: any) {
        if (player === currentPlayer) return;
        releaseCurrentPlayer();
        currentPlayer = player;
        if (!player) return;

        Events.on(player, 'timeupdate', onTimeUpdate);
        Events.on(player, 'playbackstart', onPlaybackStart);
        Events.on(player, 'playbackstop', onPlaybackStop);
    }

    function releaseCurrentPlayer() {
        if (currentPlayer) {
            Events.off(currentPlayer, 'timeupdate', onTimeUpdate);
            Events.off(currentPlayer, 'playbackstart', onPlaybackStart);
            Events.off(currentPlayer, 'playbackstop', onPlaybackStop);
            currentPlayer = null;
        }
    }

    function onLyricClick(lyricTime: any) {
        autoScroll = AutoScroll.Smooth;
        playbackManager.seek(lyricTime);
        if (playbackManager.paused()) playbackManager.playPause(currentPlayer);
    }

    function onTimeUpdate() {
        if (isDynamicLyric) {
            const currentIndex = getLyricIndex(getCurrentPlayTime(), savedLyrics);
            updateAllLyricLines(currentIndex, savedLyrics);
        }
    }

    function onPlaybackStart(_event: any, state: any) {
        if (currentItem?.Id !== state.NowPlayingItem?.Id) onLoad();
    }

    function onPlaybackStop(_: any, state: any) {
        if (!state.NextMediaType) appRouter.goHome();
    }

    function onPlayerChange() {
        bindToPlayer(playbackManager.getCurrentPlayer());
    }

    function onLoad() {
        savedLyrics = [];
        currentItem = null;
        isDynamicLyric = false;

        LibraryMenu.setTitle(globalize.translate('Lyrics'));
        const player = playbackManager.getCurrentPlayer();

        if (player) {
            bindToPlayer(player);
            const state = playbackManager.getPlayerState(player);
            currentItem = state.NowPlayingItem;
            getLyrics(currentItem.ServerId, currentItem.Id).then(updateLyrics).catch(renderNoLyricMessage);
        } else {
            appRouter.goHome();
        }
    }

    function onWheelOrTouchMove() { autoScroll = AutoScroll.NoScroll; }

    function onKeyDown(e: KeyboardEvent) {
        const key = (keyboardNavigation as any).getKeyName(e);
        if (key === 'ArrowUp' || key === 'ArrowDown') autoScroll = AutoScroll.NoScroll;
    }

    view.addEventListener('viewshow', () => {
        Events.on(playbackManager, 'playerchange', onPlayerChange);
        autoScroll = AutoScroll.Instant;
        document.addEventListener('wheel', onWheelOrTouchMove);
        document.addEventListener('touchmove', onWheelOrTouchMove);
        document.addEventListener('keydown', onKeyDown);
        try {
            onLoad();
        } catch {
            appRouter.goHome();
        }
    });

    view.addEventListener('viewbeforehide', () => {
        Events.off(playbackManager, 'playerchange', onPlayerChange);
        document.removeEventListener('wheel', onWheelOrTouchMove);
        document.removeEventListener('touchmove', onWheelOrTouchMove);
        document.removeEventListener('keydown', onKeyDown);
        releaseCurrentPlayer();
    });
}