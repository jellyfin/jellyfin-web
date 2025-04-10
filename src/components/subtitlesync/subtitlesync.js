import { playbackManager } from '../playback/playbackmanager';
import layoutManager from '../layoutManager';
import template from './subtitlesync.template.html';
import './subtitlesync.scss';
import { TICKS_PER_SECOND } from 'constants/time';

let player;
let subtitleSyncSlider;
let subtitleSyncTextField;
let subtitleSyncCloseButton;
let subtitleSyncContainer;
let timelineRuler;
let subtitleEventsContainer;
let currentTrackEvents = null;

const TIMELINE_RESOLUTION_SECONDS = 10;

function init(instance) {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    parent.innerHTML = template;

    subtitleSyncSlider = parent.querySelector('.subtitleSyncSlider');
    subtitleSyncTextField = parent.querySelector('.subtitleSyncTextField');
    subtitleSyncCloseButton = parent.querySelector('.subtitleSync-closeButton');
    subtitleSyncContainer = parent.querySelector('.subtitleSyncContainer');
    timelineRuler = parent.querySelector('.timelineRuler');
    subtitleEventsContainer = parent.querySelector('.subtitleEventsContainer');

    if (layoutManager.tv) {
        subtitleSyncSlider.classList.add('focusable');
        // HACK: Delay to give time for registered element attach (Firefox)
        setTimeout(function () {
            subtitleSyncSlider.enableKeyboardDragging();
        }, 0);
    }

    subtitleSyncContainer.classList.add('hide');

    subtitleSyncTextField.updateOffset = function (offset) {
        this.textContent = offset + 's';
    };

    subtitleSyncTextField.addEventListener('click', function () {
        // keep focus to prevent fade with osd
        this.hasFocus = true;
    });

    subtitleSyncTextField.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            // if input key is enter search for float pattern
            let inputOffset = /[-+]?\d+\.?\d*/g.exec(this.textContent);
            if (inputOffset) {
                inputOffset = inputOffset[0];
                inputOffset = parseFloat(inputOffset);

                subtitleSyncSlider.updateOffset(inputOffset);
            } else {
                this.textContent = (playbackManager.getPlayerSubtitleOffset(player) || 0) + 's';
            }
            this.hasFocus = false;
            event.preventDefault();
        } else {
            // keep focus to prevent fade with osd
            this.hasFocus = true;
            if (event.key.match(/[+-\d.s]/) === null) {
                event.preventDefault();
            }
        }

        // FIXME: TV layout will require special handling for navigation keys. But now field is not focusable
        event.stopPropagation();
    });

    subtitleSyncTextField.blur = function () {
        // prevent textfield to blur while element has focus
        if (!this.hasFocus && this.prototype) {
            this.prototype.blur();
        }
    };

    function updateSubtitleOffset() {
        const value = parseFloat(subtitleSyncSlider.value);
        // set new offset
        playbackManager.setSubtitleOffset(value, player);
        // synchronize with textField value
        subtitleSyncTextField.updateOffset(value);
        // update timeline visualization to show what the offset WILL be
        // even before the plugin has applied it to the internal event data
        renderSubtitleTimeline(value);
    }

    subtitleSyncSlider.updateOffset = function (sliderValue) {
        // default value is 0s = 0ms
        this.value = sliderValue === undefined ? 0 : sliderValue;

        updateSubtitleOffset();
    };

    subtitleSyncSlider.addEventListener('change', () => updateSubtitleOffset());

    subtitleSyncSlider.getBubbleHtml = function (_, value) {
        return '<h1 class="sliderBubbleText">'
            + (value > 0 ? '+' : '') + parseFloat(value) + 's'
            + '</h1>';
    };

    subtitleSyncCloseButton.addEventListener('click', function () {
        playbackManager.disableShowingSubtitleOffset(player);
        SubtitleSync.prototype.toggle('forceToHide');
    });

    instance.element = parent;
}

// Get subtitle track events from the player
function getSubtitleEvents() {
    if (!player) return null;
    // Try to get events directly from player via playback manager
    const trackEvents = playbackManager.getCurrentSubtitleTrackEvents(player);
    if (trackEvents) {
        return trackEvents;
    }
    return null;
}

// Generate time markers for the timeline ruler
function generateTimeMarkers(currentTime) {
    // Clear existing markers
    timelineRuler.innerHTML = '';

    // Create markers at 1-second intervals,
    const startTime = Math.max(0, Math.floor(currentTime) - (TIMELINE_RESOLUTION_SECONDS / 2));
    const endTime = startTime + TIMELINE_RESOLUTION_SECONDS;
    const interval = 1; // 1-second intervals for precise timing

    for (let time = startTime; time <= endTime; time += interval) {
        const marker = document.createElement('div');
        marker.classList.add('timelineMarker');

        // Calculate position as percentage
        const position = ((time - startTime) / TIMELINE_RESOLUTION_SECONDS) * 100;
        marker.style.left = `${position}%`;

        // Format time as MM:SS
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        marker.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        timelineRuler.appendChild(marker);
    }
}

// Remove HTML tags from text safely
function stripHtmlTags(text) {
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.textContent;
}

