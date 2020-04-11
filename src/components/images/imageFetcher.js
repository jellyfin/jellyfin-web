define(['dom'], function (dom) {
    'use strict';

    function loadImage(elem, url) {
        if (!elem) {
            return Promise.reject('elem cannot be null');
        }

        if (elem.tagName !== "IMG") {
            elem.style.backgroundImage = "url('" + url + "')";
            return Promise.resolve();
        }
        return loadImageIntoImg(elem, url);
    }

    function unloadImage(elem) {
        if (!elem) {
            return Promise.reject('elem cannot be null');
        }

        var url;
        if (elem.tagName !== "IMG") {
            url = elem.style.backgroundImage.slice(4, -1).replace(/"/g, "");
            elem.style.backgroundImage = 'none';
        } else {
            url = elem.getAttribute("src");
            elem.setAttribute("src", "");
        }

        return Promise.resolve(url);
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
        loadImage: loadImage,
        unloadImage: unloadImage
    };

});
