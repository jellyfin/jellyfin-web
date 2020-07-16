/**
 * require.js module definitions bundled by webpack
 */
// Use define from require.js not webpack's define
const _define = window.define;

// fetch
const fetch = require('whatwg-fetch');
_define('fetch', function() {
    return fetch;
});

// Blurhash
const blurhash = require('blurhash');
_define('blurhash', function() {
    return blurhash;
});

// query-string
const query = require('query-string');
_define('queryString', function() {
    return query;
});

// flvjs
const flvjs = require('flv.js/dist/flv').default;
_define('flvjs', function() {
    return flvjs;
});

// jstree
const jstree = require('jstree');
require('jstree/dist/themes/default/style.css');
_define('jstree', function() {
    return jstree;
});

// jquery
const jquery = require('jquery');
_define('jQuery', function() {
    return jquery;
});

// hlsjs
const hlsjs = require('hls.js');
_define('hlsjs', function() {
    return hlsjs;
});

// howler
const howler = require('howler');
_define('howler', function() {
    return howler;
});

// resize-observer-polyfill
const resize = require('resize-observer-polyfill').default;
_define('resize-observer-polyfill', function() {
    return resize;
});

// swiper
const swiper = require('swiper/js/swiper');
require('swiper/css/swiper.min.css');
_define('swiper', function() {
    return swiper;
});

// sortable
const sortable = require('sortablejs').default;
_define('sortable', function() {
    return sortable;
});

// webcomponents
const webcomponents = require('webcomponents.js/webcomponents-lite');
_define('webcomponents', function() {
    return webcomponents;
});

// shaka
const shaka = require('shaka-player');
_define('shaka', function() {
    return shaka;
});

// libass-wasm
const libassWasm = require('libass-wasm');
_define('JavascriptSubtitlesOctopus', function() {
    return libassWasm;
});

// material-icons
const materialIcons = require('material-design-icons-iconfont/dist/material-design-icons.css');
_define('material-icons', function() {
    return materialIcons;
});

// noto font
const noto = require('jellyfin-noto');
_define('jellyfin-noto', function () {
    return noto;
});

const epubjs = require('epubjs');
_define('epubjs', function () {
    return epubjs;
});

// page.js
const page = require('page');
_define('page', function() {
    return page;
});

// core-js
const polyfill = require('@babel/polyfill/dist/polyfill');
_define('polyfill', function () {
    return polyfill;
});

// domtokenlist-shim
const classlist = require('classlist.js');
_define('classlist-polyfill', function () {
    return classlist;
});

// Date-FNS
const dateFns = require('date-fns');
_define('date-fns', function () {
    return dateFns;
});

const dateFnsLocale = require('date-fns/locale');
_define('date-fns/locale', function () {
    return dateFnsLocale;
});

const fast_text_encoding = require('fast-text-encoding');
_define('fast-text-encoding', function () {
    return fast_text_encoding;
});

// intersection-observer
const intersection_observer = require('intersection-observer');
_define('intersection-observer', function () {
    return intersection_observer;
});

// screenfull
const screenfull = require('screenfull');
_define('screenfull', function () {
    return screenfull;
});

// headroom.js
const headroom = require('headroom.js/dist/headroom');
_define('headroom', function () {
    return headroom;
});

// apiclient
const apiclient = require('jellyfin-apiclient');

_define('apiclient', function () {
    return apiclient.ApiClient;
});

_define('events', function () {
    return apiclient.Events;
});

_define('credentialprovider', function () {
    return apiclient.Credentials;
});

_define('connectionManagerFactory', function () {
    return apiclient.ConnectionManager;
});

_define('appStorage', function () {
    return apiclient.AppStorage;
});
