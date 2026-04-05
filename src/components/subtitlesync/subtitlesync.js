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

        this.#initSlider();
        this.#initTextField();

        // Set initial offset
        this.reset();
    }

    get currentOffset() {
        return parseFloat(this.slider.value);
    }

    set currentOffset(value) {
        this.slider.value = value.toString();

        // rely on slider value trimming
        value = this.currentOffset;

        playbackManager.setSubtitleOffset(value, this.player);
        this.textField.updateOffset(value);
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
                    inputOffset = parseFloat(inputOffset[0]);
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

        // Create the offset controller
        this.offsetController = new OffsetController(
            this.player,
            this.subtitleSyncSlider,
            this.subtitleSyncTextField
        );
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
            this.#tryShowSubtitleSync();
        } else if (action === 'hide' && this.subtitleSyncTextField.hasFocus) {
            // do not hide if element has focus
            return;
        } else {
            this.subtitleSyncContainer.classList.add('hide');
        }
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
