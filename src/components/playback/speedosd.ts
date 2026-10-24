import browser from '../../scripts/browser';
import dom from '../../utils/dom';
import Events from '../../utils/events';
import { playbackManager } from './playbackmanager';

import './speedosd.scss';

interface PlaybackPlayer {
    getPlaybackRate?: () => number | null;
}

let currentPlayer: PlaybackPlayer | null = null;
let osdElement: HTMLDivElement | null = null;
let textElement: HTMLSpanElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let enableAnimation = true;

function ensureOsdElement(): void {
    if (!osdElement) {
        enableAnimation = browser.supportsCssAnimation();

        const elem = document.createElement('div');
        elem.classList.add('hide', 'speedOsd', 'speedOsd-hidden');
        elem.innerHTML = '<span class="speedOsdText"></span>';

        textElement = elem.querySelector('.speedOsdText');
        document.body.appendChild(elem);
        osdElement = elem;
    }
}

function onHideComplete(this: HTMLElement): void {
    this.classList.add('hide');
}

function clearHideTimeout(): void {
    if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
    }
}

export function hideOsd(): void {
    clearHideTimeout();

    const elem = osdElement;
    if (elem) {
        if (enableAnimation) {
            if (elem.offsetHeight > 0) {
                // Trigger reflow
            }
            requestAnimationFrame(() => {
                elem.classList.add('speedOsd-hidden');
                dom.addEventListener(elem, dom.whichTransitionEvent(), onHideComplete, {
                    once: true
                });
            });
        } else {
            onHideComplete.call(elem);
        }
    }
}

export function showSpeedOsd(rate?: number | string | null): void {
    if (rate == null) {
        const current = currentPlayer?.getPlaybackRate ? currentPlayer.getPlaybackRate() : playbackManager.getPlaybackRate();
        if (current == null) {
            return;
        }
        rate = current;
    }

    const numRate = Number(rate);
    if (isNaN(numRate)) {
        return;
    }

    ensureOsdElement();
    clearHideTimeout();

    if (textElement) {
        textElement.textContent = `${numRate}x`;
    }

    const elem = osdElement;
    if (!elem) {
        return;
    }

    dom.removeEventListener(elem, dom.whichTransitionEvent(), onHideComplete, {
        once: true
    });

    elem.classList.remove('hide');
    if (elem.offsetHeight > 0) {
        // Trigger reflow
    }

    requestAnimationFrame(() => {
        elem.classList.remove('speedOsd-hidden');
        hideTimeout = setTimeout(hideOsd, 1000);
    });
}

function onRateChanged(this: unknown, _e?: unknown, newRate?: number): void {
    const player = this as PlaybackPlayer | undefined;
    const rate = newRate ?? (player?.getPlaybackRate ? player.getPlaybackRate() : null);
    showSpeedOsd(rate);
}

function releaseCurrentPlayer(): void {
    const player = currentPlayer;
    if (player) {
        Events.off(player, 'ratechange', onRateChanged);
        Events.off(player, 'playbackstop', hideOsd);
        currentPlayer = null;
    }
}

function bindToPlayer(player: PlaybackPlayer | null): void {
    if (player === currentPlayer) {
        return;
    }

    releaseCurrentPlayer();
    currentPlayer = player;

    if (!player) {
        return;
    }

    hideOsd();
    Events.on(player, 'ratechange', onRateChanged);
    Events.on(player, 'playbackstop', hideOsd);
}

Events.on(playbackManager, 'playerchange', () => {
    bindToPlayer(playbackManager.getCurrentPlayer());
});

Events.on(playbackManager, 'playbackratechange', (_e: unknown, _player: unknown, rate: number) => {
    showSpeedOsd(rate);
});

bindToPlayer(playbackManager.getCurrentPlayer());

export default {
    show: showSpeedOsd,
    hide: hideOsd
};
