/**
 * Module for building a chapter list for audiobooks.
 * Unlike the image-based chaptercardbuilder, this renders a text-based
 * chapter list suitable for audio content that has no chapter images.
 * @module components/cardBuilder/audiobookChapterList
 */

import escapeHtml from 'escape-html';
import datetime from '../../scripts/datetime';
import { playbackManager } from '../playback/playbackmanager';
import { Events } from 'jellyfin-apiclient';
import './audiobookChapterList.scss';

/**
 * Computes chapter progress as a fraction 0-1, or null if not in this chapter.
 */
function getChapterProgress(chapter, chapterIndex, chapters, positionTicks) {
    if (positionTicks == null || positionTicks <= 0) return null;

    const chapterStart = chapter.StartPositionTicks;
    const nextChapter = chapters[chapterIndex + 1];
    const chapterEnd = nextChapter ? nextChapter.StartPositionTicks : null;

    if (positionTicks < chapterStart) return null;
    if (chapterEnd != null && positionTicks >= chapterEnd) return 1;

    // Currently in this chapter
    if (chapterEnd == null) return 0; // last chapter, no end boundary known
    const duration = chapterEnd - chapterStart;
    if (duration <= 0) return 0;
    return (positionTicks - chapterStart) / duration;
}

function getChapterState(chapter, chapterIndex, chapters, positionTicks) {
    const progress = getChapterProgress(chapter, chapterIndex, chapters, positionTicks);
    if (progress === null) return 'unplayed';
    if (progress >= 1) return 'played';
    return 'playing';
}

function buildRestartIconHtml(item, chapter) {
    return `<span class="audiobookChapterItem-restart itemAction material-icons replay" `
        + `data-action="play" data-id="${item.Id}" data-serverid="${item.ServerId}" `
        + `data-type="${item.Type}" data-mediatype="${item.MediaType}" `
        + `data-isfolder="${item.IsFolder}" `
        + `data-positionticks="${chapter.StartPositionTicks}" `
        + `aria-hidden="true" title="Restart chapter"></span>`;
}

function getChapterDurationTicks(chapter, chapterIndex, chapters, itemRunTimeTicks) {
    const nextChapter = chapters[chapterIndex + 1];
    const chapterEnd = nextChapter ? nextChapter.StartPositionTicks : (itemRunTimeTicks || 0);
    return Math.max(0, chapterEnd - chapter.StartPositionTicks);
}

function getChapterTimeDisplay(chapter, chapterIndex, chapters, state, positionTicks, itemRunTimeTicks) {
    const duration = getChapterDurationTicks(chapter, chapterIndex, chapters, itemRunTimeTicks);
    if (state === 'playing' && positionTicks != null && positionTicks > chapter.StartPositionTicks) {
        const remaining = Math.max(0, (chapter.StartPositionTicks + duration) - positionTicks);
        return '-' + datetime.getDisplayRunningTime(remaining);
    }
    return datetime.getDisplayRunningTime(duration);
}

function isPlayerActiveForItem(item) {
    const player = playbackManager.getCurrentPlayer();
    if (!player) return false;
    const currentItem = playbackManager.currentItem(player);
    return currentItem && currentItem.Id === item.Id;
}

