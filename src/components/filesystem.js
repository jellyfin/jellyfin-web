define([], function () {
    'use strict';

    return {
        fileExists: function (path) {
            if (window.NativeShell && window.NativeShell.FileSystem) {
                return window.NativeShell.FileSystem.fileExists(path);
            }
            return Promise.reject();
        },
        directoryExists: function (path) {
            if (window.NativeShell && window.NativeShell.FileSystem) {
                return window.NativeShell.FileSystem.directoryExists(path);
            }
            return Promise.reject();
        }
    };
});
