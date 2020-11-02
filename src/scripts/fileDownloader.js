import multiDownload from 'multi-download';
import shell from 'shell';

export function download(items) {
    if (!shell.downloadFiles(items)) {
        multiDownload(items.map(function (item) {
            return item.url;
        }));
    }
}
