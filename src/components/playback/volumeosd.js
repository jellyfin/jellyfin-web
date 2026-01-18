
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

    html += '<span class="material-icons iconOsdIcon volume_up" aria-hidden="true"></span>';

    html += '<div class="iconOsdProgressOuter"><div class="iconOsdProgressInner"></div></div>';

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
        elem.classList.add('volumeOsd');
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

function updatePlayerVolumeState(isMuted, volume) {
    if (iconElement) {
        iconElement.classList.remove('volume_off', 'volume_up');
        iconElement.classList.add(isMuted ? 'volume_off' : 'volume_up');
    }
    if (progressElement) {
        progressElement.style.width = (volume || 0) + '%';
    }
}

function releaseCurrentPlayer() {
    const player = currentPlayer;

    if (player) {
        Events.off(player, 'volumechange', onVolumeChanged);
        Events.off(player, 'playbackstop', hideOsd);
        currentPlayer = null;
    }
}

function onVolumeChanged() {
    const player = this;

    ensureOsdElement();

    updatePlayerVolumeState(player.isMuted(), player.getVolume());

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
    Events.on(player, 'volumechange', onVolumeChanged);
    Events.on(player, 'playbackstop', hideOsd);
}

Events.on(playbackManager, 'playerchange', () => {
    bindToPlayer(playbackManager.getCurrentPlayer());
});

bindToPlayer(playbackManager.getCurrentPlayer());
