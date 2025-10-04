import isEqual from 'lodash-es/isEqual';

import browser from '../../scripts/browser';
import dom from '../../utils/dom';
import layoutManager from '../../components/layoutManager';
import keyboardnavigation from '../../scripts/keyboardNavigation';
import './emby-slider.scss';
import 'webcomponents.js/webcomponents-lite';
import '../emby-input/emby-input';
import globalize from '../../lib/globalize';
import { decimalCount } from '../../utils/number';

const EmbySliderPrototype = Object.create(HTMLInputElement.prototype);

let supportsValueSetOverride = false;

if (Object.getOwnPropertyDescriptor && Object.defineProperty) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    // descriptor returning null in webos
    if (descriptor?.configurable) {
        supportsValueSetOverride = true;
    }
}

let supportsValueAutoSnap = false;
{
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '-30';
    slider.max = '30';
    slider.step = '0.1';

    slider.value = '0.30000000000000004';

    supportsValueAutoSnap = slider.value === '0.3';

    if (!supportsValueAutoSnap) {
        console.debug('[EmbySlider] HTMLInputElement doesn\'t snap value - use workaround.');
    }
}

/**
 * Returns normalized slider step.
 *
 * @param {HTMLInputElement} range slider itself
 * @param {number|undefined} step step
 * @returns {number} normalized slider step.
 */
function normalizeSliderStep(range, step) {
    if (step > 0) {
        return step;
    }

    step = parseFloat(range.step);

    if (step > 0) {
        return step;
    }

    return 1;
}

/**
     * Returns slider fraction corresponding to client position.
     *
     * @param {Object} range slider itself
     * @param {number} clientX client X-coordinate
     * @return {number} slider fraction
     */
function mapClientToFraction(range, clientX) {
    const rect = range.sliderBubbleTrack.getBoundingClientRect();

    let fraction = (clientX - rect.left) / rect.width;
    if (globalize.getIsElementRTL(range)) {
        fraction = (rect.right - clientX) / rect.width;
    }

    // Snap to step
    const valueRange = range.max - range.min;
    if (range.step !== 'any' && valueRange !== 0) {
        const step = normalizeSliderStep(range) / valueRange;
        fraction = Math.round(fraction / step) * step;
    }

    return Math.min(Math.max(fraction, 0), 1);
}

/**
     * Returns slider value corresponding to slider fraction.
     *
     * @param {Object} range slider itself
     * @param {number} fraction slider fraction
     * @return {number} slider value
     */
function mapFractionToValue(range, fraction) {
    let value = (range.max - range.min) * fraction;

    let decimals = null;

    // Snap to step
    if (range.step !== 'any') {
        const step = normalizeSliderStep(range);
        decimals = decimalCount(step);
        value = Math.round(value / step) * step;
    }

    const min = parseFloat(range.min);

    value += min;

    if (decimals != null) {
        decimals = Math.max(decimals, decimalCount(min));
        value = parseFloat(value.toFixed(decimals));
    }

    return Math.min(Math.max(value, range.min), range.max);
}

/**
     * Returns slider fraction corresponding to slider value.
     *
     * @param {Object} range slider itself
     * @param {number} value slider value (snapped to step)
     * @return {number} slider fraction
     */
function mapValueToFraction(range, value) {
    const valueRange = range.max - range.min;
    const fraction = valueRange !== 0 ? (value - range.min) / valueRange : 0;
    return Math.min(Math.max(fraction, 0), 1);
}

/**
 * Returns value snapped to the slider step.
 *
 * @param {HTMLInputElement} range slider itself
 * @param {number} value slider value
 * @return {number} value snapped to the slider step
 */
function snapValue(range, value) {
    if (range.step !== 'any') {
        const min = parseFloat(range.min);
        const step = normalizeSliderStep(range);
        const decimals = Math.max(decimalCount(min), decimalCount(step));

        value -= min;
        value = Math.round(value / step) * step;
        value += min;

        value = parseFloat(value.toFixed(decimals));
    }

    return value;
}

/**
     * Updates progress bar.
     *
     * @param {boolean} [isValueSet] update by 'valueset' event or by timer
     */
