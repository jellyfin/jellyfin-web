import isEqual from 'lodash-es/isEqual';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import browser from '../../scripts/browser';
import { playbackManager } from '../playback/playbackmanager';
import dom from '../../utils/dom';
import * as userSettings from '../../scripts/settings/userSettings';

import './backdrop.scss';

function enableAnimation() {
    return !browser.slow;
}

function enableRotation() {
    return !browser.tv
            // Causes high cpu usage
            && !browser.firefox;
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
                if (existingBackdropImage?.parentNode) {
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
                if (existingBackdropImage?.parentNode) {
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

const servedImagesCache = new Set();

function setBackdropImage(url) {
    if (servedImagesCache.has(url)) {
        console.debug(`Backdrop image ${url} has already been served.`);
        return;
    }

    servedImagesCache.add(url);

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
        servedImagesCache.clear();
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
function internalBackdrop(isEnabled) {
    hasInternalBackdrop = isEnabled;
    setBackgroundContainerBackgroundEnabled();
}

let hasExternalBackdrop;
export function externalBackdrop(isEnabled) {
    hasExternalBackdrop = isEnabled;
    setBackgroundContainerBackgroundEnabled();
}

let currentLoadingBackdrop;

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

    if (item.ParentBackdropItemId && item.ParentBackdropImageTags?.length) {
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

function enabled() {
    return userSettings.enableBackdrops();
}

let rotationInterval;
let currentRotatingImages = [];
let currentRotationIndex = -1;
export function setBackdrops(items, imageOptions, isEnabled = false) {
    if (isEnabled || enabled()) {
        const images = getImageUrls(items, imageOptions);

        if (images.length) {
            setBackdropImages(images);
        } else {
            clearBackdrop();
        }
    }
}

export function setBackdropImages(images) {
    if (isEqual(images, currentRotatingImages)) {
        return;
    }

    clearRotation();

    currentRotatingImages = images;
    currentRotationIndex = -1;

    if (images.length > 1 && enableRotation()) {
        rotationInterval = setInterval(onRotationInterval, 24000);
    }

    onRotationInterval();
}

function onRotationInterval() {
    if (playbackManager.isPlayingLocally(['Video']) || document.visibilityState === 'hidden') {
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

/**
 * @enum TransparencyLevel
 */
export const TRANSPARENCY_LEVEL = {
    Full: 'full',
    Backdrop: 'backdrop',
    None: 'none'
};

/**
 * Sets the backdrop, background, and document transparency
 * @param {TransparencyLevel} level The level of transparency
 */
export function setBackdropTransparency(level) {
    const backdropElem = getBackdropContainer();
    const backgroundElem = getBackgroundContainer();

    if (level === TRANSPARENCY_LEVEL.Full || level === 2) {
        clearBackdrop(true);
        document.documentElement.classList.add('transparentDocument');
        backgroundElem.classList.add('backgroundContainer-transparent');
        backdropElem.classList.add('hide');
    } else if (level === TRANSPARENCY_LEVEL.Backdrop || level === 1) {
        externalBackdrop(true);
        document.documentElement.classList.add('transparentDocument');
        backgroundElem.classList.add('backgroundContainer-transparent');
        backdropElem.classList.add('hide');
    } else {
        externalBackdrop(false);
        document.documentElement.classList.remove('transparentDocument');
        backgroundElem.classList.remove('backgroundContainer-transparent');
        backdropElem.classList.remove('hide');
    }
}