// Render subtitle events in the timeline
function renderSubtitleEvents(events, currentTime, offset = 0) {
    // Clear existing events
    subtitleEventsContainer.innerHTML = '';

    if (!events || events.length === 0) {
        // No subtitle events to display
        return;
    }

    // Define the visible time range (10 seconds centered around current time)
    const startTime = currentTime - (TIMELINE_RESOLUTION_SECONDS / 2);
    const endTime = startTime + TIMELINE_RESOLUTION_SECONDS;

    // Create a current time indicator at the center
    const indicator = document.createElement('div');
    indicator.classList.add('currentTimeIndicator');
    subtitleEventsContainer.appendChild(indicator);

    // Store the current offset being applied by the player
    // We need this to correctly position the events in the timeline
    const currentPlayerOffset = playbackManager.getPlayerSubtitleOffset(player) || 0;

    // Calculate offset visualization adjustment
    // When showing an offset preview, we need to adjust relative to what's already applied
    const relativeOffset = offset - currentPlayerOffset;

    events.forEach(event => {
        // Convert ticks to seconds - these already have the currentPlayerOffset applied by the plugin
        const startSec = event.StartPositionTicks / TICKS_PER_SECOND;
        const endSec = event.EndPositionTicks / TICKS_PER_SECOND;

        // For visualization, apply just the relative change that hasn't been applied to the events yet
        const visualStartSec = startSec - relativeOffset;
        const visualEndSec = endSec - relativeOffset;

        // Calculate if any part of this event is visible in our time window
        const isVisible = !(visualEndSec <= startTime || visualStartSec >= endTime);
        if (!isVisible) {
            return;
        }

        // Calculate position and width as percentages exactly proportional to duration
        // Clamp to visible area
        const leftPos = Math.max(0, ((visualStartSec - startTime) / TIMELINE_RESOLUTION_SECONDS) * 100);
        const rightPos = Math.min(100, ((visualEndSec - startTime) / TIMELINE_RESOLUTION_SECONDS) * 100);

        const eventEl = document.createElement('div');
        eventEl.classList.add('subtitleEvent');

        // Apply position and width exactly as calculated
        // Ensure a minimum width for visibility
        eventEl.style.left = `${leftPos}%`;
        eventEl.style.width = `${rightPos - leftPos}%`;

        // Clean and add the text
        const cleanText = stripHtmlTags(event.Text || '');
        eventEl.textContent = cleanText;

        // Add a title for the full text on hover
        eventEl.title = cleanText;

        subtitleEventsContainer.appendChild(eventEl);
    });
}

// Update the entire timeline visualization
function renderSubtitleTimeline(targetOffset = null) {
    // Fetch subtitle events if not already loaded
    if (!currentTrackEvents) {
        currentTrackEvents = getSubtitleEvents();
    }

    // Get the current player time in seconds
    const currentTime = (player ? (playbackManager.currentTime(player) || 0) : 0) / 1000;

    // Generate time markers - the time markers don't shift with offset
    generateTimeMarkers(currentTime);

    // Use the provided target offset or fall back to the current player offset
    const offset = targetOffset !== null ? targetOffset : (playbackManager.getPlayerSubtitleOffset(player) || 0);

    // Render subtitle events with the current offset
    renderSubtitleEvents(currentTrackEvents, currentTime, offset);
}

class SubtitleSync {
    constructor(currentPlayer) {
        player = currentPlayer;
        init(this);
    }

    destroy() {
        SubtitleSync.prototype.toggle('forceToHide');
        if (player) {
            playbackManager.disableShowingSubtitleOffset(player);
            playbackManager.setSubtitleOffset(0, player);
        }
        const elem = this.element;
        if (elem) {
            elem.parentNode.removeChild(elem);
            this.element = null;
        }
        currentTrackEvents = null;
    }

    toggle(action) {
        if (action && !['hide', 'forceToHide'].includes(action)) {
            console.warn('SubtitleSync.toggle called with invalid action', action);
            return;
        }

        if (player && playbackManager.supportSubtitleOffset(player)) {
            if (!action) {
                // if showing subtitle sync is enabled and if there is an external subtitle stream enabled
                if (playbackManager.isShowingSubtitleOffsetEnabled(player) && playbackManager.canHandleOffsetOnCurrentSubtitle(player)) {
                    // Reset subtitles data to force fresh load
                    currentTrackEvents = null;

                    // if no subtitle offset is defined or element has focus (offset being defined)
                    if (!(playbackManager.getPlayerSubtitleOffset(player) || subtitleSyncTextField.hasFocus)) {
                        // set default offset to '0' = 0ms
                        subtitleSyncSlider.value = '0';
                        subtitleSyncTextField.textContent = '0s';
                        playbackManager.setSubtitleOffset(0, player);
                    } else {
                        // Make sure slider reflects current offset
                        const currentOffset = playbackManager.getPlayerSubtitleOffset(player) || 0;
                        subtitleSyncSlider.value = currentOffset.toString();
                        subtitleSyncTextField.updateOffset(currentOffset);
                    }
                    // show subtitle sync
                    subtitleSyncContainer.classList.remove('hide');

                    // Initialize the timeline visualization with the current offset
                    const currentOffset = playbackManager.getPlayerSubtitleOffset(player) || 0;
                    renderSubtitleTimeline(currentOffset);
                    return;
                }
            } else if (action === 'hide' && subtitleSyncTextField.hasFocus) {
                // do not hide if element has focus
                return;
            }

            subtitleSyncContainer.classList.add('hide');
        }
    }

    update(offset) {
        this.toggle();

        const value = parseFloat(subtitleSyncSlider.value) + offset;
        subtitleSyncSlider.updateOffset(value);
    }

    incrementOffset() {
        this.update(+subtitleSyncSlider.step);
    }

    decrementOffset() {
        this.update(-subtitleSyncSlider.step);
    }
}

export default SubtitleSync;