function updateValues(isValueSet) {
    if (!!isValueSet && !supportsValueAutoSnap) {
        const value = snapValue(this, parseFloat(this.value)).toString();

        // eslint-disable-next-line sonarjs/different-types-comparison
        if (this.value !== value) {
            this.value = value;

            if (supportsValueSetOverride) return;
        }
    }

    // Do not update values by 'valueset' in case of soft-implemented dragging
    if (!!isValueSet && (!!this.keyboardDragging || !!this.touched)) {
        return;
    }

    const range = this;
    const value = range.value;

    // put this on a callback. Doing it within the event sometimes causes the slider to get hung up and not respond
    // Keep only one per slider frame request
    cancelAnimationFrame(range.updateValuesFrame);
    range.updateValuesFrame = requestAnimationFrame(function () {
        const backgroundLower = range.backgroundLower;

        if (backgroundLower) {
            let fraction = (value - range.min) / (range.max - range.min);

            fraction *= 100;
            backgroundLower.style.width = fraction + '%';
        }

        if (range.markerContainerElement) {
            updateMarkers(range, value);
        }
    });
}

function updateBubble(range, percent, value, bubble) {
    requestAnimationFrame(function () {
        const bubbleTrackRect = range.sliderBubbleTrack.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();

        let bubblePos = bubbleTrackRect.width * percent / 100;
        if (globalize.getIsElementRTL(range)) {
            bubblePos = bubbleTrackRect.width - bubblePos;
        }
        bubblePos = Math.min(Math.max(bubblePos, bubbleRect.width / 2), bubbleTrackRect.width - bubbleRect.width / 2);

        bubble.style.left = bubblePos + 'px';

        let html;

        if (range.updateBubbleHtml?.(bubble, value)) {
            return;
        }

        if (range.getBubbleHtml) {
            html = range.getBubbleHtml(percent, value);
        } else {
            if (range.getBubbleText) {
                html = range.getBubbleText(percent, value);
            } else {
                html = value.toLocaleString();
            }
            html = '<h1 class="sliderBubbleText">' + html + '</h1>';
        }

        bubble.innerHTML = html;
    });
}

function setMarker(range, valueMarker, marker, valueProgress) {
    requestAnimationFrame(function () {
        const bubbleTrackRect = range.sliderBubbleTrack.getBoundingClientRect();
        const markerRect = marker.getBoundingClientRect();

        if (!bubbleTrackRect.width || !markerRect.width) {
            // width is not set, most probably because the OSD is currently hidden
            return;
        }

        marker.style.left = `calc(${valueMarker}% - ${markerRect.width / 2}px)`;

        if (valueProgress >= valueMarker) {
            marker.classList.remove('unwatched');
            marker.classList.add('watched');
        } else {
            marker.classList.add('unwatched');
            marker.classList.remove('watched');
        }
    });
}

function updateMarkers(range, currentValue) {
    if (range.getMarkerInfo) {
        const newMarkerInfo = range.getMarkerInfo();

        if (!range.markerInfo || !isEqual(range.markerInfo, newMarkerInfo)) {
            range.markerInfo = newMarkerInfo;

            let markersHtml = '';
            range.markerInfo.forEach(() => {
                markersHtml += '<span class="sliderMarker" aria-hidden="true"></span>';
            });
            range.markerContainerElement.innerHTML = markersHtml;

            range.markerElements = range.markerContainerElement.querySelectorAll('.sliderMarker');
        }
    }

    if (range.markerInfo?.length && range.markerElements?.length) {
        for (let i = 0, length = range.markerElements.length; i < length; i++) {
            if (range.markerInfo.length > i) {
                setMarker(range, mapFractionToValue(range, range.markerInfo[i].progress), range.markerElements[i], currentValue);
            }
        }
    }
}

