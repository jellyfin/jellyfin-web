import { PluginType } from '../../types/plugin.ts';
import { randomInt } from '../../utils/number.ts';

export default function () {
    const self = this;

    self.name = 'LogoScreensaver';
    self.type = PluginType.Screensaver;
    self.id = 'logoscreensaver';
    self.supportsAnonymous = true;

    let interval;

    function animate() {
        const animations = [

            bounceInLeft,
            bounceInRight,
            swing,
            tada,
            wobble,
            rotateIn,
            rotateOut
        ];

        const elem = document.querySelector('.logoScreenSaverImage');

        if (elem?.animate) {
            const random = randomInt(0, animations.length - 1);

            animations[random](elem, 1);
        }
    }

    function bounceInLeft(elem, iterations) {
        const keyframes = [
            { transform: 'translate3d(-3000px, 0, 0)', opacity: '0', offset: 0 },
            { transform: 'translate3d(25px, 0, 0)', opacity: '1', offset: 0.6 },
            { transform: 'translate3d(-100px, 0, 0)', offset: 0.75 },
            { transform: 'translate3d(5px, 0, 0)', offset: 0.9 },
            { transform: 'none', opacity: '1', offset: 1 }];
        const timing = { duration: 900, iterations: iterations, easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' };
        return elem.animate(keyframes, timing);
    }

    function bounceInRight(elem, iterations) {
        const keyframes = [
            { transform: 'translate3d(3000px, 0, 0)', opacity: '0', offset: 0 },
            { transform: 'translate3d(-25px, 0, 0)', opacity: '1', offset: 0.6 },
            { transform: 'translate3d(100px, 0, 0)', offset: 0.75 },
            { transform: 'translate3d(-5px, 0, 0)', offset: 0.9 },
            { transform: 'none', opacity: '1', offset: 1 }];
        const timing = { duration: 900, iterations: iterations, easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)' };
        return elem.animate(keyframes, timing);
    }

    function swing(elem, iterations) {
        const keyframes = [
            { transform: 'translate(0%)', offset: 0 },
            { transform: 'rotate3d(0, 0, 1, 15deg)', offset: 0.2 },
            { transform: 'rotate3d(0, 0, 1, -10deg)', offset: 0.4 },
            { transform: 'rotate3d(0, 0, 1, 5deg)', offset: 0.6 },
            { transform: 'rotate3d(0, 0, 1, -5deg)', offset: 0.8 },
            { transform: 'rotate3d(0, 0, 1, 0deg)', offset: 1 }];
        const timing = { duration: 900, iterations: iterations };
        return elem.animate(keyframes, timing);
    }

    function tada(elem, iterations) {
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
            { transform: 'scale3d(1, 1, 1)', offset: 1 }];
        const timing = { duration: 900, iterations: iterations };
        return elem.animate(keyframes, timing);
    }

    function wobble(elem, iterations) {
        const keyframes = [
            { transform: 'translate(0%)', offset: 0 },
            { transform: 'translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg)', offset: 0.15 },
            { transform: 'translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg)', offset: 0.45 },
            { transform: 'translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg)', offset: 0.6 },
            { transform: 'translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg)', offset: 0.75 },
            { transform: 'translateX(0%)', offset: 1 }];
        const timing = { duration: 900, iterations: iterations };
        return elem.animate(keyframes, timing);
    }

    function rotateIn(elem, iterations) {
        const keyframes = [{ transform: 'rotate3d(0, 0, 1, -200deg)', opacity: '0', transformOrigin: 'center', offset: 0 },
            { transform: 'none', opacity: '1', transformOrigin: 'center', offset: 1 }];
        const timing = { duration: 900, iterations: iterations };
        return elem.animate(keyframes, timing);
    }

    function rotateOut(elem, iterations) {
        const keyframes = [{ transform: 'none', opacity: '1', transformOrigin: 'center', offset: 0 },
            { transform: 'rotate3d(0, 0, 1, 200deg)', opacity: '0', transformOrigin: 'center', offset: 1 }];
        const timing = { duration: 900, iterations: iterations };
        return elem.animate(keyframes, timing);
    }

    function fadeOut(elem, iterations) {
        const keyframes = [
            { opacity: '1', offset: 0 },
            { opacity: '0', offset: 1 }];
        const timing = { duration: 400, iterations: iterations };
        return elem.animate(keyframes, timing);
    }

    function stopInterval() {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }

    self.show = function () {
        import('./style.scss').then(() => {
            let elem = document.querySelector('.logoScreenSaver');

            if (!elem) {
                elem = document.createElement('div');
                elem.classList.add('logoScreenSaver');
                document.body.appendChild(elem);

                elem.innerHTML = '<img class="logoScreenSaverImage" src="assets/img/banner-light.png" />';
            }

            stopInterval();
            interval = setInterval(animate, 3000);
        });
    };

    self.hide = function () {
        stopInterval();

        const elem = document.querySelector('.logoScreenSaver');

        if (elem) {
            return new Promise((resolve) => {
                const onAnimationFinish = function () {
                    elem.parentNode.removeChild(elem);
                    resolve();
                };

                if (elem.animate) {
                    const animation = fadeOut(elem, 1);
                    animation.onfinish = onAnimationFinish;
                } else {
                    onAnimationFinish();
                }
            });
        }

        return Promise.resolve();
    };
}
