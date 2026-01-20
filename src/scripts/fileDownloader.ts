import multiDownload from './multiDownload';
import shell, { DownloadItem } from './shell';

export function download(items: DownloadItem[]): void {
    if (!shell.downloadFiles(items)) {
        multiDownload(items.map((item) => item.url));
    }
}

const fileDownloader = { download };
export default fileDownloader;
