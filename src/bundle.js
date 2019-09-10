/**
 * require.js module definitions bundled by webpack
 */
// Use define from require.js not webpack's define
var _define = window.define;

var jstree = require("jstree");
var hlsjs = require("hls.js");

require("jstree/dist/themes/default/style.css");

_define("jstree", ["jQuery"], function() { return jstree; });

// 0.10.0 is the version used in the source
// the newer version doesnt look like it should cause issues
// thought we might need to add the dependencies here as well
//_define("hlsjs", ["eventemitter3", "url-toolkit"], function() { return hlsjs; });
_define("hlsjs", function() { return hlsjs; });
