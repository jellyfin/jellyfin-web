/**
 * Module for building a chapter list for audiobooks.
 * Unlike the image-based chaptercardbuilder, this renders a text-based
 * chapter list styled after the album track list, with a seekable
 * progress slider on the currently-playing chapter.
 * @module components/cardBuilder/audiobookChapterList
 */

import escapeHtml from 'escape-html';
import datetime from '../../scripts/datetime';
import layoutManager from '../layoutManager';
import { getKeyName } from '../../scripts/keyboardNavigation';
import { playbackManager } from '../playback/playbackmanager';
import { Events } from 'jellyfin-apiclient';
import '../../elements/emby-slider/emby-slider';
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
    return '<span class="audiobookChapterItem-restart itemAction material-icons replay" '
        + `data-action="play" data-id="${item.Id}" data-serverid="${item.ServerId}" `
        + `data-type="${item.Type}" data-mediatype="${item.MediaType}" `
        + `data-isfolder="${item.IsFolder}" `
        + `data-positionticks="${chapter.StartPositionTicks}" `
        + 'aria-hidden="true" title="Restart chapter"></span>';
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

function buildStatusHtml(item, state) {
    if (state === 'playing') {
        const isActive = isPlayerActiveForItem(item);
        const iconName = (isActive && !playbackManager.paused()) ? 'pause' : 'play_arrow';
        return `<span class="material-icons audiobookChapterItem-iconPlaying ${iconName}" aria-hidden="true"></span>`;
    }
    // Resting glyph (check for played, nothing for unplayed) swaps to a play
    // button on hover/focus, revealed by CSS
    const resting = state === 'played' ?
        '<span class="material-icons audiobookChapterItem-iconComplete check" aria-hidden="true"></span>' :
        '';
    return resting
        + '<span class="material-icons audiobookChapterItem-iconPlay play_arrow" aria-hidden="true"></span>';
}

function buildSliderHtml(progressPct) {
    return '<div class="sliderContainer audiobookChapterItem-sliderContainer" dir="ltr">'
        + `<input type="range" is="emby-slider" step=".01" min="0" max="100" value="${progressPct}" `
        + 'class="audiobookChapterSlider" data-slider-keep-progress="true" '
        + 'aria-label="Seek within chapter"/>'
        + '</div>';
}

/**
 * Wires the seek slider of the playing chapter row: hover bubble timestamp
 * and click/drag seeking within the chapter, mirroring the now playing bar.
 */
function setupChapterSlider(row, item, chapters, chapterIndex) {
    const slider = row.querySelector('.audiobookChapterSlider');
    if (!slider || slider._chapterWired) return;
    slider._chapterWired = true;

    const chapter = chapters[chapterIndex];
    const chapterStart = chapter.StartPositionTicks;
    const chapterDuration = getChapterDurationTicks(chapter, chapterIndex, chapters, item.RunTimeTicks || 0);

    // On TV the focused row proxies D-pad Left/Right into a pending seek
    // (~10 seconds per press), shown as a grey dot while the blue bar keeps
    // tracking live playback. OK commits it, Up/Down abandons it (see the
    // keydown handler in attachClickInterceptor).
    if (layoutManager.tv) {
        const tenSecondsTicks = 10 * 10000000;
        slider._chapterKeyboardStep = chapterDuration > 0 ?
            Math.min(10, Math.max(0.5, (tenSecondsTicks / chapterDuration) * 100)) :
            1;
    }

    const getSliderBubbleText = function (value) {
        return datetime.getDisplayRunningTime(chapterStart + (value / 100) * chapterDuration);
    };

    slider.getBubbleText = getSliderBubbleText;

    // Render the bubble as position: fixed so the scrollbox can't clip it
    slider.updateBubbleHtml = function (bubble, value) {
        const track = slider.sliderBubbleTrack;
        if (!track) return false;

        // Set the text before measuring so the bubble has its final size
        bubble.innerHTML = '<h1 class="sliderBubbleText">' + getSliderBubbleText(value) + '</h1>';

        const trackRect = track.getBoundingClientRect();
        const pointerLeft = trackRect.left + (trackRect.width * value / 100);

        // Anchor at 0,0 to find the containing block, then offset to target
        bubble.style.left = '0px';
        bubble.style.top = '0px';
        const zeroRect = bubble.getBoundingClientRect();
        bubble.style.left = (pointerLeft - (zeroRect.width / 2) - zeroRect.left) + 'px';
        bubble.style.top = (trackRect.top - zeroRect.height - 6 - zeroRect.top) + 'px';
        return true;
    };

    slider.addEventListener('change', function () {
        const targetTicks = Math.round(chapterStart + (parseFloat(this.value) / 100) * chapterDuration);
        const player = playbackManager.getCurrentPlayer();
        if (player && isPlayerActiveForItem(item)) {
            playbackManager.seek(targetTicks, player);
        } else {
            // Nothing active: start this item at the target position
            playbackManager.play({
                ids: [item.Id],
                serverId: item.ServerId,
                startPositionTicks: targetTicks
            });
        }
    });
}

