import escapeHtml from 'escape-html';

import autoFocuser from 'components/autoFocuser';
import { appRouter } from '../components/router/appRouter';
import layoutManager from 'components/layoutManager';
import { playbackManager } from '../components/playback/playbackmanager';
import scrollManager from 'components/scrollManager';
import focusManager from 'components/focusManager';

import keyboardNavigation from 'scripts/keyboardNavigation';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import LibraryMenu from 'scripts/libraryMenu';
import Events from 'utils/events';

import '../styles/lyrics.scss';
import { AutoScroll } from './lyrics.types';

let currentPlayer;
let currentItem;

let savedLyrics;
let isDynamicLyric = false;
let autoScroll = AutoScroll.Instant;

function dynamicLyricHtmlReducer(htmlAccumulator, lyric, index) {
    if (layoutManager.tv) {
        htmlAccumulator += `<button class="lyricsLine dynamicLyric listItem show-focus" id="lyricPosition${index}" data-lyrictime="${lyric.Start}">${escapeHtml(lyric.Text)}</button>`;
    } else {
        htmlAccumulator += `<div class="lyricsLine dynamicLyric" id="lyricPosition${index}" data-lyrictime="${lyric.Start}">${escapeHtml(lyric.Text)}</div>`;
    }
    return htmlAccumulator;
}

function staticLyricHtmlReducer(htmlAccumulator, lyric, index) {
    if (layoutManager.tv) {
        htmlAccumulator += `<button class="lyricsLine listItem show-focus" id="lyricPosition${index}">${escapeHtml(lyric.Text)}</button>`;
    } else {
        htmlAccumulator += `<div class="lyricsLine" id="lyricPosition${index}">${escapeHtml(lyric.Text)}</div>`;
    }
    return htmlAccumulator;
}

function getLyricIndex(time, lyrics) {
    return lyrics.findLastIndex(lyric => lyric.Start <= time);
}

function getCurrentPlayTime() {
    let currentTime = playbackManager.currentTime();
    if (currentTime === undefined) currentTime = 0;
    //convert to ticks
    return currentTime * 10000;
}

