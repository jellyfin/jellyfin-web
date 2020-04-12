define(['multi-download'], function (multiDownload) {
    'use strict';

    return {
        download: function (items) {

            if (window.NativeShell) {
                items.map(function (item) {
                    window.NativeShell.downloadFile(item);
                });
            } else {
                multiDownload(items.map(function (item) {
                    return item.url;
                }));
            }
        }
    };
});
