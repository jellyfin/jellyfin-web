import multiDownload from './multiDownload';
import shell from './shell';

export function download(items) {
    if (!shell.downloadFiles(items)) {
        multiDownload(items.map((item) => {
            return item.url;
        }));
    }
}