export default function (view) {
    function setPastLyricClassOnLine(line) {
        const lyric = view.querySelector(`#lyricPosition${line}`);
        if (lyric) {
            lyric.classList.remove('futureLyric');
            lyric.classList.add('pastLyric');
        }
    }

    function setFutureLyricClassOnLine(line) {
        const lyric = view.querySelector(`#lyricPosition${line}`);
        if (lyric) {
            lyric.classList.remove('pastLyric');
            lyric.classList.add('futureLyric');
        }
    }

    function setCurrentLyricClassOnLine(line) {
        const lyric = view.querySelector(`#lyricPosition${line}`);
        if (lyric) {
            lyric.classList.remove('pastLyric');
            lyric.classList.remove('futureLyric');
            if (autoScroll !== AutoScroll.NoScroll) {
                // instant scroll is used when the view is first loaded
                scrollManager.scrollToElement(lyric, autoScroll === AutoScroll.Smooth);
                focusManager.focus(lyric);
                autoScroll = AutoScroll.Smooth;
            }
        }
    }

    function updateAllLyricLines(currentLine, lyrics) {
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
        const itemsContainer = view.querySelector('.dynamicLyricsContainer');
        if (itemsContainer) {
            const html = `<h1> ${globalize.translate('HeaderNoLyrics')} </h1>`;
            itemsContainer.innerHTML = html;
        }
        autoFocuser.autoFocus();
    }

    function renderDynamicLyrics(lyrics) {
        const itemsContainer = view.querySelector('.dynamicLyricsContainer');
        if (itemsContainer) {
            const html = lyrics.reduce(dynamicLyricHtmlReducer, '');
            itemsContainer.innerHTML = html;
        }

        const lyricLineArray = itemsContainer.querySelectorAll('.lyricsLine');

        // attaches click event listener to change playtime to lyric start
        lyricLineArray.forEach(element => {
            element.addEventListener('click', () => onLyricClick(element.getAttribute('data-lyrictime')));
        });

        const currentIndex = getLyricIndex(getCurrentPlayTime(), lyrics);
        updateAllLyricLines(currentIndex, savedLyrics);
    }

    function renderStaticLyrics(lyrics) {
        const itemsContainer = view.querySelector('.dynamicLyricsContainer');
        if (itemsContainer) {
            const html = lyrics.reduce(staticLyricHtmlReducer, '');
            itemsContainer.innerHTML = html;
        }
    }

    function updateLyrics(lyrics) {
        savedLyrics = lyrics;

        isDynamicLyric = Object.prototype.hasOwnProperty.call(lyrics[0], 'Start');

        if (isDynamicLyric) {
            renderDynamicLyrics(savedLyrics);
        } else {
            renderStaticLyrics(savedLyrics);
        }

        autoFocuser.autoFocus(view);
    }

    function getLyrics(serverId, itemId) {
        const apiClient = ServerConnections.getApiClient(serverId);

        return apiClient.ajax({
            url: apiClient.getUrl('Audio/' + itemId + '/Lyrics'),
            type: 'GET',
            dataType: 'json'
        }).then((response) => {
            if (!response.Lyrics) {
                throw new Error();
            }
            return response.Lyrics;
        });
    }

    function bindToPlayer(player) {
        if (player === currentPlayer) {
            return;
        }

        releaseCurrentPlayer();

        currentPlayer = player;

        if (!player) {
            return;
        }

        Events.on(player, 'timeupdate', onTimeUpdate);
        Events.on(player, 'playbackstart', onPlaybackStart);
        Events.on(player, 'playbackstop', onPlaybackStop);
    }

    function releaseCurrentPlayer() {
        const player = currentPlayer;

        if (player) {
            Events.off(player, 'timeupdate', onTimeUpdate);
            Events.off(player, 'playbackstart', onPlaybackStart);
            Events.off(player, 'playbackstop', onPlaybackStop);
            currentPlayer = null;
        }
    }

    function onLyricClick(lyricTime) {
        autoScroll = AutoScroll.Smooth;
        playbackManager.seek(lyricTime);
        if (playbackManager.paused()) {
            playbackManager.playPause(currentPlayer);
        }
    }

    function onTimeUpdate() {
        if (isDynamicLyric) {
            const currentIndex = getLyricIndex(getCurrentPlayTime(), savedLyrics);
            updateAllLyricLines(currentIndex, savedLyrics);
        }
    }

    function onPlaybackStart(event, state) {
        if (currentItem.Id !== state.NowPlayingItem.Id) {
            onLoad();
        }
    }

    function onPlaybackStop(_, state) {
        // TODO: switch to appRouter.back(), with fix to navigation to /#/queue. Which is broken when it has nothing playing
        if (!state.NextMediaType) {
            appRouter.goHome();
        }
    }

    function onPlayerChange() {
        const player = playbackManager.getCurrentPlayer();
        bindToPlayer(player);
    }

    function onLoad() {
        savedLyrics = null;
        currentItem = null;
        isDynamicLyric = false;

        LibraryMenu.setTitle(globalize.translate('Lyrics'));

        const player = playbackManager.getCurrentPlayer();

        if (player) {
            bindToPlayer(player);

            const state = playbackManager.getPlayerState(player);
            currentItem = state.NowPlayingItem;

            const serverId = state.NowPlayingItem.ServerId;
            const itemId = state.NowPlayingItem.Id;

            getLyrics(serverId, itemId).then(updateLyrics).catch(renderNoLyricMessage);
        } else {
            // if nothing is currently playing, no lyrics to display redirect to home
            appRouter.goHome();
        }
    }

    function onWheelOrTouchMove() {
        autoScroll = AutoScroll.NoScroll;
    }

    function onKeyDown(e) {
        const key = keyboardNavigation.getKeyName(e);
        if (key === 'ArrowUp' || key === 'ArrowDown') {
            autoScroll = AutoScroll.NoScroll;
        }
    }

    view.addEventListener('viewshow', function () {
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

    view.addEventListener('viewbeforehide', function () {
        Events.off(playbackManager, 'playerchange', onPlayerChange);
        document.removeEventListener('wheel', onWheelOrTouchMove);
        document.removeEventListener('touchmove', onWheelOrTouchMove);
        document.removeEventListener('keydown', onKeyDown);
        releaseCurrentPlayer();
    });
}
