import browser from '../../scripts/browser';
import { playbackManager } from '../playback/playbackmanager';
import dom from '../../scripts/dom';
import * as userSettings from '../../scripts/settings/userSettings';
import './backdrop.scss';
import ServerConnections from '../ServerConnections';

/* eslint-disable indent */

    function enableAnimation() {
        if (browser.slow) {
            return false;
        }

        return true;
    }

    function enableRotation() {
        if (browser.tv) {
            return false;
        }

        // Causes high cpu usage
        if (browser.firefox) {
            return false;
        }

        return true;
    }

    class Backdrop {
        load(url, parent, existingBackdropImage) {
            const img = new Image();
            const self = this;

            img.onload = () => {
                if (self.isDestroyed) {
                    return;
                }

                const backdropImage = document.createElement('div');
                backdropImage.classList.add('backdropImage');
                backdropImage.classList.add('displayingBackdropImage');
                backdropImage.style.backgroundImage = `url('${url}')`;
                backdropImage.setAttribute('data-url', url);

                backdropImage.classList.add('backdropImageFadeIn');
                parent.appendChild(backdropImage);

                if (!enableAnimation()) {
                    if (existingBackdropImage && existingBackdropImage.parentNode) {
                        existingBackdropImage.parentNode.removeChild(existingBackdropImage);
                    }
                    internalBackdrop(true);
                    return;
                }

                const onAnimationComplete = () => {
                    dom.removeEventListener(backdropImage, dom.whichAnimationEvent(), onAnimationComplete, {
                        once: true
                    });
                    if (backdropImage === self.currentAnimatingElement) {
                        self.currentAnimatingElement = null;
                    }
                    if (existingBackdropImage && existingBackdropImage.parentNode) {
                        existingBackdropImage.parentNode.removeChild(existingBackdropImage);
                    }
                };

                dom.addEventListener(backdropImage, dom.whichAnimationEvent(), onAnimationComplete, {
                    once: true
                });

                internalBackdrop(true);
            };

            img.src = url;
        }

        cancelAnimation() {
            const elem = this.currentAnimatingElement;
            if (elem) {
                elem.classList.remove('backdropImageFadeIn');
                this.currentAnimatingElement = null;
            }
        }

        destroy() {
            this.isDestroyed = true;
            this.cancelAnimation();
        }
    }

    let backdropContainer;
    function getBackdropContainer() {
        if (!backdropContainer) {
            backdropContainer = document.querySelector('.backdropContainer');
        }

        if (!backdropContainer) {
            backdropContainer = document.createElement('div');
            backdropContainer.classList.add('backdropContainer');
            document.body.insertBefore(backdropContainer, document.body.firstChild);
        }

        return backdropContainer;
    }

    export function clearBackdrop(clearAll) {
        clearRotation();

        if (currentLoadingBackdrop) {
            currentLoadingBackdrop.destroy();
            currentLoadingBackdrop = null;
        }

        const elem = getBackdropContainer();
        elem.innerHTML = '';

        if (clearAll) {
            hasExternalBackdrop = false;
        }

        internalBackdrop(false);
    }

    let backgroundContainer;
    function getBackgroundContainer() {
        if (!backgroundContainer) {
            backgroundContainer = document.querySelector('.backgroundContainer');
        }
        return backgroundContainer;
    }

    function setBackgroundContainerBackgroundEnabled() {
        if (hasInternalBackdrop || hasExternalBackdrop) {
            getBackgroundContainer().classList.add('withBackdrop');
        } else {
            getBackgroundContainer().classList.remove('withBackdrop');
        }
    }

    let hasInternalBackdrop;
    function internalBackdrop(enabled) {
        hasInternalBackdrop = enabled;
        setBackgroundContainerBackgroundEnabled();
    }

    let hasExternalBackdrop;
    export function externalBackdrop(enabled) {
        hasExternalBackdrop = enabled;
        setBackgroundContainerBackgroundEnabled();
    }

    let currentLoadingBackdrop;
    function setBackdropImage(url) {
        if (currentLoadingBackdrop) {
            currentLoadingBackdrop.destroy();
            currentLoadingBackdrop = null;
        }

        const elem = getBackdropContainer();
        const existingBackdropImage = elem.querySelector('.displayingBackdropImage');

        if (existingBackdropImage && existingBackdropImage.getAttribute('data-url') === url) {
            if (existingBackdropImage.getAttribute('data-url') === url) {
                return;
            }
            existingBackdropImage.classList.remove('displayingBackdropImage');
        }

        const instance = new Backdrop();
        instance.load(url, elem, existingBackdropImage);
        currentLoadingBackdrop = instance;
    }

    function getItemImageUrls(item, imageOptions) {
        imageOptions = imageOptions || {};

        const apiClient = ServerConnections.getApiClient(item.ServerId);
        if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
            return item.BackdropImageTags.map((imgTag, index) => {
                return apiClient.getScaledImageUrl(item.BackdropItemId || item.Id, Object.assign(imageOptions, {
                    type: 'Backdrop',
                    tag: imgTag,
                    maxWidth: dom.getScreenWidth(),
                    index: index
                }));
            });
        }

        if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
            return item.ParentBackdropImageTags.map((imgTag, index) => {
                return apiClient.getScaledImageUrl(item.ParentBackdropItemId, Object.assign(imageOptions, {
                    type: 'Backdrop',
                    tag: imgTag,
                    maxWidth: dom.getScreenWidth(),
                    index: index
                }));
            });
        }

        return [];
    }

    function getImageUrls(items, imageOptions) {
        const list = [];
        const onImg = img => {
            list.push(img);
        };

        for (let i = 0, length = items.length; i < length; i++) {
            const itemImages = getItemImageUrls(items[i], imageOptions);
            itemImages.forEach(onImg);
        }

        return list;
    }

    function arraysEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (a == null || b == null) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }

        // If you don't care about the order of the elements inside
        // the array, you should sort both arrays here.
        for (let i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }

        return true;
    }

    function enabled() {
        return userSettings.enableBackdrops();
    }

    let rotationInterval;
    let currentRotatingImages = [];
    let currentRotationIndex = -1;
    export function setBackdrops(items, imageOptions, enableImageRotation) {
        if (enabled()) {
            const images = getImageUrls(items, imageOptions);

            if (images.length) {
                startRotation(images, enableImageRotation);
            } else {
                clearBackdrop();
            }
        }
    }

    function startRotation(images, enableImageRotation) {
        if (arraysEqual(images, currentRotatingImages)) {
            return;
        }

        clearRotation();

        currentRotatingImages = images;
        currentRotationIndex = -1;

        if (images.length > 1 && enableImageRotation !== false && enableRotation()) {
            rotationInterval = setInterval(onRotationInterval, 24000);
        }

        onRotationInterval();
    }

    function onRotationInterval() {
        if (playbackManager.isPlayingLocally(['Video'])) {
            return;
        }

        let newIndex = currentRotationIndex + 1;
        if (newIndex >= currentRotatingImages.length) {
            newIndex = 0;
        }

        currentRotationIndex = newIndex;
        setBackdropImage(currentRotatingImages[newIndex]);
    }

    function clearRotation() {
        const interval = rotationInterval;
        if (interval) {
            clearInterval(interval);
        }

        rotationInterval = null;
        currentRotatingImages = [];
        currentRotationIndex = -1;
    }

    export function setBackdrop(url, imageOptions) {
        if (url && typeof url !== 'string') {
            url = getImageUrls([url], imageOptions)[0];
        }

        if (url) {
            clearRotation();
            setBackdropImage(url);
        } else {
            clearBackdrop();
        }
    }

/* eslint-enable indent */

export default {
    setBackdrops: setBackdrops,
    setBackdrop: setBackdrop,
    clearBackdrop: clearBackdrop,
    externalBackdrop: externalBackdrop
};
