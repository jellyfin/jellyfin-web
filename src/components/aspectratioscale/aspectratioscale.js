import { playbackManager } from '../playback/playbackmanager';
import layoutManager from '../layoutManager';
import template from './aspectratioscale.template.html';
import './aspectratioscale.scss';

let player;
let aspectRatioScaleSlider;
let aspectRatioScaleTextField;
let aspectRatioScaleCloseButton;
let aspectRatioScaleContainer;

function formatScale(value) {
    return Number(value).toFixed(2);
}

function init(instance) {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    parent.innerHTML = template;

    aspectRatioScaleSlider = parent.querySelector('.aspectRatioScaleSlider');
    aspectRatioScaleTextField = parent.querySelector('.aspectRatioScaleTextField');
    aspectRatioScaleCloseButton = parent.querySelector('.aspectRatioScale-closeButton');
    aspectRatioScaleContainer = parent.querySelector('.aspectRatioScaleContainer');

    if (layoutManager.tv) {
        aspectRatioScaleSlider.classList.add('focusable');
        setTimeout(function () {
            aspectRatioScaleSlider.enableKeyboardDragging();
        }, 0);
    }

    aspectRatioScaleContainer.classList.add('hide');

    aspectRatioScaleTextField.updateScale = function (scale) {
        this.textContent = formatScale(scale);
    };

    function updateAspectRatioScale() {
        const value = parseFloat(aspectRatioScaleSlider.value);
        playbackManager.setAspectRatioCustomScale(value, player);
        aspectRatioScaleTextField.updateScale(value);
    }

    aspectRatioScaleSlider.updateScale = function (sliderValue) {
        const scale = sliderValue === undefined ? 1 : sliderValue;
        this.value = scale;
        updateAspectRatioScale();
    };

    aspectRatioScaleSlider.addEventListener('input', () => updateAspectRatioScale());
    aspectRatioScaleSlider.addEventListener('change', () => updateAspectRatioScale());

    aspectRatioScaleSlider.getBubbleHtml = function (_, value) {
        return '<h1 class="sliderBubbleText">' + formatScale(value) + '</h1>';
    };

    aspectRatioScaleCloseButton.addEventListener('click', function () {
        AspectRatioScale.prototype.toggle('forceToHide');
    });

    instance.element = parent;
}

class AspectRatioScale {
    constructor(currentPlayer) {
        player = currentPlayer;
        this.opened = false;
        init(this);
    }

    destroy() {
        AspectRatioScale.prototype.toggle('forceToHide');
        const elem = this.element;
        if (elem) {
            elem.parentNode.removeChild(elem);
            this.element = null;
        }
    }

    toggle(action) {
        console.log('toggle', action);
        if (action && !['hide', 'forceToHide'].includes(action)) {
            return;
        }

        const min = parseFloat(aspectRatioScaleSlider.min);
        const max = parseFloat(aspectRatioScaleSlider.max);

        if (player && playbackManager.getAspectRatio(player) === 'custom') {
            if (!action) {
                let currentScale = playbackManager.getAspectRatioCustomScale(player);
                currentScale = Math.max(min, Math.min(max, currentScale));
                aspectRatioScaleSlider.value = currentScale;
                aspectRatioScaleTextField.textContent = formatScale(currentScale);
                playbackManager.setAspectRatioCustomScale(currentScale, player);
                aspectRatioScaleContainer.classList.remove('hide');
                return;
            }
            aspectRatioScaleContainer.classList.add('hide');
        } else if (action) {
            aspectRatioScaleContainer.classList.add('hide');
        }
    }
}

export default AspectRatioScale;
