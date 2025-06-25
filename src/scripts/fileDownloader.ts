import multiDownload from './multiDownload';
import shell from './shell';

export function download(items: any[]) {
    if (!shell.downloadFiles(items)) {
        multiDownload(items.map(function (item) {
            return item.url;
        }));
    }
}
