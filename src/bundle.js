/**
 * require.js module definitions bundled by webpack
 */
// Use define from require.js not webpack's define
var _define = window.define;

// document-register-element
var docRegister = require("document-register-element");
_define("document-register-element", function() {
    return docRegister;
});

// fetch
var fetch = require("whatwg-fetch");
_define("fetch", function() {
    return fetch
});

// flvjs
var flvjs = require("flv.js").default;
_define("flvjs", function() {
    return flvjs;
});

// jstree
var jstree = require("jstree");
require("jstree/dist/themes/default/style.css");
_define("jstree", function() {
    return jstree;
});

// jquery
var jquery = require("jquery");
_define("jQuery", function() {
    return jquery;
});

// hlsjs
var hlsjs = require("hls.js");
_define("hlsjs", function() {
    return hlsjs;
});

// howler
var howler = require("howler");
_define("howler", function() {
    return howler;
});

// native-promise-only
var nativePromise = require("native-promise-only");
_define("native-promise-only", function() {
    return nativePromise;
});

// resize-observer-polyfill
var resize = require("resize-observer-polyfill").default;
_define("resize-observer-polyfill", function() {
    return resize;
});

// shaka
var shaka = require("shaka-player");
_define("shaka", function() {
    return shaka;
});

// swiper
var swiper = require("swiper");
require("swiper/dist/css/swiper.min.css");
_define("swiper", function() {
    return swiper;
});

// sortable
var sortable = require("sortablejs").default;
_define("sortable", function() {
    return sortable;
});

// webcomponents
var webcomponents = require("webcomponents.js/webcomponents-lite");
_define("webcomponents", function() {
    return webcomponents
});

// libjass
var libjass = require("libjass");
require("libjass/libjass.css");
_define("libjass", function() {
    return libjass;
});

// libass-wasm
var libass_wasm = require("libass-wasm");
_define("JavascriptSubtitlesOctopus", function() {
    return libass_wasm;
});
