define(['dom'], function (dom) {
    'use strict';

    // Firefox doesn't upload images to the GPU unless they are part of the DOM
    // This hack eliminates the brief flicker while the image is uploaded

    function createPreloader() {
        var img = document.createElement('img');
        img.style.position = 'fixed';
        img.width = 5;
        img.height = 5;
        img.style.left = "-10px";
        document.body.appendChild(img);
        return img;
    }

    function loadImage(elem, url) {

        if (!elem) {
            return Promise.reject('elem cannot be null');
        }

        if (elem.tagName !== "IMG") {
            var preloader = createPreloader();
            return loadImageIntoImg(preloader, url).then(function () {
                document.body.removeChild(preloader);
                elem.style.backgroundImage = "url('" + url + "')";
                return Promise.resolve();
            });

        }
        return loadImageIntoImg(elem, url);
    }

    function loadImageIntoImg(elem, url) {
        return new Promise(function (resolve, reject) {

            dom.addEventListener(elem, 'load', resolve, {
                once: true
            });
            elem.setAttribute("src", url);
        });
    }

    return {
        loadImage: loadImage
    };

});
