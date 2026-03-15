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
        console.log('inside close button click');
        instance.toggle('forceToHide');
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

    /**
     * @param {'autoOsdHide' | 'autoOsdShow' | 'forceToHide' | 'forceToShow'} action 
     */
    toggle(action) {
        if (action === 'forceToHide'){
            this.opened = false;
            aspectRatioScaleContainer.classList.add('hide');
            return;
        }
        
        if (action === 'autoOsdHide'){
            aspectRatioScaleContainer.classList.add('hide');
            return;
        }

        if (action === 'forceToShow'){
            this.opened = true;
        }

        console.log('inside toggle', action, this.opened)

        const min = parseFloat(aspectRatioScaleSlider.min);
        const max = parseFloat(aspectRatioScaleSlider.max);

        // basically autoOsdShow won't display the element if the element has not been explicitly opened
        // since this.opened would be false
        // this helps solve for the case when a user starts a video, and the aspect ratio is set to "custom" from before
        if (player && playbackManager.getAspectRatio(player) === 'custom' && this.opened) {
            let currentScale = playbackManager.getAspectRatioCustomScale(player);
            currentScale = Math.max(min, Math.min(max, currentScale));
            aspectRatioScaleSlider.value = currentScale;
            aspectRatioScaleTextField.textContent = formatScale(currentScale);
            playbackManager.setAspectRatioCustomScale(currentScale, player);
            aspectRatioScaleContainer.classList.remove('hide');
        }
    }
}

export default AspectRatioScale;