/**
 * Moves the pending TV seek to the given percent: a grey dot on the track
 * plus the timestamp bubble, while the blue bar keeps tracking playback.
 */
function updatePendingSeek(slider, percent) {
    const track = slider.sliderBubbleTrack;
    if (!track) return;

    slider._pendingSeekPercent = percent;

    let dot = track.querySelector('.audiobookChapterSlider-pendingDot');
    if (!dot) {
        dot = document.createElement('span');
        dot.className = 'audiobookChapterSlider-pendingDot';
        track.appendChild(dot);
    }
    dot.style.left = percent + '%';
    dot.classList.remove('hide');

    // Timestamp bubble at the pending position, like a pointer hover
    const bubble = slider.parentNode?.querySelector('.sliderBubble');
    if (bubble && slider.updateBubbleHtml) {
        slider.updateBubbleHtml(bubble, percent);
        bubble.classList.remove('hide');
    }
}

function clearPendingSeek(slider) {
    if (slider._pendingSeekPercent == null) return;
    slider._pendingSeekPercent = null;

    const dot = slider.sliderBubbleTrack?.querySelector('.audiobookChapterSlider-pendingDot');
    if (dot) dot.classList.add('hide');

    const bubble = slider.parentNode?.querySelector('.sliderBubble');
    if (bubble) bubble.classList.add('hide');
}

function buildChapterListHtml(item, chapters) {
    const positionTicks = item.UserData?.PlaybackPositionTicks ?? null;
    const runTimeTicks = item.RunTimeTicks || 0;

    // Rows are emitted as direct children of the emby-itemscontainer so TV
    // directional focus can discover them (a wrapper div would hide them).
    // They are divs rather than buttons (the playing row nests the seek
    // slider input), so on TV they need the 'focusable' class to be seen by
    // focusManager's directional nav.
    const rowFocusClass = layoutManager.tv ? ' focusable' : '';
    let html = '';

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const state = getChapterState(chapter, i, chapters, positionTicks);
        const progress = getChapterProgress(chapter, i, chapters, positionTicks);
        const stateClass = `chapterItem-${state}`;
        const timeDisplay = getChapterTimeDisplay(chapter, i, chapters, state, positionTicks, runTimeTicks);
        const chapterName = chapter.Name || `Chapter ${i + 1}`;
        const progressPct = state === 'playing' ? (progress || 0) * 100 : 0;
        // The playing chapter resumes at the saved position; others start at
        // their chapter boundary.
        const playTicks = state === 'playing' && positionTicks ?
            Math.round(positionTicks) :
            chapter.StartPositionTicks;

        html += `<div class="listItem listItem-border audiobookChapterItem itemAction${rowFocusClass} ${stateClass}" `
            + 'role="button" tabindex="0" '
            + `data-action="play" data-isfolder="${item.IsFolder}" data-id="${item.Id}" `
            + `data-serverid="${item.ServerId}" data-type="${item.Type}" `
            + `data-mediatype="${item.MediaType}" data-positionticks="${playTicks}" `
            + `data-chapterindex="${i}">`;
        html += `<div class="audiobookChapterItem-status">${buildStatusHtml(item, state)}</div>`;
        html += `<div class="audiobookChapterItem-index">${i + 1}</div>`;
        html += '<div class="listItemBody audiobookChapterItem-body">';
        html += `<div class="listItemBodyText audiobookChapterItem-name">${escapeHtml(chapterName)}</div>`;
        html += '</div>';
        if (state === 'playing') {
            html += buildRestartIconHtml(item, chapter);
        }
        html += `<div class="secondary audiobookChapterItem-time">${timeDisplay}</div>`;
        if (state === 'playing') {
            html += buildSliderHtml(progressPct);
        }
        html += '</div>';
    }

    return html;
}

/**
 * Updates seek sliders, icons and state classes on existing chapter elements
 * without rebuilding the entire DOM.
 */
