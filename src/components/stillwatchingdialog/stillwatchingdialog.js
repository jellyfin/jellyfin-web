import dom from '../../scripts/dom';
import { playbackManager } from '../playback/playbackmanager';
import { appRouter } from '../router/appRouter';
import Events from '../../utils/events.ts';
import layoutManager from '../layoutManager';
import focusManager from '../focusManager';
import globalize from '../../lib/globalize';
import itemHelper from '../itemHelper';
import './stillwatchingdialog.scss';
import '../../elements/emby-button/emby-button';
import '../../styles/flexstyles.scss';
import { TICKS_PER_MILLISECOND } from 'constants/time';

const transitionEndEventName = dom.whichTransitionEvent();
const COUNTDOWN_TEXT_INTERVAL = 500; // milliseconds

function getHtml() {
    let html = '';

    html += '<div class="flex flex-direction-column flex-grow">';

    html += '<h2 class="stillWatchingDialog-stillWatchingText" style="margin:.25em 0;">';
    html += globalize.translate('StillWatchingPrompt');
    html += '</h2>';

    html += '<h3 class="stillWatchingDialog-playbackEnds" style="margin:.25em 0 .5em;">';
    html += `${globalize.translate('PlaybackEndsIn')}: `;
    html += '<span class="stillWatchingDialog-countdownText"></span>';
    html += '</h3>';

    html += '<span class="flex flex-direction-row stillWatchingDialog-nextEpisode">';
    html += '</span>';

    html += '<div class="flex flex-direction-row stillWatchingDialog-buttons" style="margin-top:1em;">';

    html += '<button type="button" is="emby-button" class="raised raised-mini btnNo stillWatchingDialog-button">';
    html += globalize.translate('No');
    html += '</button>';

    html += '<button type="button" is="emby-button" class="raised raised-mini btnYes stillWatchingDialog-button">';
    html += globalize.translate('Yes');
    html += '</button>';

    // buttons
    html += '</div>';

    // main
    html += '</div>';

    return html;
}

function setCountdownText () {
    const instance = this;
    const elem = instance.options.parent;

    const secondsRemaining = Math.max(Math.round(getTimeRemainingMs(instance) / 1000), 0);

    elem.querySelector('.stillWatchingDialog-countdownText').textContent = globalize.translate('HeaderSecondsValue', secondsRemaining);
}

function setNextEpisodeText (item) {
    const instance = this;

    const elem = instance.options.parent;

    let title = itemHelper.getDisplayName(item);
    if (item.SeriesName) {
        title = item.SeriesName + ' - ' + title;
    }

    elem.querySelector('.stillWatchingDialog-nextEpisode').textContent = `${globalize.translate('HeaderNextEpisode')}: ${title}`;
}

function clearCountdownTextTimeout(instance) {
    if (instance._countdownTextTimeout) {
        clearInterval(instance._countdownTextTimeout);
        instance._countdownTextTimeout = null;
    }
}

async function onStillWatchingClick() {
    const options = this.options;

    if (options) {
        const player = options.player;

        await this.hide();

        playbackManager.nextTrack(player);
    }
}

function goBack () {
    appRouter.back();
}

async function init(instance, options) {
    options.parent.innerHTML = getHtml();

    options.parent.classList.add('hide');
    options.parent.classList.add('stillWatchingDialog');
    options.parent.classList.add('stillWatchingDialog-hidden');

    setNextEpisodeText.call(instance, options.nextItem);

    options.parent.querySelector('.btnNo').addEventListener('click', goBack.bind(instance));
    options.parent.querySelector('.btnYes').addEventListener('click', onStillWatchingClick.bind(instance));

    instance.show();
}

function clearHideAnimationEventListeners(instance, elem) {
    const fn = instance._onHideAnimationComplete;

    if (fn) {
        dom.removeEventListener(elem, transitionEndEventName, fn, {
            once: true
        });
    }
}

function onHideAnimationComplete(e) {
    const instance = this;
    const elem = e.target;

    elem.classList.add('hide');

    clearHideAnimationEventListeners(instance, elem);
    Events.trigger(instance, 'hide');
}

async function hideStillWatching() {
    const instance = this;
    clearCountdownTextTimeout(this);

    if (!instance.options) {
        return;
    }

    const elem = instance.options.parent;

    if (!elem) {
        return;
    }

    clearHideAnimationEventListeners(this, elem);

    if (elem.classList.contains('stillWatchingDialog-hidden')) {
        return;
    }

    const fn = onHideAnimationComplete.bind(instance);
    instance._onHideAnimationComplete = fn;

    const transitionEvent = await new Promise((resolve) => {
        dom.addEventListener(elem, transitionEndEventName, resolve, {
            once: true
        });

        // trigger a reflow to force it to animate again
        void elem.offsetWidth;

        elem.classList.add('stillWatchingDialog-hidden');
    });

    instance._onHideAnimationComplete(transitionEvent);
}

function getTimeRemainingMs(instance) {
    const options = instance.options;
    if (options) {
        const runtimeTicks = playbackManager.duration(options.player);

        if (runtimeTicks) {
            const timeRemainingTicks = runtimeTicks - playbackManager.currentTime(options.player) * TICKS_PER_MILLISECOND;

            return Math.round(timeRemainingTicks / TICKS_PER_MILLISECOND);
        }
    }

    return 0;
}

function startPlaybackEndingTimer(instance) {
    const timeRemainingMs = getTimeRemainingMs(instance);

    if (timeRemainingMs <= 0) {
        return;
    }

    setCountdownText.call(instance);
    clearCountdownTextTimeout(instance);

    instance._countdownTextTimeout = setInterval(setCountdownText.bind(instance), COUNTDOWN_TEXT_INTERVAL);
}

class StillWatchingDialog {
    constructor(options) {
        this.options = options;

        init(this, options);
    }

    show() {
        const elem = this.options.parent;

        clearHideAnimationEventListeners(this, elem);

        elem.classList.remove('hide');

        // trigger a reflow to force it to animate again
        void elem.offsetWidth;

        elem.classList.remove('stillWatchingDialog-hidden');

        if (layoutManager.tv) {
            setTimeout(function () {
                focusManager.focus(elem.querySelector('.btnNo'));
            }, 50);
        }

        startPlaybackEndingTimer(this);
    }

    async hide() {
        await hideStillWatching.bind(this)();
    }

    destroy() {
        hideStillWatching.call(this);

        playbackManager._idleManager.resetSession();
        this.options = null;
        this.itemType = null;
    }
}

export default StillWatchingDialog;
