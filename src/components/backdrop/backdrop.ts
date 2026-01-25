import { isEqual } from '../../utils/lodashUtils';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import browser from '../../scripts/browser';
import { playbackManager } from '../playback/playbackmanager';
import dom from '../../utils/dom';
import * as userSettings from '../../scripts/settings/userSettings';
import { isVisible } from '../../utils/visibility';
import { imagePreloader } from '../../utils/imagePreloader';

import './backdrop.css.ts';

function enableAnimation(): boolean {
    return !browser.mobile;
}

function enableRotation(): boolean {
    return !browser.tv;
}

class Backdrop {
    private isDestroyed: boolean = false;
    private currentAnimatingElement: HTMLElement | null = null;

    load(url: string, parent: HTMLElement, existingBackdropImage: HTMLElement | null): void {
        const img = new Image();
        img.onload = () => {
            if (this.isDestroyed) return;

            const backdropImage = document.createElement('div');
            backdropImage.classList.add('backdropImage', 'displayingBackdropImage', 'backdropImageFadeIn');
            backdropImage.style.backgroundImage = `url('${url}')`;
            backdropImage.setAttribute('data-url', url);
            parent.appendChild(backdropImage);

            if (!enableAnimation()) {
                existingBackdropImage?.parentNode?.removeChild(existingBackdropImage);
                internalBackdrop(true);
                return;
            }

            const onAnimationComplete = () => {
                dom.removeEventListener(backdropImage, dom.whichAnimationEvent(), onAnimationComplete);
                if (backdropImage === this.currentAnimatingElement) this.currentAnimatingElement = null;
                existingBackdropImage?.parentNode?.removeChild(existingBackdropImage);
            };

            dom.addEventListener(backdropImage, dom.whichAnimationEvent(), onAnimationComplete);
            internalBackdrop(true);
        };
        img.src = url;
    }

    cancelAnimation(): void {
        if (this.currentAnimatingElement) {
            this.currentAnimatingElement.classList.remove('backdropImageFadeIn');
            this.currentAnimatingElement = null;
        }
    }

    destroy(): void {
        this.isDestroyed = true;
        this.cancelAnimation();
    }
}

let backdropContainer: HTMLElement | null = null;
function getBackdropContainer(): HTMLElement {
    if (!backdropContainer) backdropContainer = document.querySelector('.backdropContainer');
    if (!backdropContainer) {
        backdropContainer = document.createElement('div');
        backdropContainer.classList.add('backdropContainer');
        document.body.insertBefore(backdropContainer, document.body.firstChild);
    }
    return backdropContainer;
}

export function clearBackdrop(clearAll?: boolean): void {
    clearRotation();
    if (currentLoadingBackdrop) {
        currentLoadingBackdrop.destroy();
        currentLoadingBackdrop = null;
    }
    const elem = getBackdropContainer();
    elem.innerHTML = '';
    if (clearAll) hasExternalBackdrop = false;
    internalBackdrop(false);
}

let backgroundContainer: HTMLElement | null = null;
function getBackgroundContainer(): HTMLElement {
    if (!backgroundContainer) backgroundContainer = document.querySelector('.backgroundContainer') || document.body;
    return backgroundContainer;
}

function setBackgroundContainerBackgroundEnabled(): void {
    getBackgroundContainer().classList.toggle('withBackdrop', !!(hasInternalBackdrop || hasExternalBackdrop));
}

let hasInternalBackdrop: boolean = false;
function internalBackdrop(isEnabled: boolean): void {
    hasInternalBackdrop = isEnabled;
    setBackgroundContainerBackgroundEnabled();
}

let hasExternalBackdrop: boolean = false;
export function externalBackdrop(isEnabled: boolean): void {
    hasExternalBackdrop = isEnabled;
    setBackgroundContainerBackgroundEnabled();
}

let currentLoadingBackdrop: Backdrop | null = null;
function setBackdropImage(url: string): void {
    if (currentLoadingBackdrop) {
        currentLoadingBackdrop.destroy();
        currentLoadingBackdrop = null;
    }
    const elem = getBackdropContainer();
    const existing = elem.querySelector('.displayingBackdropImage') as HTMLElement | null;
    if (existing?.getAttribute('data-url') === url) return;
    existing?.classList.remove('displayingBackdropImage');

    const instance = new Backdrop();
    instance.load(url, elem, existing);
    currentLoadingBackdrop = instance;
}

function getItemImageUrls(item: any, imageOptions: any = {}): string[] {
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    if (item.BackdropImageTags?.length) {
        return item.BackdropImageTags.map((tag: string, index: number) =>
            apiClient.getScaledImageUrl(item.BackdropItemId || item.Id, {
                ...imageOptions,
                type: 'Backdrop',
                tag,
                maxWidth: dom.getScreenWidth(),
                index
            })
        );
    }
    if (item.ParentBackdropItemId && item.ParentBackdropImageTags?.length) {
        return item.ParentBackdropImageTags.map((tag: string, index: number) =>
            apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
                ...imageOptions,
                type: 'Backdrop',
                tag,
                maxWidth: dom.getScreenWidth(),
                index
            })
        );
    }
    return [];
}

function getImageUrls(items: any[], imageOptions: any): string[] {
    return items.flatMap(item => getItemImageUrls(item, imageOptions));
}

let rotationInterval: any = null;
let currentRotatingImages: string[] = [];
let currentRotationIndex: number = -1;

export function setBackdrops(items: any[], imageOptions?: any, isEnabled: boolean = false): void {
    if (isEnabled || (userSettings as any).enableBackdrops()) {
        const images = getImageUrls(items, imageOptions);
        if (images.length) setBackdropImages(images);
        else clearBackdrop();
    }
}

export function setBackdropImages(images: string[]): void {
    if (isEqual(images, currentRotatingImages)) return;
    clearRotation();
    currentRotatingImages = images;
    currentRotationIndex = -1;
    if (images.length > 1 && enableRotation()) {
        rotationInterval = setInterval(onRotationInterval, 10000);
    }
    imagePreloader.preloadBackdropImages(images);
    onRotationInterval();
}

function onRotationInterval(): void {
    if (playbackManager.isPlayingLocally(['Video']) || !isVisible()) return;
    let newIndex = currentRotationIndex + 1;
    if (newIndex >= currentRotatingImages.length) newIndex = 0;
    currentRotationIndex = newIndex;
    if (currentRotatingImages[newIndex]) setBackdropImage(currentRotatingImages[newIndex]);
}

function clearRotation(): void {
    if (rotationInterval) clearInterval(rotationInterval);
    rotationInterval = null;
    currentRotatingImages = [];
    currentRotationIndex = -1;
}

export function setBackdrop(url: string | any, imageOptions?: any): void {
    if (url && typeof url !== 'string') url = getImageUrls([url], imageOptions)[0];
    if (url) {
        clearRotation();
        setBackdropImage(url);
    } else clearBackdrop();
}

export const TRANSPARENCY_LEVEL = {
    Full: 'full',
    Backdrop: 'backdrop',
    None: 'none'
} as const;

export type TransparencyLevel = (typeof TRANSPARENCY_LEVEL)[keyof typeof TRANSPARENCY_LEVEL];

export function setBackdropTransparency(level: TransparencyLevel | number): void {
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