EmbySliderPrototype.attachedCallback = function () {
    if (this.dataset.embySlider === 'true') {
        return;
    }

    this.dataset.embyslider = 'true';

    this.classList.add('mdl-slider');
    this.classList.add('mdl-js-slider');

    if (browser.edge) {
        this.classList.add('slider-browser-edge');
    }
    if (!layoutManager.mobile) {
        this.classList.add('mdl-slider-hoverthumb');
    }
    if (layoutManager.tv) {
        this.classList.add('show-focus');
    }

    const topContainer = dom.parentWithClass(this, 'sliderContainer-settings');

    if (topContainer && this.getAttribute('label')) {
        const label = this.ownerDocument.createElement('label');
        label.innerText = this.getAttribute('label');
        label.classList.add('sliderLabel');
        label.htmlFor = this.id;
        topContainer.insertBefore(label, topContainer.firstChild);
    }

    const containerElement = this.parentNode;
    containerElement.classList.add('mdl-slider-container');

    let htmlToInsert = '';

    htmlToInsert += '<div class="mdl-slider-background-flex-container">';
    htmlToInsert += '<div class="mdl-slider-background-flex">';
    htmlToInsert += '<div class="mdl-slider-background-flex-inner">';

    // the more of these, the more ranges we can display
    htmlToInsert += '<div class="mdl-slider-background-upper"></div>';

    htmlToInsert += '<div class="mdl-slider-background-lower"></div>';

    htmlToInsert += '</div>';
    htmlToInsert += '</div>';
    htmlToInsert += '</div>';

    htmlToInsert += '<div class="sliderBubbleTrack"><div class="sliderBubble hide"></div></div>';

    containerElement.insertAdjacentHTML('beforeend', htmlToInsert);

    this.sliderBubbleTrack = containerElement.querySelector('.sliderBubbleTrack');
    this.backgroundLower = containerElement.querySelector('.mdl-slider-background-lower');
    this.backgroundUpper = containerElement.querySelector('.mdl-slider-background-upper');
    const sliderBubble = containerElement.querySelector('.sliderBubble');

    let hasHideBubbleClass = sliderBubble.classList.contains('hide');

    this.markerContainerElement = containerElement.querySelector('.sliderMarkerContainer');

    dom.addEventListener(this, 'input', function () {
        this.dragging = true;

        if (this.dataset.sliderKeepProgress !== 'true') {
            updateValues.call(this);
        }

        const percent = mapValueToFraction(this, this.value) * 100;
        updateBubble(this, percent, parseFloat(this.value), sliderBubble);

        if (hasHideBubbleClass) {
            sliderBubble.classList.remove('hide');
            hasHideBubbleClass = false;
        }
    }, {
        passive: true
    });

    dom.addEventListener(this, 'change', function () {
        this.dragging = false;

        if (this.dataset.sliderKeepProgress === 'true') {
            updateValues.call(this);
        }

        sliderBubble.classList.add('hide');
        hasHideBubbleClass = true;
    }, {
        passive: true
    });

    /* eslint-disable-next-line compat/compat */
    dom.addEventListener(this, (window.PointerEvent ? 'pointermove' : 'mousemove'), function (e) {
        if (!this.dragging) {
            const fraction = mapClientToFraction(this, e.clientX);
            const percent = fraction * 100;
            const value = mapFractionToValue(this, fraction);

            updateBubble(this, percent, value, sliderBubble);

            if (hasHideBubbleClass) {
                sliderBubble.classList.remove('hide');
                hasHideBubbleClass = false;
            }
        }
    }, {
        passive: true
    });

    /* eslint-disable-next-line compat/compat */
    dom.addEventListener(this, (window.PointerEvent ? 'pointerleave' : 'mouseleave'), function () {
        sliderBubble.classList.add('hide');
        hasHideBubbleClass = true;
    }, {
        passive: true
    });

    // HACK: iPhone/iPad do not change input by touch
    if (browser.iOS) {
        dom.addEventListener(this, 'touchstart', function (e) {
            if (e.targetTouches.length !== 1) {
                return;
            }

            this.touched = true;

            const fraction = mapClientToFraction(this, e.targetTouches[0].clientX);
            this.value = mapFractionToValue(this, fraction);

            this.dispatchEvent(new Event('input', {
                bubbles: true,
                cancelable: false
            }));

            // Prevent 'pointermove' and 'click' after 'touch*'
            // FIXME: Still have some 'pointermove' and 'click' that bypass 'touchstart'
            e.preventDefault();
        }, {
            capture: true
        });

        dom.addEventListener(this, 'touchmove', function (e) {
            if (!this.touched || e.targetTouches.length !== 1) {
                return;
            }

            const fraction = mapClientToFraction(this, e.targetTouches[0].clientX);
            this.value = mapFractionToValue(this, fraction);

            this.dispatchEvent(new Event('input', {
                bubbles: true,
                cancelable: false
            }));
        }, {
            passive: true
        });

        dom.addEventListener(this, 'touchend', function () {
            const range = this;

            setTimeout(function () {
                range.touched = false;

                range.dispatchEvent(new Event('change', {
                    bubbles: true,
                    cancelable: false
                }));
            }, 0);
        }, {
            passive: true
        });
    }

    if (supportsValueSetOverride) {
        this.addEventListener('valueset', updateValues.bind(this, true));
    } else {
        startInterval(this);
    }

    updateValues.call(this);
};

/**
     * Keyboard dragging timeout.
     * After this delay "change" event will be fired.
     */
const KeyboardDraggingTimeout = 1000;

/**
     * Keyboard dragging timer.
     */
let keyboardDraggingTimer;

