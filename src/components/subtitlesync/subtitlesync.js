import { playbackManager } from '../playback/playbackmanager';
import layoutManager from '../layoutManager';
import template from './subtitlesync.template.html';
import './subtitlesync.scss';

// Constants
const DEFAULT_OFFSET = 0;

function createSliderBubbleHtml(_, value) {
    return '<h1 class="sliderBubbleText">'
        + (value > 0 ? '+' : '') + parseFloat(value) + 's'
        + '</h1>';
}

class OffsetController {
    constructor(player, slider, textField) {
        this.player = player;
        this.slider = slider;
        this.textField = textField;
        this.currentOffset = DEFAULT_OFFSET;

        this._initSlider();
        this._initTextField();
    }

    _initSlider() {
        const slider = this.slider;

        if (layoutManager.tv) {
            slider.classList.add('focusable');
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
                    textField.textContent = (playbackManager.getPlayerSubtitleOffset(this.player) || 0) + 's';
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
            // FIXME: TV layout will require special handling for navigation keys. But now field is not focusable
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

        // Create the offset controller
        this.offsetController = new OffsetController(
            this.player,
            this.subtitleSyncSlider,
            this.subtitleSyncTextField
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

    _tryShowSubtitleSync() {
        // if showing subtitle sync is enabled and if there is an external subtitle stream enabled
        if (!this._canShowSubtitleSync()) {
            this.subtitleSyncContainer.classList.add('hide');
            return;
        }

        // If no subtitle offset is defined or element has focus (offset being defined)
        if (!(playbackManager.getPlayerSubtitleOffset(this.player) || this.subtitleSyncTextField.hasFocus)) {
            // set default offset to '0' = 0ms
            this.subtitleSyncSlider.value = '0';
            this.subtitleSyncTextField.textContent = '0s';
            playbackManager.setSubtitleOffset(0, this.player);
        }

        // show subtitle sync
        this.subtitleSyncContainer.classList.remove('hide');
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
