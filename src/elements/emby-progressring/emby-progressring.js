import './emby-progressring.scss';
import 'webcomponents.js/webcomponents-lite';
import template from './emby-progressring.template.html';
import { getCurrentDateTimeLocale } from '../../lib/globalize';
import { toPercentString } from '../../utils/number';

const EmbyProgressRing = Object.create(HTMLDivElement.prototype);

EmbyProgressRing.createdCallback = function () {
    this.classList.add('progressring');
    this.setAttribute('dir', 'ltr');
    const instance = this;

    instance.innerHTML = template;

    if (window.MutationObserver) {
        // create an observer instance
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                instance.setProgress(parseFloat(instance.getAttribute('data-progress') || '0'));
            });
        });

        // configuration of the observer:
        const config = { attributes: true, childList: false, characterData: false };

        // pass in the target node, as well as the observer options
        observer.observe(instance, config);

        instance.observer = observer;
    }

    instance.setProgress(parseFloat(instance.getAttribute('data-progress') || '0'));
};

EmbyProgressRing.setProgress = function (progress) {
    progress = Math.floor(progress);

    let angle;

    if (progress < 25) {
        angle = -90 + (progress / 100) * 360;

        this.querySelector('.animate-0-25-b').style.transform = 'rotate(' + angle + 'deg)';

        this.querySelector('.animate-25-50-b').style.transform = 'rotate(-90deg)';
        this.querySelector('.animate-50-75-b').style.transform = 'rotate(-90deg)';
        this.querySelector('.animate-75-100-b').style.transform = 'rotate(-90deg)';
    } else if (progress >= 25 && progress < 50) {
        angle = -90 + ((progress - 25) / 100) * 360;

        this.querySelector('.animate-0-25-b').style.transform = 'none';
        this.querySelector('.animate-25-50-b').style.transform = 'rotate(' + angle + 'deg)';

        this.querySelector('.animate-50-75-b').style.transform = 'rotate(-90deg)';
        this.querySelector('.animate-75-100-b').style.transform = 'rotate(-90deg)';
    } else if (progress >= 50 && progress < 75) {
        angle = -90 + ((progress - 50) / 100) * 360;

        this.querySelector('.animate-0-25-b').style.transform = 'none';
        this.querySelector('.animate-25-50-b').style.transform = 'none';
        this.querySelector('.animate-50-75-b').style.transform = 'rotate(' + angle + 'deg)';

        this.querySelector('.animate-75-100-b').style.transform = 'rotate(-90deg)';
    } else if (progress >= 75 && progress <= 100) {
        angle = -90 + ((progress - 75) / 100) * 360;

        this.querySelector('.animate-0-25-b').style.transform = 'none';
        this.querySelector('.animate-25-50-b').style.transform = 'none';
        this.querySelector('.animate-50-75-b').style.transform = 'none';
        this.querySelector('.animate-75-100-b').style.transform = 'rotate(' + angle + 'deg)';
    }

    this.querySelector('.progressring-text').innerHTML = toPercentString(progress / 100, getCurrentDateTimeLocale());
};

EmbyProgressRing.attachedCallback = function () {
    // no-op
};

EmbyProgressRing.detachedCallback = function () {
    const observer = this.observer;

    if (observer) {
        // later, you can stop observing
        observer.disconnect();

        this.observer = null;
    }
};

document.registerElement('emby-progressring', {
    prototype: EmbyProgressRing,
    extends: 'div'
});

export default EmbyProgressRing;

