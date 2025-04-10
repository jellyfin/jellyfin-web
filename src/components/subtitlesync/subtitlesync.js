import { playbackManager } from '../playback/playbackmanager';
import layoutManager from '../layoutManager';
import template from './subtitlesync.template.html';
import './subtitlesync.scss';
import { TICKS_PER_SECOND } from 'constants/time';

// Constants
const TIMELINE_RESOLUTION_SECONDS = 10;
const DEFAULT_OFFSET = 0;
const TIME_MARKER_INTERVAL = 1; // 1-second intervals for precise timing
const DOM_INIT_DELAY = 0; // for Firefox element attach hack
const PERCENT_MAX = 100;

class SubtitleSync {
    constructor(currentPlayer) {
        this.player = currentPlayer;
        this.currentTrackEvents = null;

        this.initUI();
    }

    initUI() {
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

        this.setupSlider();
        this.setupTextField();
        this.setupCloseButton();

        // Initially hide the container
        this.subtitleSyncContainer.classList.add('hide');
    }

    setupSlider() {
        const slider = this.subtitleSyncSlider;

        if (layoutManager.tv) {
            slider.classList.add('focusable');
            // HACK: Delay to give time for registered element attach (Firefox)
            setTimeout(() => slider.enableKeyboardDragging(), DOM_INIT_DELAY);
        }

        slider.addEventListener('change', () => this.updateSubtitleOffset());
        slider.getBubbleHtml = this.createSliderBubbleHtml;
        slider.updateOffset = this.createSliderUpdateOffset();
    }

    createSliderBubbleHtml(_, value) {
        return '<h1 class="sliderBubbleText">'
            + (value > 0 ? '+' : '') + parseFloat(value) + 's'
            + '</h1>';
    }

    createSliderUpdateOffset() {
        return (sliderValue) => {
            // default value is 0s = 0ms
            this.subtitleSyncSlider.value = sliderValue === undefined ? DEFAULT_OFFSET : sliderValue;
            this.updateSubtitleOffset();
        };
    }

    setupTextField() {
        const textField = this.subtitleSyncTextField;

        textField.updateOffset = (offset) => {
            textField.textContent = offset + 's';
        };

        textField.addEventListener('click', this.handleTextFieldClick);
        textField.addEventListener('keydown', this.createTextFieldKeydownHandler());
        textField.blur = this.createTextFieldBlurHandler();
    }

    handleTextFieldClick() {
        // keep focus to prevent fade with osd
        this.hasFocus = true;
    }

    createTextFieldKeydownHandler() {
        return (event) => {
            if (event.key === 'Enter') {
                this.handleTextFieldEnter(event);
            } else {
                this.handleTextFieldOtherKeys(event);
            }
            // FIXME: TV layout will require special handling for navigation keys. But now field is not focusable
            event.stopPropagation();
        };
    }

    handleTextFieldEnter(event) {
        const textField = this.subtitleSyncTextField;
        // if input key is enter search for float pattern
        let inputOffset = /[-+]?\d+\.?\d*/g.exec(textField.textContent);
        if (inputOffset) {
            inputOffset = parseFloat(inputOffset[0]);
            this.subtitleSyncSlider.updateOffset(inputOffset);
        } else {
            textField.textContent = (playbackManager.getPlayerSubtitleOffset(this.player) || DEFAULT_OFFSET) + 's';
        }
        textField.hasFocus = false;
        event.preventDefault();
    }

    handleTextFieldOtherKeys(event) {
        // keep focus to prevent fade with osd
        this.subtitleSyncTextField.hasFocus = true;
        if (event.key.match(/[+-\d.s]/) === null) {
            event.preventDefault();
        }
    }

    createTextFieldBlurHandler() {
        return function() {
            // prevent textfield to blur while element has focus
            if (!this.hasFocus && this.prototype) {
                this.prototype.blur();
            }
        };
    }

    setupCloseButton() {
        this.subtitleSyncCloseButton.addEventListener('click', () => {
            playbackManager.disableShowingSubtitleOffset(this.player);
            this.toggle('forceToHide');
        });
    }

