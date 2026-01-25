/**
 * @deprecated This file is deprecated in favor of React + ui-primitives.
 *
 * Migration:
 * - Web Component `emby-progressring` → ui-primitives/CircularProgress
 * - Template-based rendering → React rendering
 *
 * @see src/ui-primitives/CircularProgress.tsx
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import './emby-progressring.scss';
import template from './emby-progressring.template.html?raw';
import { getCurrentDateTimeLocale } from '../../lib/globalize';
import { toPercentString } from '../../utils/number';

interface EmbyProgressRingElement extends HTMLDivElement {
    observer: MutationObserver | undefined;
}

type EmbyProgressRingPrototype = {
    createdCallback: (this: EmbyProgressRingElement) => void;
    setProgress: (this: EmbyProgressRingElement, progress: number) => void;
    attachedCallback: (this: EmbyProgressRingElement) => void;
    detachedCallback: (this: EmbyProgressRingElement) => void;
} & HTMLElement;

declare global {
    interface Document {
        registerElement: (tagName: string, options: { prototype: EmbyProgressRingPrototype; extends: string }) => void;
    }
}

const EmbyProgressRing = Object.create(HTMLDivElement.prototype) as unknown as EmbyProgressRingPrototype;

EmbyProgressRing.createdCallback = function (this: EmbyProgressRingElement): void {
    this.classList.add('progressring');
    this.setAttribute('dir', 'ltr');
    const instance = this;

    instance.innerHTML = template;

    if (window.MutationObserver) {
        const observer = new MutationObserver((mutations: MutationRecord[]): void => {
            mutations.forEach((): void => {
                (EmbyProgressRing as EmbyProgressRingPrototype).setProgress.call(
                    instance,
                    parseFloat(instance.getAttribute('data-progress') || '0')
                );
            });
        });

        const config: MutationObserverInit = { attributes: true, childList: false, characterData: false };

        observer.observe(instance, config);

        (instance as unknown as { observer?: MutationObserver }).observer = observer;
    }

    (EmbyProgressRing as EmbyProgressRingPrototype).setProgress.call(
        instance,
        parseFloat(instance.getAttribute('data-progress') || '0')
    );
};

EmbyProgressRing.setProgress = function (this: EmbyProgressRingElement, progress: number): void {
    progress = Math.floor(progress);

    let angle: number;

    if (progress < 25) {
        angle = -90 + (progress / 100) * 360;

        (this.querySelector('.animate-0-25-b') as HTMLElement).style.transform = 'rotate(' + angle + 'deg)';

        (this.querySelector('.animate-25-50-b') as HTMLElement).style.transform = 'rotate(-90deg)';
        (this.querySelector('.animate-50-75-b') as HTMLElement).style.transform = 'rotate(-90deg)';
        (this.querySelector('.animate-75-100-b') as HTMLElement).style.transform = 'rotate(-90deg)';
    } else if (progress >= 25 && progress < 50) {
        angle = -90 + ((progress - 25) / 100) * 360;

        (this.querySelector('.animate-0-25-b') as HTMLElement).style.transform = 'none';
        (this.querySelector('.animate-25-50-b') as HTMLElement).style.transform = 'rotate(' + angle + 'deg)';

        (this.querySelector('.animate-50-75-b') as HTMLElement).style.transform = 'rotate(-90deg)';
        (this.querySelector('.animate-75-100-b') as HTMLElement).style.transform = 'rotate(-90deg)';
    } else if (progress >= 50 && progress < 75) {
        angle = -90 + ((progress - 50) / 100) * 360;

        (this.querySelector('.animate-0-25-b') as HTMLElement).style.transform = 'none';
        (this.querySelector('.animate-25-50-b') as HTMLElement).style.transform = 'none';
        (this.querySelector('.animate-50-75-b') as HTMLElement).style.transform = 'rotate(' + angle + 'deg)';

        (this.querySelector('.animate-75-100-b') as HTMLElement).style.transform = 'rotate(-90deg)';
    } else if (progress >= 75 && progress <= 100) {
        angle = -90 + ((progress - 75) / 100) * 360;

        (this.querySelector('.animate-0-25-b') as HTMLElement).style.transform = 'none';
        (this.querySelector('.animate-25-50-b') as HTMLElement).style.transform = 'none';
        (this.querySelector('.animate-50-75-b') as HTMLElement).style.transform = 'none';
        (this.querySelector('.animate-75-100-b') as HTMLElement).style.transform = 'rotate(' + angle + 'deg)';
    }

    (this.querySelector('.progressring-text') as HTMLElement).innerHTML = toPercentString(
        progress / 100,
        getCurrentDateTimeLocale()
    );
};

EmbyProgressRing.attachedCallback = function (this: EmbyProgressRingElement): void {};

EmbyProgressRing.detachedCallback = function (this: EmbyProgressRingElement): void {
    const observer = this.observer;

    if (observer) {
        observer.disconnect();

        this.observer = undefined;
    }
};

document.registerElement('emby-progressring', {
    prototype: EmbyProgressRing,
    extends: 'div'
});

export default EmbyProgressRing;