/**
     * Start keyboard dragging.
     *
     * @param {Object} elem slider itself
     */
function startKeyboardDragging(elem) {
    elem.keyboardDragging = true;

    clearTimeout(keyboardDraggingTimer);
    keyboardDraggingTimer = setTimeout(function () {
        finishKeyboardDragging(elem);
    }, KeyboardDraggingTimeout);
}

/**
     * Finish keyboard dragging.
     *
     * @param {Object} elem slider itself
     */
function finishKeyboardDragging(elem) {
    clearTimeout(keyboardDraggingTimer);
    keyboardDraggingTimer = undefined;

    elem.keyboardDragging = false;

    const event = new Event('change', {
        bubbles: true,
        cancelable: false
    });
    elem.dispatchEvent(event);
}

/**
     * Do step by delta.
     *
     * @param {Object} elem slider itself
     * @param {number} delta step amount
     */
function stepKeyboard(elem, delta) {
    startKeyboardDragging(elem);

    elem.value = parseFloat(elem.value) + delta;

    const event = new Event('input', {
        bubbles: true,
        cancelable: false
    });
    elem.dispatchEvent(event);
}

/**
     * Handle KeyDown event
     */
function onKeyDown(e) {
    switch (keyboardnavigation.getKeyName(e)) {
        case 'ArrowLeft':
        case 'Left':
            stepKeyboard(this, -normalizeSliderStep(this, this.keyboardStepDown));
            e.preventDefault();
            e.stopPropagation();
            break;
        case 'ArrowRight':
        case 'Right':
            stepKeyboard(this, normalizeSliderStep(this, this.keyboardStepUp));
            e.preventDefault();
            e.stopPropagation();
            break;
        case 'Enter':
            if (this.keyboardDragging) {
                finishKeyboardDragging(this);
                e.preventDefault();
                e.stopPropagation();
            }
            break;
    }
}

/**
     * Enable keyboard dragging.
     */
EmbySliderPrototype.enableKeyboardDragging = function () {
    if (!this.keyboardDraggingEnabled) {
        this.addEventListener('keydown', onKeyDown);
        this.keyboardDraggingEnabled = true;
    }
};

/**
     * Set steps for keyboard input.
     *
     * @param {number} stepDown step to reduce
     * @param {number} stepUp step to increase
     */
EmbySliderPrototype.setKeyboardSteps = function (stepDown, stepUp) {
    this.keyboardStepDown = stepDown || stepUp || 1;
    this.keyboardStepUp = stepUp || stepDown || 1;
};

function setRange(elem, startPercent, endPercent) {
    const style = elem.style;
    if (globalize.getIsRTL()) {
        style.right = Math.max(startPercent, 0) + '%';
    } else {
        style.left = Math.max(startPercent, 0) + '%';
    }

    const widthPercent = endPercent - startPercent;
    style.width = Math.max(Math.min(widthPercent, 100), 0) + '%';
}

function mapRangesFromRuntimeToPercent(ranges, runtime) {
    if (!runtime) {
        return [];
    }

    return ranges.map(function (r) {
        return {
            start: (r.start / runtime) * 100,
            end: (r.end / runtime) * 100
        };
    });
}

EmbySliderPrototype.setBufferedRanges = function (ranges, runtime, position) {
    const elem = this.backgroundUpper;
    if (!elem) {
        return;
    }

    if (runtime != null) {
        ranges = mapRangesFromRuntimeToPercent(ranges, runtime);

        position = (position / runtime) * 100;
    }

    for (const range of ranges) {
        if (position != null && position >= range.end) {
            continue;
        }

        setRange(elem, range.start, range.end);
        return;
    }

    setRange(elem, 0, 0);
};

EmbySliderPrototype.setIsClear = function (isClear) {
    const backgroundLower = this.backgroundLower;
    if (backgroundLower) {
        if (isClear) {
            backgroundLower.classList.add('mdl-slider-background-lower-clear');
        } else {
            backgroundLower.classList.remove('mdl-slider-background-lower-clear');
        }
    }
};

function startInterval(range) {
    const interval = range.interval;
    if (interval) {
        clearInterval(interval);
    }
    range.interval = setInterval(updateValues.bind(range, true), 100);
}

EmbySliderPrototype.detachedCallback = function () {
    const interval = this.interval;
    if (interval) {
        clearInterval(interval);
    }
    this.interval = null;
    this.backgroundUpper = null;
    this.backgroundLower = null;
};

document.registerElement('emby-slider', {
    prototype: EmbySliderPrototype,
    extends: 'input'
});