function buildChapterListHtml(item, chapters) {
    const positionTicks = item.UserData?.PlaybackPositionTicks ?? null;
    const runTimeTicks = item.RunTimeTicks || 0;

    let html = '<div class="audiobookChapterList">';

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const state = getChapterState(chapter, i, chapters, positionTicks);
        const progress = getChapterProgress(chapter, i, chapters, positionTicks);
        const stateClass = `chapterItem-${state}`;
        const timeDisplay = getChapterTimeDisplay(chapter, i, chapters, state, positionTicks, runTimeTicks);
        const chapterName = chapter.Name || `Chapter ${i + 1}`;
        const progressPct = state === 'playing' ? Math.round((progress || 0) * 100) : 0;

        html += `<button type="button" class="audiobookChapterItem itemAction ${stateClass}" `
            + `data-action="play" data-isfolder="${item.IsFolder}" data-id="${item.Id}" `
            + `data-serverid="${item.ServerId}" data-type="${item.Type}" `
            + `data-mediatype="${item.MediaType}" data-positionticks="${chapter.StartPositionTicks}" `
            + `data-chapterindex="${i}">`;
        html += '<span class="audiobookChapterItem-indicator">';
        if (state === 'played') {
            html += '<span class="material-icons audiobookChapterItem-iconComplete check" aria-hidden="true"></span>';
        } else if (state === 'playing') {
            const isActive = isPlayerActiveForItem(item);
            const iconName = (isActive && !playbackManager.paused()) ? 'pause' : 'play_arrow';
            html += `<span class="material-icons audiobookChapterItem-iconPlaying ${iconName}" aria-hidden="true"></span>`;
        } else {
            html += `<span class="audiobookChapterItem-number">${i + 1}</span>`;
        }
        html += '</span>';
        html += `<span class="audiobookChapterItem-name">${escapeHtml(chapterName)}</span>`;
        if (state === 'playing') {
            html += buildRestartIconHtml(item, chapter);
        }
        html += `<span class="audiobookChapterItem-time">${timeDisplay}</span>`;
        if (state === 'playing') {
            html += `<div class="audiobookChapterItem-progressTrack"><div class="audiobookChapterItem-progressBar" style="width:${progressPct}%"></div></div>`;
        }
        html += '</button>';
    }

    html += '</div>';
    return html;
}

/**
 * Updates progress bars and state classes on existing chapter elements
 * without rebuilding the entire DOM.
 */
function updateChapterProgress(container, item, chapters, currentTicks) {
    const buttons = container.querySelectorAll('.audiobookChapterItem');
    if (!buttons.length) return;

    const runTimeTicks = item.RunTimeTicks || 0;
    let currentPlayingIndex = -1;

    for (let i = 0; i < chapters.length && i < buttons.length; i++) {
        const chapter = chapters[i];
        const btn = buttons[i];
        const state = getChapterState(chapter, i, chapters, currentTicks);
        const progress = getChapterProgress(chapter, i, chapters, currentTicks);

        if (state === 'playing') currentPlayingIndex = i;

        // Update state classes
        btn.classList.remove('chapterItem-played', 'chapterItem-playing', 'chapterItem-unplayed');
        btn.classList.add(`chapterItem-${state}`);

        // Update indicator
        const indicator = btn.querySelector('.audiobookChapterItem-indicator');
        if (state === 'played') {
            indicator.innerHTML = '<span class="material-icons audiobookChapterItem-iconComplete check" aria-hidden="true"></span>';
        } else if (state === 'playing') {
            const isActive = isPlayerActiveForItem(item);
            const iconName = (isActive && !playbackManager.paused()) ? 'pause' : 'play_arrow';
            indicator.innerHTML = `<span class="material-icons audiobookChapterItem-iconPlaying ${iconName}" aria-hidden="true"></span>`;
        } else {
            indicator.innerHTML = `<span class="audiobookChapterItem-number">${i + 1}</span>`;
        }

        // Update restart icon (before timestamp)
        let restartIcon = btn.querySelector('.audiobookChapterItem-restart');
        const timeEl = btn.querySelector('.audiobookChapterItem-time');
        if (state === 'playing') {
            if (!restartIcon && timeEl) {
                timeEl.insertAdjacentHTML('beforebegin', buildRestartIconHtml(item, chapter));
            }
        } else if (restartIcon) {
            restartIcon.remove();
        }

        // Update time display
        if (timeEl) {
            timeEl.textContent = getChapterTimeDisplay(chapter, i, chapters, state, currentTicks, runTimeTicks);
        }

        // Update progress bar
        let progressTrack = btn.querySelector('.audiobookChapterItem-progressTrack');
        if (state === 'playing') {
            const pct = Math.round((progress || 0) * 100);
            if (!progressTrack) {
                progressTrack = document.createElement('div');
                progressTrack.className = 'audiobookChapterItem-progressTrack';
                progressTrack.innerHTML = `<div class="audiobookChapterItem-progressBar" style="width:${pct}%"></div>`;
                btn.appendChild(progressTrack);
            } else {
                progressTrack.querySelector('.audiobookChapterItem-progressBar').style.width = `${pct}%`;
            }
        } else if (progressTrack) {
            progressTrack.remove();
        }
    }

    // Auto-scroll when the active chapter changes
    if (currentPlayingIndex !== _lastPlayingIndex) {
        _lastPlayingIndex = currentPlayingIndex;
        scrollToCurrentChapter(container);
    }
}