    updateSubtitleOffset() {
        const value = parseFloat(this.subtitleSyncSlider.value);
        // set new offset
        playbackManager.setSubtitleOffset(value, this.player);
        // synchronize with textField value
        this.subtitleSyncTextField.updateOffset(value);
        // update timeline visualization to show what the offset WILL be
        // even before the plugin has applied it to the internal event data
        this.renderSubtitleTimeline(value);
    }

    // Get subtitle track events from the player
    getSubtitleEvents() {
        if (!this.player) return null;
        // Try to get events directly from player via playback manager
        return playbackManager.getCurrentSubtitleTrackEvents(this.player);
    }

    // Generate time markers for the timeline ruler
    generateTimeMarkers(currentTime) {
        // Clear existing markers
        this.timelineRuler.innerHTML = '';

        const timeWindow = this.getTimeWindow(currentTime);
        this.createTimeMarkers(timeWindow.startTime, timeWindow.endTime);
    }

    getTimeWindow(currentTime) {
        const startTime = Math.max(0, Math.floor(currentTime) - (TIMELINE_RESOLUTION_SECONDS / 2));
        const endTime = startTime + TIMELINE_RESOLUTION_SECONDS;
        return { startTime, endTime };
    }

    createTimeMarkers(startTime, endTime) {
        for (let time = startTime; time <= endTime; time += TIME_MARKER_INTERVAL) {
            const marker = this.createTimeMarker(time, startTime);
            this.timelineRuler.appendChild(marker);
        }
    }

