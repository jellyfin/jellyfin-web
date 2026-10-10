import { playbackManager } from '../playback/playbackmanager';
import layoutManager from '../layoutManager';
import template from './subtitlesync.template.html';
import './subtitlesync.scss';
import { PlaybackSubscriber } from '../../apps/stable/features/playback/utils/playbackSubscriber';

// Constants
const DEFAULT_OFFSET = 0;
// Width of the visible timeline window, centered on the current playback time.
const TIMELINE_RESOLUTION_SECONDS = 10;
const TIME_MARKER_INTERVAL_SECONDS = 1;
const PERCENT_MAX = 100;
const MILLISECONDS_PER_SECOND = 1000;
// Time for the player to apply a new offset to its track events before we re-read them.
const OFFSET_APPLY_DELAY_MS = 150;

function formatTimeMarker(timeSeconds) {
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = Math.floor(timeSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function createSliderBubbleHtml(_, value) {
    return '<h1 class="sliderBubbleText">'
        + (value > 0 ? '+' : '') + Number.parseFloat(value) + 's'
        + '</h1>';
}

/**
 * Renders a scrolling timeline of subtitle events around the current playback
 * position so the user can visually align the offset.
 *
 * Subscribes to player time updates via PlaybackSubscriber. To stay cheap enough
 * for every timeupdate (including on mobile), DOM nodes are pooled and reused:
 * each render updates the position, text and visibility of existing nodes rather
 * than clearing the container and rebuilding it.
 */
class SubtitleTimeline extends PlaybackSubscriber {
    #timelineRuler;
    #eventsContainer;
    #timelineWrapper;
    #player;
    #currentSubtitles = null;
    #markerPool = [];
    #eventPool = [];

    constructor(timelineRuler, eventsContainer, timelineWrapper, player) {
        super(playbackManager);
        this.#timelineRuler = timelineRuler;
        this.#eventsContainer = eventsContainer;
        this.#timelineWrapper = timelineWrapper;
        this.#player = player;
    }

    onPlayerTimeUpdate() {
        this.#updateVisualization();
    }

    /** Re-reads subtitle events from the player and refreshes the timeline. */
    updateEvents() {
        this.#currentSubtitles = this.#player ?
            playbackManager.getCurrentSubtitleTrackEvents(this.#player) :
            null;
        this.#updateVisualization();
    }

    hide() {
        this.#timelineWrapper.style.display = 'none';
    }

    destroy() {
        this.#currentSubtitles = null;
        // Clean up the player event subscriptions registered by PlaybackSubscriber.
        super.destroy?.();
    }

    #updateVisualization() {
        if (!this.#currentSubtitles?.length) {
            this.hide();
            return;
        }

        this.#timelineWrapper.style.display = '';

        const currentTimeSeconds = this.#getCurrentPlayerTimeSeconds();
        const startTime = Math.max(0, currentTimeSeconds - (TIMELINE_RESOLUTION_SECONDS / 2));
        const endTime = startTime + TIMELINE_RESOLUTION_SECONDS;

        this.#renderMarkers(startTime);
        this.#renderEvents(startTime, endTime);
    }

    #getCurrentPlayerTimeSeconds() {
        if (!this.#player) {
            return 0;
        }
        return (playbackManager.currentTime(this.#player) || 0) / MILLISECONDS_PER_SECOND;
    }

    #renderMarkers(startTime) {
        let index = 0;
        for (
            let time = Math.ceil(startTime);
            time <= startTime + TIMELINE_RESOLUTION_SECONDS;
            time += TIME_MARKER_INTERVAL_SECONDS, index++
        ) {
            const marker = this.#markerAt(index);
            const position = ((time - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX;
            marker.style.left = `${position}%`;
            marker.textContent = formatTimeMarker(time);
            marker.style.display = '';
        }
        this.#hidePooledFrom(this.#markerPool, index);
    }

    #renderEvents(startTime, endTime) {
        let index = 0;
        this.#currentSubtitles.forEach(subtitle => {
            if (subtitle.endTime <= startTime || subtitle.startTime >= endTime) {
                return;
            }

            const leftPercent = Math.max(0, ((subtitle.startTime - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX);
            const rightPercent = Math.min(PERCENT_MAX, ((subtitle.endTime - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX);

            const element = this.#eventAt(index++);
            element.style.left = `${leftPercent}%`;
            element.style.width = `${rightPercent - leftPercent}%`;
            element.textContent = subtitle.text;
            element.title = subtitle.text;
            element.style.display = '';
        });
        this.#hidePooledFrom(this.#eventPool, index);
    }

    #markerAt(index) {
        let marker = this.#markerPool[index];
        if (!marker) {
            marker = document.createElement('div');
            marker.classList.add('timelineMarker');
            this.#timelineRuler.appendChild(marker);
            this.#markerPool[index] = marker;
        }
        return marker;
    }

    #eventAt(index) {
        let element = this.#eventPool[index];
        if (!element) {
            element = document.createElement('div');
            element.classList.add('subtitleEvent');
            this.#eventsContainer.appendChild(element);
            this.#eventPool[index] = element;
        }
        return element;
    }

    #hidePooledFrom(pool, fromIndex) {
        for (let index = fromIndex; index < pool.length; index++) {
            pool[index].style.display = 'none';
        }
    }
}

class OffsetController {
    constructor(player, slider, textField, onOffsetChange) {
        this.player = player;
        this.slider = slider;
        this.textField = textField;
        this.onOffsetChange = onOffsetChange;

        this.#initSlider();
        this.#initTextField();

        // Set initial offset
        this.reset();
    }

    get currentOffset() {
        return Number.parseFloat(this.slider.value);
    }

    set currentOffset(value) {
        this.slider.value = value.toString();

        // rely on slider value trimming
        value = this.currentOffset;

        playbackManager.setSubtitleOffset(value, this.player);
        this.textField.updateOffset(value);

        this.onOffsetChange?.(value);
    }

    #initSlider() {
        const slider = this.slider;

        if (layoutManager.tv) {
            slider.classList.add('focusable');
            // Delay required for Firefox – wait for custom element to attach
            setTimeout(() => slider.enableKeyboardDragging(), 0);
        }

        // When slider changes we assign the value to the currentOffset to trigger the setter
        slider.addEventListener('change', () => {
            // eslint-disable-next-line no-self-assign
            this.currentOffset = this.currentOffset;
        });

        slider.getBubbleHtml = createSliderBubbleHtml;
    }

    #initTextField() {
        const textField = this.textField;

        textField.updateOffset = (offset) => {
            textField.textContent = offset + 's';
        };

        textField.addEventListener('click', () => {
            // keep focus to prevent fade with osd
            textField.hasFocus = true;
        });

        textField.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                // if input key is enter search for float pattern
                let inputOffset = /[-+]?\d+\.?\d*/g.exec(textField.textContent);
                if (inputOffset) {
                    inputOffset = Number.parseFloat(inputOffset[0]);
                    this.currentOffset = inputOffset;
                } else {
                    textField.updateOffset(playbackManager.getPlayerSubtitleOffset(this.player) || 0);
                }
                textField.hasFocus = false;
                event.preventDefault();
            } else {
                // keep focus to prevent fade with osd
                textField.hasFocus = true;
                if (event.key.match(/[+-\d.s]/) === null) {
                    event.preventDefault();
                }
            }

            // TV layout will require special handling for navigation keys. But now field is not focusable
            event.stopPropagation();
        });

        // Preserve native blur while respecting the custom focus flag
        const originalBlur = textField.blur.bind(textField);
        textField.blur = function () {
            if (!this.hasFocus) {
                originalBlur();
            }
        };
    }

    adjustOffset(delta) {
        this.currentOffset = this.currentOffset + delta;
    }

    reset() {
        this.currentOffset = DEFAULT_OFFSET;
    }
}