let _timeUpdateHandler = null;
let _stopHandler = null;
let _pauseHandler = null;
let _boundPlayer = null;
let _lastPlayingIndex = -1;

function scrollToCurrentChapter(container) {
    const playing = container.querySelector('.chapterItem-playing');
    if (playing) {
        playing.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function bindLiveUpdates(container, item, chapters) {
    unbindLiveUpdates();

    _timeUpdateHandler = function () {
        const player = playbackManager.getCurrentPlayer();
        if (!player) return;
        const currentItem = playbackManager.currentItem(player);
        if (!currentItem || currentItem.Id !== item.Id) return;
        const currentTicks = playbackManager.currentTime(player) * 10000;
        updateChapterProgress(container, item, chapters, currentTicks);
    };

    _pauseHandler = function () {
        // Re-run update to toggle play/pause icon
        _timeUpdateHandler();
    };

    _stopHandler = function () {
        unbindLiveUpdates();
    };

    const player = playbackManager.getCurrentPlayer();
    if (player) {
        _boundPlayer = player;
        Events.on(player, 'timeupdate', _timeUpdateHandler);
        Events.on(player, 'pause', _pauseHandler);
        Events.on(player, 'unpause', _pauseHandler);
        Events.on(player, 'playbackstop', _stopHandler);
    }

    // Also pick up if a player starts later
    Events.on(playbackManager, 'playerchange', function playerChangeForChapters() {
        unbindLiveUpdates();
        const newPlayer = playbackManager.getCurrentPlayer();
        if (newPlayer) {
            _boundPlayer = newPlayer;
            Events.on(newPlayer, 'timeupdate', _timeUpdateHandler);
            Events.on(newPlayer, 'pause', _pauseHandler);
            Events.on(newPlayer, 'unpause', _pauseHandler);
            Events.on(newPlayer, 'playbackstop', _stopHandler);
        }
    });
}

let _clickInterceptor = null;

function attachClickInterceptor(container) {
    if (_clickInterceptor) {
        container.removeEventListener('click', _clickInterceptor, true);
    }

    _clickInterceptor = function (e) {
        // If clicking the restart icon, let it bubble to shortcuts normally
        if (e.target.closest('.audiobookChapterItem-restart')) {
            return;
        }
        // If clicking on the currently-playing chapter and player is active, toggle play/pause
        const playingBtn = e.target.closest('.chapterItem-playing');
        if (playingBtn && playbackManager.getCurrentPlayer()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            playbackManager.playPause();
        }
    };

    // Use capturing phase so it runs before the shortcuts bubbling handler
    container.addEventListener('click', _clickInterceptor, true);
}

export function unbindLiveUpdates() {
    if (_boundPlayer) {
        if (_timeUpdateHandler) Events.off(_boundPlayer, 'timeupdate', _timeUpdateHandler);
        if (_pauseHandler) {
            Events.off(_boundPlayer, 'pause', _pauseHandler);
            Events.off(_boundPlayer, 'unpause', _pauseHandler);
        }
        if (_stopHandler) Events.off(_boundPlayer, 'playbackstop', _stopHandler);
    }
    _boundPlayer = null;
}

export function buildAudiobookChapterList(item, chapters, options) {
    if (options.parentContainer) {
        if (!document.body.contains(options.parentContainer)) {
            return;
        }

        if (chapters.length) {
            options.parentContainer.classList.remove('hide');
        } else {
            options.parentContainer.classList.add('hide');
            return;
        }
    }

    const html = buildChapterListHtml(item, chapters);
    options.itemsContainer.innerHTML = html;

    scrollToCurrentChapter(options.itemsContainer);
    attachClickInterceptor(options.itemsContainer);
    bindLiveUpdates(options.itemsContainer, item, chapters);
}

export default {
    buildAudiobookChapterList,
    unbindLiveUpdates
};
