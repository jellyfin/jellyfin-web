/**
 * require.js module definitions bundled by webpack
 */
// Use define from require.js not webpack's define
var _define = window.define;

// jstree
var jstree = require("jstree");
require("jstree/dist/themes/default/style.css");
_define("jstree", function() { return jstree; });

// jquery
var jquery = require("jquery");
_define("jQuery", function() { return jquery; });

// hlsjs
var hlsjs = require("hls.js");
_define("hlsjs", function() { return hlsjs; });

// howler
var howler = require("howler");
_define("howler", function() { return howler; });

// swiper
var swiper = require("swiper");
require("swiper/dist/css/swiper.min.css");
_define("swiper", function() { return swiper; });

// sortable
var sortable = require("sortablejs");
_define("sortable", function() { return sortable; });

// libjass
var libjass = require("libjass");
require("libjass/libjass.css");
_define("libjass", function() { return libjass; });
