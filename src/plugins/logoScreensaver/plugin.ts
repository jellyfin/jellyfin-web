// @ts-ignore
import icon from '@jellyfin/ux-web/icon-transparent.png';
import { PluginType } from '../../types/plugin';
import { randomInt } from '../../utils/number';

export default class LogoScreensaver {
    name: string = 'LogoScreensaver';
    type: any = PluginType.Screensaver;
    id: string = 'logoscreensaver';
    supportsAnonymous: boolean = true;
    private interval: any = null;

    private animate() {
        const animations = [
            this.bounceInLeft,
            this.bounceInRight,
            this.swing,
            this.tada,
            this.wobble,
            this.rotateIn,
            this.rotateOut
        ];

        const elem = document.querySelector('.logoScreenSaverImage') as HTMLElement;
        if (typeof elem?.animate === 'function') {
            const random = randomInt(0, animations.length - 1);
            animations[random](elem, 1);
        }
    }

    private bounceInLeft(elem: HTMLElement, iterations: number) {
        const keyframes = [
            { transform: 'translate3d(-3000px, 0, 0)', opacity: '0', offset: 0 },
            { transform: 'translate3d(25px, 0, 0)', opacity: '1', offset: 0.6 },
            { transform: 'translate3d(-100px, 0, 0)', offset: 0.75 },
            { transform: 'translate3d(5px, 0, 0)', offset: 0.9 },
            { transform: 'none', opacity: '1', offset: 1 }
        ];
        return elem.animate(keyframes, {
            duration: 900,
            iterations,
            easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
        });
    }

    private bounceInRight(elem: HTMLElement, iterations: number) {
        const keyframes = [
            { transform: 'translate3d(3000px, 0, 0)', opacity: '0', offset: 0 },
            { transform: 'translate3d(-25px, 0, 0)', opacity: '1', offset: 0.6 },
            { transform: 'translate3d(100px, 0, 0)', offset: 0.75 },
            { transform: 'translate3d(-5px, 0, 0)', offset: 0.9 },
            { transform: 'none', opacity: '1', offset: 1 }
        ];
        return elem.animate(keyframes, {
            duration: 900,
            iterations,
            easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
        });
    }

    private swing(elem: HTMLElement, iterations: number) {
        const keyframes = [
            { transform: 'translate(0%)', offset: 0 },
            { transform: 'rotate3d(0, 0, 1, 15deg)', offset: 0.2 },
            { transform: 'rotate3d(0, 0, 1, -10deg)', offset: 0.4 },
            { transform: 'rotate3d(0, 0, 1, 5deg)', offset: 0.6 },
            { transform: 'rotate3d(0, 0, 1, -5deg)', offset: 0.8 },
            { transform: 'rotate3d(0, 0, 1, 0deg)', offset: 1 }
        ];
        return elem.animate(keyframes, { duration: 900, iterations });
    }

    private tada(elem: HTMLElement, iterations: number) {
        const keyframes = [
            { transform: 'scale3d(1, 1, 1)', offset: 0 },
            { transform: 'scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)', offset: 0.1 },
            { transform: 'scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)', offset: 0.2 },
            { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)', offset: 0.3 },
            { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)', offset: 0.4 },
            { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)', offset: 0.5 },
            { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)', offset: 0.6 },
            { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)', offset: 0.7 },
            { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)', offset: 0.8 },
            { transform: 'scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)', offset: 0.9 },
            { transform: 'scale3d(1, 1, 1)', offset: 1 }
        ];
        return elem.animate(keyframes, { duration: 900, iterations });
    }

    private wobble(elem: HTMLElement, iterations: number) {
        const keyframes = [
            { transform: 'translate(0%)', offset: 0 },
            { transform: 'translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg)', offset: 0.15 },
            { transform: 'translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg)', offset: 0.45 },
            { transform: 'translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg)', offset: 0.6 },
            { transform: 'translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg)', offset: 0.75 },
            { transform: 'translateX(0%)', offset: 1 }
        ];
        return elem.animate(keyframes, { duration: 900, iterations });
    }

    private rotateIn(elem: HTMLElement, iterations: number) {
        const keyframes = [
            { transform: 'rotate3d(0, 0, 1, -200deg)', opacity: '0', transformOrigin: 'center', offset: 0 },
            { transform: 'none', opacity: '1', transformOrigin: 'center', offset: 1 }
        ];
        return elem.animate(keyframes, { duration: 900, iterations });
    }

    private rotateOut(elem: HTMLElement, iterations: number) {
        const keyframes = [
            { transform: 'none', opacity: '1', transformOrigin: 'center', offset: 0 },
            { transform: 'rotate3d(0, 0, 1, 200deg)', opacity: '0', transformOrigin: 'center', offset: 1 }
        ];
        return elem.animate(keyframes, { duration: 900, iterations });
    }

    private fadeOut(elem: HTMLElement, iterations: number) {
        const keyframes = [
            { opacity: '1', offset: 0 },
            { opacity: '0', offset: 1 }
        ];
        return elem.animate(keyframes, { duration: 400, iterations });
    }

    private stopInterval() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    show() {
        import('./style.scss').then(() => {
            let elem = document.querySelector('.logoScreenSaver') as HTMLElement;
            if (!elem) {
                elem = document.createElement('div');
                elem.classList.add('logoScreenSaver');
                document.body.appendChild(elem);
                elem.innerHTML = `<img class="logoScreenSaverImage" src="${icon}" />`;
            }
            this.stopInterval();
            this.interval = setInterval(() => this.animate(), 3000);
        });
    }

    hide() {
        this.stopInterval();
        const elem = document.querySelector('.logoScreenSaver') as HTMLElement;
        if (elem) {
            return new Promise<void>(resolve => {
                if (typeof elem.animate === 'function') {
                    const animation = this.fadeOut(elem, 1);
                    animation.onfinish = () => {
                        elem.remove();
                        resolve();
                    };
                } else {
                    elem.remove();
                    resolve();
                }
            });
        }
        return Promise.resolve();
    }
}
