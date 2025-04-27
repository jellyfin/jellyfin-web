import { playbackManager } from '../playback/playbackmanager';
import template from './customplaybackrate.template.html';
import './customplaybackrate.scss';

let player;
let rateInputField;
let closeButton;
let container;

function init(instance) {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    parent.innerHTML = template;

    rateInputField = parent.querySelector('.customPlaybackRateInput');
    closeButton = parent.querySelector('.customPlaybackRate-closeButton');
    container = parent.querySelector('.customPlaybackRateContainer');

    container.classList.add('hide');

    rateInputField.value = '1.0';
    rateInputField.hasFocus = false;

    rateInputField.addEventListener('click', function () {
        this.hasFocus = true;
    });

    rateInputField.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const value = parseFloat(this.value);
            if (!isNaN(value) && value >= 0.1 && value <= 10) {
                playbackManager.setPlaybackRate(value, player);
                CustomPlaybackRate.prototype.toggle('forceToHide');
            } else {
                alert('Enter a number between 0.1 and 10');
            }
            this.hasFocus = false;
            event.preventDefault();
        } else {
            this.hasFocus = true;
            if (!event.key.match(/[\d.]|Backspace|ArrowLeft|ArrowRight|Delete/)) {
                event.preventDefault();
            }
        }
        event.stopPropagation();
    });

    closeButton.addEventListener('click', function () {
        const value = parseFloat(rateInputField.value);
        if (!isNaN(value) && value >= 0.1 && value <= 10) {
            playbackManager.setPlaybackRate(value, player);
        } else {
            alert('Enter a valid number between 0.1 and 10');
        }

        CustomPlaybackRate.prototype.toggle('forceToHide');
    });

    instance.element = parent;
}

class CustomPlaybackRate {
    constructor(currentPlayer) {
        player = currentPlayer;
        init(this);
    }

    destroy() {
        CustomPlaybackRate.prototype.toggle('forceToHide');
        const elem = this.element;
        if (elem) {
            elem.parentNode.removeChild(elem);
            this.element = null;
        }
    }

    toggle(action) {
        if (action && action === 'forceToHide') {
            container.classList.add('hide');
            return;
        }

        const currentRate = playbackManager.getPlaybackRate(player);
        rateInputField.value = currentRate;

        container.classList.remove('hide');
        rateInputField.focus();
    }
}

export default CustomPlaybackRate;
