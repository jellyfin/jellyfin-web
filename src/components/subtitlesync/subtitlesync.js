
import { playbackManager } from '../playback/playbackmanager';
import layoutManager from '../layoutManager';
import template from './subtitlesync.template.html';
import './subtitlesync.scss';

let player;
let subtitleSyncSlider;
let subtitleSyncTextField;
let subtitleSyncCloseButton;
let subtitleSyncContainer;

function init(instance) {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    parent.innerHTML = template;

    subtitleSyncSlider = parent.querySelector('.subtitleSyncSlider');
    subtitleSyncTextField = parent.querySelector('.subtitleSyncTextField');
    subtitleSyncCloseButton = parent.querySelector('.subtitleSync-closeButton');
    subtitleSyncContainer = parent.querySelector('.subtitleSyncContainer');

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
                inputOffset = Math.min(30, Math.max(-30, inputOffset));

                // replace current text by considered offset
                this.textContent = inputOffset + 's';
                // set new offset
                playbackManager.setSubtitleOffset(inputOffset, player);
                // synchronize with slider value
                subtitleSyncSlider.updateOffset(
                    getPercentageFromOffset(inputOffset));
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

    subtitleSyncSlider.updateOffset = function (percent) {
        // default value is 0s = 50%
        this.value = percent === undefined ? 50 : percent;
    };

    subtitleSyncSlider.addEventListener('change', function () {
        // set new offset
        playbackManager.setSubtitleOffset(getOffsetFromPercentage(this.value), player);
        // synchronize with textField value
        subtitleSyncTextField.updateOffset(
            getOffsetFromPercentage(this.value));
    });

    subtitleSyncSlider.getBubbleHtml = function (value) {
        const newOffset = getOffsetFromPercentage(value);
        return '<h1 class="sliderBubbleText">' +
            (newOffset > 0 ? '+' : '') + parseFloat(newOffset) + 's' +
            '</h1>';
    };

    subtitleSyncCloseButton.addEventListener('click', function () {
        playbackManager.disableShowingSubtitleOffset(player);
        SubtitleSync.prototype.toggle('forceToHide');
    });

    instance.element = parent;
}

function getOffsetFromPercentage(value) {
    // convert percent to fraction
    let offset = (value - 50) / 50;
    // multiply by offset min/max range value (-x to +x) :
    offset *= 30;
    return offset.toFixed(1);
}

function getPercentageFromOffset(value) {
    // divide by offset min/max range value (-x to +x) :
    let percentValue = value / 30;
    // convert fraction to percent
    percentValue *= 50;
    percentValue += 50;
    return Math.min(100, Math.max(0, percentValue.toFixed(1)));
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
                    // if no subtitle offset is defined or element has focus (offset being defined)
                    if (!(playbackManager.getPlayerSubtitleOffset(player) || subtitleSyncTextField.hasFocus)) {
                        // set default offset to '0' = 50%
                        subtitleSyncSlider.value = '50';
                        subtitleSyncTextField.textContent = '0s';
                        playbackManager.setSubtitleOffset(0, player);
                    }
                    // show subtitle sync
                    subtitleSyncContainer.classList.remove('hide');
                    return;
                }
            } else if (action === 'hide' && subtitleSyncTextField.hasFocus) {
                // do not hide if element has focus
                return;
            }

            subtitleSyncContainer.classList.add('hide');
        }
    }
}

export default SubtitleSync;
