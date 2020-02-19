define(['browser', 'dom', 'layoutManager', 'keyboardnavigation', 'css!./emby-slider', 'registerElement', 'emby-input'], function (browser, dom, layoutManager, keyboardnavigation) {
    'use strict';

    var EmbySliderPrototype = Object.create(HTMLInputElement.prototype);

    var supportsValueSetOverride = false;

    var enableWidthWithTransform;

    if (Object.getOwnPropertyDescriptor && Object.defineProperty) {

        var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        // descriptor returning null in webos
        if (descriptor && descriptor.configurable) {
            supportsValueSetOverride = true;
        }
    }

    /**
     * Returns slider fraction corresponding to client position.
     *
     * @param {Object} range slider itself
     * @param {number} clientX client X-coordinate
     * @return {number} slider fraction
     */
    function mapClientToFraction(range, clientX) {
        var rect = range.sliderBubbleTrack.getBoundingClientRect();

        var fraction = (clientX - rect.left) / rect.width;

        // Snap to step
        var valueRange = range.max - range.min;
        if (range.step !== 'any' && valueRange !== 0) {
            var step = (range.step || 1) / valueRange;
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
        var value = (range.max - range.min) * fraction;

        // Snap to step
        if (range.step !== 'any') {
            var step = range.step || 1;
            value = Math.round(value / step) * step;
        }

        value += parseFloat(range.min);

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
        var valueRange = range.max - range.min;
        var fraction = valueRange !== 0 ? (value - range.min) / valueRange : 0;
        return Math.min(Math.max(fraction, 0), 1);
    }

    /**
     * Updates progress bar.
     *
     * @param {boolean} [isValueSet] update by 'valueset' event or by timer
     */
    function updateValues(isValueSet) {

        // Do not update values by 'valueset' in case of soft-implemented dragging
        if (!!isValueSet && (!!this.keyboardDragging || !!this.touched)) {
            return;
        }

        var range = this;
        var value = range.value;

        // put this on a callback. Doing it within the event sometimes causes the slider to get hung up and not respond
        // Keep only one per slider frame request
        cancelAnimationFrame(range.updateValuesFrame);
        range.updateValuesFrame = requestAnimationFrame(function () {

            var backgroundLower = range.backgroundLower;

            if (backgroundLower) {
                var fraction = (value - range.min) / (range.max - range.min);

                if (enableWidthWithTransform) {
                    backgroundLower.style.transform = 'scaleX(' + (fraction) + ')';
                } else {
                    fraction *= 100;
                    backgroundLower.style.width = fraction + '%';
                }
            }
        });
    }

    function updateBubble(range, value, bubble, bubbleText) {

        requestAnimationFrame(function () {
            var bubbleTrackRect = range.sliderBubbleTrack.getBoundingClientRect();
            var bubbleRect = bubble.getBoundingClientRect();

            var bubblePos = bubbleTrackRect.width * value / 100;
            bubblePos = Math.min(Math.max(bubblePos, bubbleRect.width / 2), bubbleTrackRect.width - bubbleRect.width / 2);

            bubble.style.left = bubblePos + 'px';

            if (range.getBubbleHtml) {
                value = range.getBubbleHtml(value);
            } else {
                if (range.getBubbleText) {
                    value = range.getBubbleText(value);
                } else {
                    value = mapFractionToValue(range, value / 100).toLocaleString();
                }
                value = '<h1 class="sliderBubbleText">' + value + '</h1>';
            }

            bubble.innerHTML = value;
        });
    }

    EmbySliderPrototype.attachedCallback = function () {

        if (this.getAttribute('data-embyslider') === 'true') {
            return;
        }

        if (enableWidthWithTransform == null) {
            //enableWidthWithTransform = browser.supportsCssAnimation();
        }

        this.setAttribute('data-embyslider', 'true');

        this.classList.add('mdl-slider');
        this.classList.add('mdl-js-slider');

        if (browser.noFlex) {
            this.classList.add('slider-no-webkit-thumb');
        }
        if (browser.edge || browser.msie) {
            this.classList.add('slider-browser-edge');
        }
        if (!layoutManager.mobile) {
            this.classList.add('mdl-slider-hoverthumb');
        }
        if (layoutManager.tv) {
            this.classList.add('show-focus');
        }

        var containerElement = this.parentNode;
        containerElement.classList.add('mdl-slider-container');

        var htmlToInsert = '';

        htmlToInsert += '<div class="mdl-slider-background-flex-container">';
        htmlToInsert += '<div class="mdl-slider-background-flex">';
        htmlToInsert += '<div class="mdl-slider-background-flex-inner">';

        // the more of these, the more ranges we can display
        htmlToInsert += '<div class="mdl-slider-background-upper"></div>';

        if (enableWidthWithTransform) {
            htmlToInsert += '<div class="mdl-slider-background-lower mdl-slider-background-lower-withtransform"></div>';
        } else {
            htmlToInsert += '<div class="mdl-slider-background-lower"></div>';
        }

        htmlToInsert += '</div>';
        htmlToInsert += '</div>';
        htmlToInsert += '</div>';

        htmlToInsert += '<div class="sliderBubbleTrack"><div class="sliderBubble hide"></div></div>';

        containerElement.insertAdjacentHTML('beforeend', htmlToInsert);

        this.sliderBubbleTrack = containerElement.querySelector('.sliderBubbleTrack');
        this.backgroundLower = containerElement.querySelector('.mdl-slider-background-lower');
        this.backgroundUpper = containerElement.querySelector('.mdl-slider-background-upper');
        var sliderBubble = containerElement.querySelector('.sliderBubble');

        var hasHideClass = sliderBubble.classList.contains('hide');

        dom.addEventListener(this, 'input', function (e) {
            this.dragging = true;

            if (this.dataset.sliderKeepProgress !== 'true') {
                updateValues.call(this);
            }

            var bubbleValue = mapValueToFraction(this, this.value) * 100;
            updateBubble(this, bubbleValue, sliderBubble);

            if (hasHideClass) {
                sliderBubble.classList.remove('hide');
                hasHideClass = false;
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
            hasHideClass = true;

        }, {
            passive: true
        });

        dom.addEventListener(this, (window.PointerEvent ? 'pointermove' : 'mousemove'), function (e) {

            if (!this.dragging) {
                var bubbleValue = mapClientToFraction(this, e.clientX) * 100;

                updateBubble(this, bubbleValue, sliderBubble);

                if (hasHideClass) {
                    sliderBubble.classList.remove('hide');
                    hasHideClass = false;
                }
            }

        }, {
            passive: true
        });

        dom.addEventListener(this, (window.PointerEvent ? 'pointerleave' : 'mouseleave'), function () {
            sliderBubble.classList.add('hide');
            hasHideClass = true;
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

                var fraction = mapClientToFraction(this, e.targetTouches[0].clientX);
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

                var fraction = mapClientToFraction(this, e.targetTouches[0].clientX);
                this.value = mapFractionToValue(this, fraction);

                this.dispatchEvent(new Event('input', {
                    bubbles: true,
                    cancelable: false
                }));
            }, {
                passive: true
            });

            dom.addEventListener(this, 'touchend', function (e) {
                var range = this;

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
    };

    /**
     * Keyboard dragging timeout.
     * After this delay "change" event will be fired.
     */
    var KeyboardDraggingTimeout = 1000;

    /**
     * Keyboard dragging timer.
     */
    var keyboardDraggingTimer;

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

        var event = new Event('change', {
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

        elem.value = Math.max(elem.min, Math.min(elem.max, parseFloat(elem.value) + delta));

        var event = new Event('input', {
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
                stepKeyboard(this, -this.keyboardStepDown || -1);
                e.preventDefault();
                e.stopPropagation();
                break;
            case 'ArrowRight':
            case 'Right':
                stepKeyboard(this, this.keyboardStepUp || 1);
                e.preventDefault();
                e.stopPropagation();
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
    }

    /**
     * Set steps for keyboard input.
     *
     * @param {number} stepDown step to reduce
     * @param {number} stepUp step to increase
     */
    EmbySliderPrototype.setKeyboardSteps = function (stepDown, stepUp) {
        this.keyboardStepDown = stepDown || stepUp || 1;
        this.keyboardStepUp = stepUp || stepDown || 1;
    }

    function setRange(elem, startPercent, endPercent) {

        var style = elem.style;
        style.left = Math.max(startPercent, 0) + '%';

        var widthPercent = endPercent - startPercent;
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

        var elem = this.backgroundUpper;
        if (!elem) {
            return;
        }

        if (runtime != null) {
            ranges = mapRangesFromRuntimeToPercent(ranges, runtime);

            position = (position / runtime) * 100;
        }

        for (var i = 0, length = ranges.length; i < length; i++) {

            var range = ranges[i];

            if (position != null) {
                if (position >= range.end) {
                    continue;
                }
            }

            setRange(elem, range.start, range.end);
            return;
        }

        setRange(elem, 0, 0);
    };

    EmbySliderPrototype.setIsClear = function (isClear) {

        var backgroundLower = this.backgroundLower;
        if (backgroundLower) {
            if (isClear) {
                backgroundLower.classList.add('mdl-slider-background-lower-clear');
            } else {
                backgroundLower.classList.remove('mdl-slider-background-lower-clear');
            }
        }
    };

    function startInterval(range) {
        var interval = range.interval;
        if (interval) {
            clearInterval(interval);
        }
        range.interval = setInterval(updateValues.bind(range, true), 100);
    }

    EmbySliderPrototype.detachedCallback = function () {

        var interval = this.interval;
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
});
