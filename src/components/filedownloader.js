import multiDownload from 'multi-download';

export function download(items) {

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