function updateChapterProgress(container, item, chapters, currentTicks) {
    const rows = container.querySelectorAll('.audiobookChapterItem');
    if (!rows.length) return;

    const runTimeTicks = item.RunTimeTicks || 0;
    let currentPlayingIndex = -1;

    for (let i = 0; i < chapters.length && i < rows.length; i++) {
        const chapter = chapters[i];
        const row = rows[i];
        const state = getChapterState(chapter, i, chapters, currentTicks);
        const progress = getChapterProgress(chapter, i, chapters, currentTicks);

        if (state === 'playing') currentPlayingIndex = i;

        // Update state classes
        row.classList.remove('chapterItem-played', 'chapterItem-playing', 'chapterItem-unplayed');
        row.classList.add(`chapterItem-${state}`);

        // Keep the play position current so the row resumes rather than restarts
        row.setAttribute('data-positionticks', state === 'playing' ?
            Math.round(currentTicks) :
            chapter.StartPositionTicks);

        // Update status (the index number is fixed)
        const status = row.querySelector('.audiobookChapterItem-status');
        status.innerHTML = buildStatusHtml(item, state);

        // Update restart icon (before timestamp)
        const restartIcon = row.querySelector('.audiobookChapterItem-restart');
        const timeEl = row.querySelector('.audiobookChapterItem-time');
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

        // Update the seek slider (only the playing row has one)
        const sliderContainer = row.querySelector('.audiobookChapterItem-sliderContainer');
        if (state === 'playing') {
            const pct = (progress || 0) * 100;
            if (!sliderContainer) {
                row.insertAdjacentHTML('beforeend', buildSliderHtml(pct));
                setupChapterSlider(row, item, chapters, i);
            } else {
                const slider = sliderContainer.querySelector('.audiobookChapterSlider');
                // Don't fight the user while they are scrubbing
                if (slider && !slider.dragging) {
                    slider.value = Math.min(100, Math.max(0, pct));
                }
            }
        } else if (sliderContainer) {
            sliderContainer.remove();
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
let _keydownHandler = null;
let _focusOutHandler = null;

function attachClickInterceptor(container, item) {
    if (_clickInterceptor) {
        container.removeEventListener('click', _clickInterceptor, true);
    }
    if (_keydownHandler) {
        container.removeEventListener('keydown', _keydownHandler);
    }
    if (_focusOutHandler) {
        container.removeEventListener('focusout', _focusOutHandler);
    }

    _clickInterceptor = function (e) {
        // Clicks on the seek slider must never trigger the row's play action
        // or the play/pause toggle; the slider handles seeking itself.
        if (e.target.closest('.audiobookChapterItem-sliderContainer')) {
            e.stopImmediatePropagation();
            return;
        }
        // If clicking the restart icon, let it bubble to shortcuts normally
        if (e.target.closest('.audiobookChapterItem-restart')) {
            return;
        }
        // If clicking on the currently-playing chapter while this item is
        // actively loaded, toggle play/pause instead of restarting it
        const playingRow = e.target.closest('.chapterItem-playing');
        if (playingRow && isPlayerActiveForItem(item)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            playbackManager.playPause();
        }
    };

    // Rows are divs (role="button"); activate them from the keyboard
    _keydownHandler = function (e) {
        const row = e.target.closest?.('.audiobookChapterItem');
        if (!row) return;

        if (layoutManager.tv) {
            const key = getKeyName(e);
            const slider = row.classList.contains('chapterItem-playing') ?
                row.querySelector('.audiobookChapterSlider') :
                null;

            // Chapter rows keep focus on Left/Right; the playing row moves a
            // pending-seek dot (~10s per press) while the blue bar keeps
            // tracking live playback. Nothing seeks until OK confirms.
            if (key === 'ArrowLeft' || key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                if (slider) {
                    const step = slider._chapterKeyboardStep || 1;
                    const delta = key === 'ArrowLeft' ? -step : step;
                    const base = slider._pendingSeekPercent ?? (parseFloat(slider.value) || 0);
                    updatePendingSeek(slider, Math.min(100, Math.max(0, base + delta)));
                }
                return;
            }

            // Up/Down (or Back) abandons the pending seek; the key still
            // bubbles so navigation proceeds
            if (slider?._pendingSeekPercent != null
                    && (key === 'ArrowUp' || key === 'ArrowDown' || key === 'Escape' || key === 'Back')) {
                clearPendingSeek(slider);
            }
        }

        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target.classList?.contains('audiobookChapterItem')) {
            e.preventDefault();

            // With a pending seek, OK commits it instead of play/pause
            const slider = row.querySelector('.audiobookChapterSlider');
            if (slider?._pendingSeekPercent != null) {
                e.stopPropagation();
                slider.value = slider._pendingSeekPercent;
                clearPendingSeek(slider);
                slider.dispatchEvent(new Event('change'));
                return;
            }

            e.target.click();
        }
    };

    // Losing focus abandons the playing row's pending seek
    _focusOutHandler = function (e) {
        const row = e.target.closest?.('.chapterItem-playing');
        if (!row || row.contains(e.relatedTarget)) return;

        const slider = row.querySelector('.audiobookChapterSlider');
        if (slider) clearPendingSeek(slider);
    };

    // Use capturing phase so it runs before the shortcuts bubbling handler
    container.addEventListener('click', _clickInterceptor, true);
    container.addEventListener('keydown', _keydownHandler);
    container.addEventListener('focusout', _focusOutHandler);
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

    // Wire the seek slider on the initially-playing chapter, if any
    const playingRow = options.itemsContainer.querySelector('.chapterItem-playing');
    if (playingRow) {
        setupChapterSlider(playingRow, item, chapters, parseInt(playingRow.getAttribute('data-chapterindex'), 10));
    }

    scrollToCurrentChapter(options.itemsContainer);
    attachClickInterceptor(options.itemsContainer, item);
    bindLiveUpdates(options.itemsContainer, item, chapters);
}

export default {
    buildAudiobookChapterList,
    unbindLiveUpdates
};
