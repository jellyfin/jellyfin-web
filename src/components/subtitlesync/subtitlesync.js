import { playbackManager } from '../playback/playbackmanager';
import layoutManager from '../layoutManager';
import template from './subtitlesync.template.html';
import './subtitlesync.scss';
import { PlaybackSubscriber } from '../../apps/stable/features/playback/utils/playbackSubscriber';

// Constants
const TIMELINE_RESOLUTION_SECONDS = 10.0;
const DEFAULT_OFFSET = 0;
const TIME_MARKER_INTERVAL = 1; // 1-second intervals for precise timing
const PERCENT_MAX = 100.0;

function formatTimeMarker(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function createSliderBubbleHtml(_, value) {
    return '<h1 class="sliderBubbleText">'
        + (value > 0 ? '+' : '') + parseFloat(value) + 's'
        + '</h1>';
}

class SubtitleTimeline extends PlaybackSubscriber {
    constructor(timelineRuler, eventsContainer, timelineWrapper, player) {
        super(playbackManager);
        this.timelineRuler = timelineRuler;
        this.subtitleEventsContainer = eventsContainer;
        this.subtitleTimelineWrapper = timelineWrapper;
        this.player = player;
        this.currentSubtitles = null;
    }

    onPlayerTimeUpdate() {
        this._updateTimelineVisualization();
    }

    _updateTimelineVisualization() {
        if (!this.currentSubtitles || !this.currentSubtitles.length) {
            this.hide();
            return;
        }

        // Get the current player time in seconds
        const currentTime = this._getCurrentPlayerTime();

        // Render the timeline with current subtitles
        this.render(currentTime);
    }

    _getCurrentPlayerTime() {
        return (this.player ? (playbackManager.currentTime(this.player) || 0) : 0) / 1000.0;
    }

    _getSubtitleEvents() {
        if (!this.player) return null;
        return playbackManager.getCurrentSubtitleTrackEvents(this.player);
    }

    updateEvents() {
        // Get subtitles in our unified seconds-based format
        this.currentSubtitles = this._getSubtitleEvents();
        this._updateTimelineVisualization();
    }

    getTimeWindow(currentTime) {
        const startTime = Math.max(0, currentTime - (TIMELINE_RESOLUTION_SECONDS / 2));
        const endTime = startTime + TIMELINE_RESOLUTION_SECONDS;
        return { startTime, endTime };
    }

    generateTimeMarkers(currentTime) {
        // Clear existing markers
        this.timelineRuler.innerHTML = '';

        const timeWindow = this.getTimeWindow(currentTime);
        this._createTimeMarkers(timeWindow.startTime, timeWindow.endTime);
    }

    _createTimeMarkers(startTime, endTime) {
        for (let time = startTime; time <= endTime; time += TIME_MARKER_INTERVAL) {
            const marker = this._createTimeMarker(time, startTime);
            this.timelineRuler.appendChild(marker);
        }
    }

    _createTimeMarker(time, startTime) {
        const marker = document.createElement('div');
        marker.classList.add('timelineMarker');

        // Calculate position as percentage
        const position = (((time - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX);
        marker.style.left = `${position}%`;

        // Format time as MM:SS
        marker.textContent = formatTimeMarker(time);

        return marker;
    }

    renderEvents(currentTime) {
        // Clear existing events
        this.subtitleEventsContainer.innerHTML = '';

        if (!this.currentSubtitles || this.currentSubtitles.length === 0) {
            // Hide the timeline wrapper when no events exist
            this.subtitleTimelineWrapper.style.display = 'none';
            return;
        }

        // Show the timeline wrapper when events exist
        this.subtitleTimelineWrapper.style.display = '';

        const timeWindow = this.getTimeWindow(currentTime);
        const { startTime, endTime } = timeWindow;

        this.currentSubtitles.forEach(subtitle => {
            if (!this._isEventVisible(subtitle, startTime, endTime)) return;

            const eventElement = this._createEventElement(subtitle, startTime);
            this.subtitleEventsContainer.appendChild(eventElement);
        });
    }

    _isEventVisible(subtitle, startTime, endTime) {
        return !(subtitle.endTime <= startTime || subtitle.startTime >= endTime);
    }

    _createEventElement(subtitle, startTime) {
        // Calculate position and width as percentages exactly proportional to duration
        // Clamp to visible area
        const leftPos = Math.max(0, ((subtitle.startTime - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX);
        const rightPos = Math.min(PERCENT_MAX, ((subtitle.endTime - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX);

        const eventEl = document.createElement('div');
        eventEl.classList.add('subtitleEvent');

        // Apply position and width exactly as calculated
        eventEl.style.left = `${leftPos}%`;
        eventEl.style.width = `${rightPos - leftPos}%`;

        // Clean and add the text
        eventEl.textContent = subtitle.text;
        // Add a title for the full text on hover
        eventEl.title = subtitle.text;

        return eventEl;
    }

    render(currentTime) {
        // Generate time markers - the time markers don't shift with offset
        this.generateTimeMarkers(currentTime);

        // Render subtitle events with the current offset
        this.renderEvents(currentTime);
    }

    hide() {
        this.subtitleTimelineWrapper.style.display = 'none';
    }

    destroy() {
        this.currentSubtitles = null;

        // Call parent class destroy to clean up event subscriptions
        super.destroy?.();
    }
}

class OffsetController {
    constructor(player, slider, textField, onOffsetChange) {
        this.player = player;
        this.slider = slider;
        this.textField = textField;
        this.currentOffset = DEFAULT_OFFSET;
        this.onOffsetChange = onOffsetChange;

        this._initSlider();
        this._initTextField();
    }

    _initSlider() {
        const slider = this.slider;

        if (layoutManager.tv) {
            slider.classList.add('focusable');
            // eslint-disable-next-line no-warning-comments
            // HACK: Delay to give time for registered element attach (Firefox)
            setTimeout(() => slider.enableKeyboardDragging(), 0);
        }

        slider.addEventListener('change', () => this.updateOffset());
        slider.getBubbleHtml = createSliderBubbleHtml;

        // Simplified slider update method
        slider.updateOffset = (value) => {
            this.slider.value = value === undefined ? DEFAULT_OFFSET : value;
            this.updateOffset();
        };
    }

    _initTextField() {
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
                    inputOffset = parseFloat(inputOffset[0]);
                    this.slider.updateOffset(inputOffset);
                } else {
                    textField.textContent = this.currentOffset + 's';
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
            event.stopPropagation();
        });

        textField.blur = function() {
            // prevent textfield to blur while element has focus
            if (!this.hasFocus && this.prototype) {
                this.prototype.blur();
            }
        };
    }

    updateOffset() {
        const value = parseFloat(this.slider.value);

        // set new offset
        playbackManager.setSubtitleOffset(value, this.player);

        // synchronize with textField value
        this.textField.updateOffset(value);

        // update current offset
        this.currentOffset = value;

        // notify listeners
        if (this.onOffsetChange) {
            this.onOffsetChange(value);
        }
    }

    adjustOffset(delta) {
        const value = parseFloat(this.slider.value) + delta;
        this.slider.updateOffset(value);
    }

    setOffset(offset) {
        this.currentOffset = offset;
        this.slider.value = offset.toString();
        this.textField.updateOffset(offset);
    }

    reset() {
        this.setOffset(DEFAULT_OFFSET);
        playbackManager.setSubtitleOffset(DEFAULT_OFFSET, this.player);
    }
}

class SubtitleSync {
    constructor(currentPlayer) {
        this.player = currentPlayer;

        this._initUI();

        // Create the timeline controller
        this.timeline = new SubtitleTimeline(
            this.timelineRuler,
            this.subtitleEventsContainer,
            this.subtitleTimelineWrapper,
            this.player
        );

        // Create the offset controller
        this.offsetController = new OffsetController(
            this.player,
            this.subtitleSyncSlider,
            this.subtitleSyncTextField,
            () => this._handleOffsetChange()
        );
    }

    _initUI() {
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

        this._setupCloseButton();

        // Initially hide the container
        this.subtitleSyncContainer.classList.add('hide');
    }

    _setupCloseButton() {
        this.subtitleSyncCloseButton.addEventListener('click', () => {
            playbackManager.disableShowingSubtitleOffset(this.player);
            this.toggle('forceToHide');
        });
    }

    _handleOffsetChange() {
        // Wait a short time for the player to apply the offset to track events
        setTimeout(() => {
            // Update timeline with fresh events
            this.timeline.updateEvents();
        }, 150); // Small delay to ensure offset has been applied to events
    }

    _tryShowSubtitleSync() {
        // if showing subtitle sync is enabled and if there is an external subtitle stream enabled
        if (!this._canShowSubtitleSync()) {
            this.subtitleSyncContainer.classList.add('hide');
            return;
        }

        // Update current offset from player
        const currentOffset = playbackManager.getPlayerSubtitleOffset(this.player) || DEFAULT_OFFSET;
        this.offsetController.setOffset(currentOffset);

        // show subtitle sync
        this.subtitleSyncContainer.classList.remove('hide');

        // Initialize the timeline visualization with the current offset
        this.timeline.updateEvents();
    }

    _canShowSubtitleSync() {
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
            this.element.parentNode.removeChild(this.element);
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
            this._tryShowSubtitleSync();
        } else if (action === 'hide' && this.subtitleSyncTextField.hasFocus) {
            // do not hide if element has focus
            return;
        } else {
            this.subtitleSyncContainer.classList.add('hide');
        }
    }
}

export default SubtitleSync;