class SubtitleSync {
    constructor(currentPlayer) {
        this.player = currentPlayer;
        this.#initUI();

        this.timeline = new SubtitleTimeline(
            this.timelineRuler,
            this.subtitleEventsContainer,
            this.subtitleTimelineWrapper,
            this.player
        );

        this.offsetController = new OffsetController(
            this.player,
            this.subtitleSyncSlider,
            this.subtitleSyncTextField,
            () => this.#onOffsetChange()
        );
    }

    destroy() {
        if (this.timeline) {
            this.timeline.destroy();
            this.timeline = null;
        }

        this.toggle('forceToHide');
        if (this.player) {
            playbackManager.disableShowingSubtitleOffset(this.player);
            this.offsetController.reset();
        }

        if (this.element) {
            this.element.remove();
            this.element = null;
        }

        this.player = null;
    }

    toggle(action) {
        if (action && !['hide', 'forceToHide'].includes(action)) {
            console.warn('SubtitleSync.toggle called with invalid action', action);
            return;
        }

        if (!this.player || !playbackManager.supportSubtitleOffset(this.player)) {
            return;
        }

        if (!action) {
            this.#tryShowSubtitleSync();
        } else if (action === 'hide' && this.subtitleSyncTextField.hasFocus) {
            // do not hide if element has focus
            return;
        } else {
            this.subtitleSyncContainer.classList.add('hide');
        }
    }

