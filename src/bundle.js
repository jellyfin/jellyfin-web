/**
 * require.js module definitions bundled by webpack
 */
// Use define from require.js not webpack's define
var _define = window.define;

// jstree
var jstree = require("jstree");
require("jstree/dist/themes/default/style.css");
_define("jstree", ["jQuery"], function() { return jstree; });

// hlsjs
var hlsjs = require("hls.js");
_define("hlsjs", function() { return hlsjs; });
