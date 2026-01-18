import { playbackManager } from './playbackmanager';
import dom from '../../utils/dom';
import browser from '../../scripts/browser';
import Events from '../../utils/events';

import './iconosd.scss';
import 'material-design-icons-iconfont';

let currentPlayer;
let osdElement;
let iconElement;
let progressElement;

let enableAnimation;

function getOsdElementHtml() {
    let html = '';

    html += '<span class="material-icons iconOsdIcon brightness_high" aria-hidden="true"></span>';

    html += '<div class="iconOsdProgressOuter"><div class="iconOsdProgressInner brightnessOsdProgressInner"></div></div>';

    return html;
}

function ensureOsdElement() {
    let elem = osdElement;
    if (!elem) {
        enableAnimation = browser.supportsCssAnimation();

        elem = document.createElement('div');
        elem.classList.add('hide');
        elem.classList.add('iconOsd');
        elem.classList.add('iconOsd-hidden');
        elem.classList.add('brightnessOsd');
        elem.innerHTML = getOsdElementHtml();

        iconElement = elem.querySelector('.material-icons');
        progressElement = elem.querySelector('.iconOsdProgressInner');

        document.body.appendChild(elem);
        osdElement = elem;
    }
}

function onHideComplete() {
    this.classList.add('hide');
}

let hideTimeout;
function showOsd() {
    clearHideTimeout();

    const elem = osdElement;

    dom.removeEventListener(elem, dom.whichTransitionEvent(), onHideComplete, {
        once: true
    });

    elem.classList.remove('hide');

    // trigger reflow
    void elem.offsetWidth;

    requestAnimationFrame(() => {
        elem.classList.remove('iconOsd-hidden');

        hideTimeout = setTimeout(hideOsd, 3000);
    });
}

function clearHideTimeout() {
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
}

function hideOsd() {
    clearHideTimeout();

    const elem = osdElement;
    if (elem) {
        if (enableAnimation) {
            // trigger reflow
            void elem.offsetWidth;

            requestAnimationFrame(() => {
                elem.classList.add('iconOsd-hidden');

                dom.addEventListener(elem, dom.whichTransitionEvent(), onHideComplete, {
                    once: true
                });
            });
        } else {
            onHideComplete.call(elem);
        }
    }
}

function setIcon(iconHtmlElement, icon) {
    iconHtmlElement.classList.remove('brightness_high', 'brightness_medium', 'brightness_low');
    iconHtmlElement.classList.add(icon);
}

function updateElementsFromPlayer(brightness) {
    if (iconElement) {
        if (brightness >= 80) {
            setIcon(iconElement, 'brightness_high');
        } else if (brightness >= 20) {
            setIcon(iconElement, 'brightness_medium');
        } else {
            setIcon(iconElement, 'brightness_low');
        }
    }
    if (progressElement) {
        progressElement.style.width = (brightness || 0) + '%';
    }
}

function releaseCurrentPlayer() {
    const player = currentPlayer;

    if (player) {
        Events.off(player, 'brightnesschange', onBrightnessChanged);
        Events.off(player, 'playbackstop', hideOsd);
        currentPlayer = null;
    }
}

function onBrightnessChanged() {
    const player = this;

    ensureOsdElement();

    updateElementsFromPlayer(playbackManager.getBrightness(player));

    showOsd();
}

function bindToPlayer(player) {
    if (player === currentPlayer) {
        return;
    }

    releaseCurrentPlayer();

    currentPlayer = player;

    if (!player) {
        return;
    }

    hideOsd();
    Events.on(player, 'brightnesschange', onBrightnessChanged);
    Events.on(player, 'playbackstop', hideOsd);
}

Events.on(playbackManager, 'playerchange', () => {
    bindToPlayer(playbackManager.getCurrentPlayer());
});

bindToPlayer(playbackManager.getCurrentPlayer());
