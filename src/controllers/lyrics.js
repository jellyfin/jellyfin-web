import escapeHtml from 'escape-html';

import { appRouter } from '../components/router/appRouter';
import { playbackManager } from '../components/playback/playbackmanager';
import ServerConnections from '../components/ServerConnections';

import globalize from '../scripts/globalize';
import LibraryMenu from '../scripts/libraryMenu';
import Events from '../utils/events.ts';

import '../styles/lyrics.scss';

const TICKS_PER_SECOND = 10000000;

let currentPlayer;
let currentItem;

let savedLyrics;
let isDynamicLyric = false;

function dynamicLyricHtmlReducer(htmlAccumulator, lyric, index) {
    htmlAccumulator += `<div class="lyrics dynamicLyric" id="lyricPosition${index}" data-lyrictime="${lyric.Start}">${escapeHtml(lyric.Text)}</div>`;
    return htmlAccumulator;
}

function staticLyricHtmlReducer(htmlAccumulator, lyric, index) {
    htmlAccumulator += `<div class="lyrics" id="lyricPosition${index}">${escapeHtml(lyric.Text)}</div>`;
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
        }
    }

    function updateAllLyricLines(currentLine, lyrics) {
        for (let lyricIndex = 0; lyricIndex <= lyrics.length; lyricIndex++) {
            if (lyricIndex < currentLine) {
                setPastLyricClassOnLine(lyricIndex);
            }

            if (lyricIndex === currentLine) {
                setCurrentLyricClassOnLine(lyricIndex);
            }

            if (lyricIndex > currentLine) {
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
    }

    function renderDynamicLyrics(lyrics) {
        const itemsContainer = view.querySelector('.dynamicLyricsContainer');
        if (itemsContainer) {
            const html = lyrics.reduce(dynamicLyricHtmlReducer, '');
            itemsContainer.innerHTML = html;
        }

        const lyricLineArray = itemsContainer.querySelectorAll('.lyrics');

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
        playbackManager.seek(lyricTime);
        if (playbackManager.paused()) {
            playbackManager.playPause(currentPlayer);
        }
    }

    function onTimeUpdate(_, ticks) {
        ticks *= TICKS_PER_SECOND;
        if (isDynamicLyric) {
            const currentIndex = getLyricIndex(ticks, savedLyrics);
            updateAllLyricLines(currentIndex, savedLyrics);
        }
    }

    function onPlaybackStart(event, state) {
        if (currentItem.Id !== state.NowPlayingItem.Id) {
            onLoad();
        }
    }

    function onPlaybackStop () {
        appRouter.back();
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

    view.addEventListener('viewshow', function() {
        Events.on(playbackManager, 'playerchange', onPlayerChange);
        try {
            onLoad();
        } catch (e) {
            appRouter.goHome();
        }
    });

    view.addEventListener('viewbeforehide', function() {
        Events.off(playbackManager, 'playerchange', onPlayerChange);
        releaseCurrentPlayer();
    });
}