    createTimeMarker(time, startTime) {
        const marker = document.createElement('div');
        marker.classList.add('timelineMarker');

        // Calculate position as percentage
        const position = ((time - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX;
        marker.style.left = `${position}%`;

        // Format time as MM:SS
        marker.textContent = this.formatTimeMarker(time);

        return marker;
    }

    formatTimeMarker(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Render subtitle events in the timeline
    renderSubtitleEvents(events, currentTime, offset = 0) {
        // Clear existing events
        this.subtitleEventsContainer.innerHTML = '';

        if (!events || events.length === 0) {
            // No subtitle events to display
            return;
        }

        const timeWindow = this.getTimeWindow(currentTime);

        // Store the current offset being applied by the player
        // We need this to correctly position the events in the timeline
        const currentPlayerOffset = playbackManager.getPlayerSubtitleOffset(this.player) || DEFAULT_OFFSET;

        // Calculate offset visualization adjustment
        // When showing an offset preview, we need to adjust relative to what's already applied
        const relativeOffset = offset - currentPlayerOffset;

        this.renderEvents(events, timeWindow, relativeOffset, currentTime);
    }

    renderEvents(events, timeWindow, relativeOffset, currentTime) {
        const { startTime, endTime } = timeWindow;

        events.forEach(event => {
            const timing = this.calculateEventTiming(event, relativeOffset);
            const isVisible = this.isEventVisible(timing, startTime, endTime);

            if (!isVisible) return;

            const isCurrentEvent = this.isCurrentEvent(timing, currentTime);
            const eventElement = this.createEventElement(timing, startTime, isCurrentEvent);
            this.subtitleEventsContainer.appendChild(eventElement);
        });
    }

    calculateEventTiming(event, relativeOffset) {
        // Convert ticks to seconds - these already have the currentPlayerOffset applied by the plugin
        const startSec = event.StartPositionTicks / TICKS_PER_SECOND;
        const endSec = event.EndPositionTicks / TICKS_PER_SECOND;

        // For visualization, apply just the relative change that hasn't been applied to the events yet
        return {
            visualStartSec: startSec - relativeOffset,
            visualEndSec: endSec - relativeOffset,
            text: event.Text || ''
        };
    }

    isEventVisible(timing, startTime, endTime) {
        return !(timing.visualEndSec <= startTime || timing.visualStartSec >= endTime);
    }

    isCurrentEvent(timing, currentTime) {
        return timing.visualStartSec <= currentTime && currentTime <= timing.visualEndSec;
    }

    createEventElement(timing, startTime, isCurrentEvent) {
        const { visualStartSec, visualEndSec, text } = timing;

        // Calculate position and width as percentages exactly proportional to duration
        // Clamp to visible area
        const leftPos = Math.max(0, ((visualStartSec - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX);
        const rightPos = Math.min(PERCENT_MAX, ((visualEndSec - startTime) / TIMELINE_RESOLUTION_SECONDS) * PERCENT_MAX);

        const eventEl = document.createElement('div');
        eventEl.classList.add('subtitleEvent');

        // Add class for the current subtitle
        if (isCurrentEvent) {
            eventEl.classList.add('currentSubtitleEvent');
        }

        // Apply position and width exactly as calculated
        eventEl.style.left = `${leftPos}%`;
        eventEl.style.width = `${rightPos - leftPos}%`;

        // Clean and add the text
        eventEl.textContent = text;
        // Add a title for the full text on hover
        eventEl.title = text;

        return eventEl;
    }

    // Update the entire timeline visualization
    renderSubtitleTimeline(targetOffset = null) {
        if (!this.currentTrackEvents || !this.currentTrackEvents.length) {
            // Hide the timeline wrapper when no events exist
            this.subtitleTimelineWrapper.style.display = 'none';
            return;
        }

        // Show the timeline wrapper when events exist
        this.subtitleTimelineWrapper.style.display = '';

        // Get the current player time in seconds
        const currentTime = this.getCurrentPlayerTime();

        // Generate time markers - the time markers don't shift with offset
        this.generateTimeMarkers(currentTime);

        // Use the provided target offset or fall back to the current player offset
        const offset = targetOffset !== null ? targetOffset : (playbackManager.getPlayerSubtitleOffset(this.player) || DEFAULT_OFFSET);

        // Render subtitle events with the current offset
        this.renderSubtitleEvents(this.currentTrackEvents, currentTime, offset);
    }

    getCurrentPlayerTime() {
        return (this.player ? (playbackManager.currentTime(this.player) || 0) : 0) / 1000;
    }

    destroy() {
        this.toggle('forceToHide');
        this.releaseCurrentPlayer();
        if (this.player) {
            playbackManager.disableShowingSubtitleOffset(this.player);
            playbackManager.setSubtitleOffset(DEFAULT_OFFSET, this.player);
        }

        if (this.element) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }

        this.currentTrackEvents = null;
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
            this.tryShowSubtitleSync();
        } else if (action === 'hide' && this.subtitleSyncTextField.hasFocus) {
            // do not hide if element has focus
            return;
        } else {
            this.subtitleSyncContainer.classList.add('hide');
        }
    }

    tryShowSubtitleSync() {
        // if showing subtitle sync is enabled and if there is an external subtitle stream enabled
        if (!this.canShowSubtitleSync()) {
            this.subtitleSyncContainer.classList.add('hide');
            return;
        }

        // Reset subtitles data to force fresh load
        this.currentTrackEvents = this.getSubtitleEvents();

        const currentOffset = playbackManager.getPlayerSubtitleOffset(this.player) || DEFAULT_OFFSET;
        this.updateUIWithOffset(currentOffset);

        // show subtitle sync
        this.subtitleSyncContainer.classList.remove('hide');

        // Initialize the timeline visualization with the current offset
        this.renderSubtitleTimeline(currentOffset);
    }

    canShowSubtitleSync() {
        return playbackManager.isShowingSubtitleOffsetEnabled(this.player)
               && playbackManager.canHandleOffsetOnCurrentSubtitle(this.player);
    }

    updateUIWithOffset(currentOffset) {
        if (!(currentOffset || this.subtitleSyncTextField.hasFocus)) {
            // set default offset to '0' = 0ms
            this.subtitleSyncSlider.value = DEFAULT_OFFSET.toString();
            this.subtitleSyncTextField.textContent = DEFAULT_OFFSET + 's';
            playbackManager.setSubtitleOffset(DEFAULT_OFFSET, this.player);
        } else {
            // Make sure slider reflects current offset
            this.subtitleSyncSlider.value = currentOffset.toString();
            this.subtitleSyncTextField.updateOffset(currentOffset);
        }
    }

    update(offset) {
        this.toggle();

        const value = parseFloat(this.subtitleSyncSlider.value) + offset;
        this.subtitleSyncSlider.updateOffset(value);
    }

    incrementOffset() {
        this.update(+this.subtitleSyncSlider.step);
    }

    decrementOffset() {
        this.update(-this.subtitleSyncSlider.step);
    }
}

export default SubtitleSync;