    #onOffsetChange() {
        // The player applies the offset to its track events asynchronously, so
        // wait briefly before re-reading them to redraw the timeline.
        setTimeout(() => this.timeline?.updateEvents(), OFFSET_APPLY_DELAY_MS);
    }

    #initUI() {
        const parent = document.createElement('div');
        document.body.appendChild(parent);
        parent.innerHTML = template;

        // Store DOM elements
        this.element = parent;
        this.subtitleSyncSlider = parent.querySelector('.subtitleSyncSlider');
        this.subtitleSyncTextField = parent.querySelector('.subtitleSyncTextField');
        this.subtitleSyncCloseButton = parent.querySelector('.subtitleSync-closeButton');
        this.subtitleSyncContainer = parent.querySelector('.subtitleSyncContainer');
        this.timelineRuler = parent.querySelector('.timelineRuler');
        this.subtitleEventsContainer = parent.querySelector('.subtitleEventsContainer');
        this.subtitleTimelineWrapper = parent.querySelector('.subtitleTimelineWrapper');

        this.#setupCloseButton();

        // Initially hide the container
        this.subtitleSyncContainer.classList.add('hide');
    }

    #setupCloseButton() {
        this.subtitleSyncCloseButton.addEventListener('click', () => {
            playbackManager.disableShowingSubtitleOffset(this.player);
            this.toggle('forceToHide');
        });
    }

    #tryShowSubtitleSync() {
        // if showing subtitle sync is enabled and if there is an external subtitle stream enabled
        if (!this.#canShowSubtitleSync()) {
            this.subtitleSyncContainer.classList.add('hide');
            return;
        }

        // If no subtitle offset is defined or element has focus (offset being defined)
        if (!(playbackManager.getPlayerSubtitleOffset(this.player) || this.subtitleSyncTextField.hasFocus)) {
            // reset to default offset
            this.offsetController.reset();
        }

        // show subtitle sync
        this.subtitleSyncContainer.classList.remove('hide');

        // Draw the timeline for the current subtitle track
        this.timeline.updateEvents();
    }

    #canShowSubtitleSync() {
        return playbackManager.isShowingSubtitleOffsetEnabled(this.player)
               && playbackManager.canHandleOffsetOnCurrentSubtitle(this.player);
    }

    incrementOffset() {
        this.toggle();
        this.offsetController.adjustOffset(+this.subtitleSyncSlider.step);
    }

    decrementOffset() {
        this.toggle();
        this.offsetController.adjustOffset(-this.subtitleSyncSlider.step);
    }
}

export default SubtitleSync;
