define(["pluginManager"], function (pluginManager) {

    return function () {

        var self = this;

        self.name = "Logo ScreenSaver";
        self.type = "screensaver";
        self.id = "logoscreensaver";
        self.supportsAnonymous = true;

        var interval;

        function animate() {

            var animations = [

                bounceInLeft,
                bounceInRight,
                swing,
                tada,
                wobble,
                rotateIn,
                rotateOut
            ];

            var elem = document.querySelector(".logoScreenSaverImage");

            if (elem && elem.animate) {
                var random = getRandomInt(0, animations.length - 1);

                animations[random](elem, 1);
            }
        }

        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function bounceInLeft(elem, iterations) {
            var keyframes = [
                { transform: "translate3d(-3000px, 0, 0)", opacity: "0", offset: 0 },
                { transform: "translate3d(25px, 0, 0)", opacity: "1", offset: 0.6 },
                { transform: "translate3d(-100px, 0, 0)", offset: 0.75 },
                { transform: "translate3d(5px, 0, 0)", offset: 0.9 },
                { transform: "none", opacity: "1", offset: 1 }];
            var timing = { duration: 900, iterations: iterations, easing: "cubic-bezier(0.215, 0.610, 0.355, 1.000)" };
            return elem.animate(keyframes, timing);
        }

        function bounceInRight(elem, iterations) {
            var keyframes = [
                { transform: "translate3d(3000px, 0, 0)", opacity: "0", offset: 0 },
                { transform: "translate3d(-25px, 0, 0)", opacity: "1", offset: 0.6 },
                { transform: "translate3d(100px, 0, 0)", offset: 0.75 },
                { transform: "translate3d(-5px, 0, 0)", offset: 0.9 },
                { transform: "none", opacity: "1", offset: 1 }];
            var timing = { duration: 900, iterations: iterations, easing: "cubic-bezier(0.215, 0.610, 0.355, 1.000)" };
            return elem.animate(keyframes, timing);
        }

        function shake(elem, iterations) {
            var keyframes = [
                { transform: "translate3d(0, 0, 0)", offset: 0 },
                { transform: "translate3d(-10px, 0, 0)", offset: 0.1 },
                { transform: "translate3d(10px, 0, 0)", offset: 0.2 },
                { transform: "translate3d(-10px, 0, 0)", offset: 0.3 },
                { transform: "translate3d(10px, 0, 0)", offset: 0.4 },
                { transform: "translate3d(-10px, 0, 0)", offset: 0.5 },
                { transform: "translate3d(10px, 0, 0)", offset: 0.6 },
                { transform: "translate3d(-10px, 0, 0)", offset: 0.7 },
                { transform: "translate3d(10px, 0, 0)", offset: 0.8 },
                { transform: "translate3d(-10px, 0, 0)", offset: 0.9 },
                { transform: "translate3d(0, 0, 0)", offset: 1 }];
            var timing = { duration: 900, iterations: iterations };
            return elem.animate(keyframes, timing);
        }

        function swing(elem, iterations) {
            var keyframes = [
                { transform: "translate(0%)", offset: 0 },
                { transform: "rotate3d(0, 0, 1, 15deg)", offset: 0.2 },
                { transform: "rotate3d(0, 0, 1, -10deg)", offset: 0.4 },
                { transform: "rotate3d(0, 0, 1, 5deg)", offset: 0.6 },
                { transform: "rotate3d(0, 0, 1, -5deg)", offset: 0.8 },
                { transform: "rotate3d(0, 0, 1, 0deg)", offset: 1 }];
            var timing = { duration: 900, iterations: iterations };
            return elem.animate(keyframes, timing);
        }

        function tada(elem, iterations) {
            var keyframes = [
                { transform: "scale3d(1, 1, 1)", offset: 0 },
                { transform: "scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)", offset: 0.1 },
                { transform: "scale3d(.9, .9, .9) rotate3d(0, 0, 1, -3deg)", offset: 0.2 },
                { transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)", offset: 0.3 },
                { transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)", offset: 0.4 },
                { transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)", offset: 0.5 },
                { transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)", offset: 0.6 },
                { transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)", offset: 0.7 },
                { transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)", offset: 0.8 },
                { transform: "scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)", offset: 0.9 },
                { transform: "scale3d(1, 1, 1)", offset: 1 }];
            var timing = { duration: 900, iterations: iterations };
            return elem.animate(keyframes, timing);
        }

        function wobble(elem, iterations) {
            var keyframes = [
                { transform: "translate(0%)", offset: 0 },
                { transform: "translate3d(20%, 0, 0) rotate3d(0, 0, 1, 3deg)", offset: 0.15 },
                { transform: "translate3d(-15%, 0, 0) rotate3d(0, 0, 1, -3deg)", offset: 0.45 },
                { transform: "translate3d(10%, 0, 0) rotate3d(0, 0, 1, 2deg)", offset: 0.6 },
                { transform: "translate3d(-5%, 0, 0) rotate3d(0, 0, 1, -1deg)", offset: 0.75 },
                { transform: "translateX(0%)", offset: 1 }];
            var timing = { duration: 900, iterations: iterations };
            return elem.animate(keyframes, timing);
        }

        function rotateIn(elem, iterations) {
            var transformOrigin = elem.style["transform-origin"];
            var keyframes = [{ transform: "rotate3d(0, 0, 1, -200deg)", opacity: "0", transformOrigin: "center", offset: 0 },
                { transform: "none", opacity: "1", transformOrigin: "center", offset: 1 }];
            var timing = { duration: 900, iterations: iterations };
            return elem.animate(keyframes, timing);
        }

        function rotateOut(elem, iterations) {
            var transformOrigin = elem.style["transform-origin"];
            var keyframes = [{ transform: "none", opacity: "1", transformOrigin: "center", offset: 0 },
                { transform: "rotate3d(0, 0, 1, 200deg)", opacity: "0", transformOrigin: "center", offset: 1 }];
            var timing = { duration: 900, iterations: iterations };
            return elem.animate(keyframes, timing);

        }

        function fadeOut(elem, iterations) {
            var keyframes = [
                { opacity: "1", offset: 0 },
                { opacity: "0", offset: 1 }];
            var timing = { duration: 400, iterations: iterations };
            return elem.animate(keyframes, timing);
        }

        function stopInterval() {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        }

        self.show = function () {

            require(["css!" + pluginManager.mapPath(self, "style.css")], function () {

                var elem = document.querySelector(".logoScreenSaver");

                if (!elem) {
                    elem = document.createElement("div");
                    elem.classList.add("logoScreenSaver");
                    document.body.appendChild(elem);

                    elem.innerHTML = '<img class="logoScreenSaverImage" src="assets/img/banner-light.png" />';
                }

                stopInterval();
                interval = setInterval(animate, 3000);
            });
        };

        self.hide = function () {

            stopInterval();

            var elem = document.querySelector(".logoScreenSaver");

            if (elem) {

                var onAnimationFinish = function () {
                    elem.parentNode.removeChild(elem);
                };

                if (elem.animate) {
                    var animation = fadeOut(elem, 1);
                    animation.onfinish = onAnimationFinish;
                } else {
                    onAnimationFinish();
                }
            }
        };
    }
});
