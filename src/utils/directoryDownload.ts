export interface DirectoryDownloadItem {
    url: string;
    filename: string;
    /** Folder names, relative to the chosen directory, to save the file in */
    folders?: string[];
}

/** Characters that are not allowed in file or folder names on Windows, macOS or Linux */
// eslint-disable-next-line no-control-regex
const INVALID_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

/** Makes a name safe to use as a single file or folder name */
export function sanitizeFileName(name: string): string {
    const sanitized = name.replace(INVALID_NAME_CHARS, '_').trim();

    // Windows does not allow names ending in a space or period
    let end = sanitized.length;
    while (end > 0 && (sanitized[end - 1] === '.' || sanitized[end - 1] === ' ')) {
        end--;
    }
    return sanitized.slice(0, end);
}

/** Returns true if the browser can save downloads into a folder chosen by the user */
export function supportsDirectoryDownload(): boolean {
    return typeof window.showDirectoryPicker === 'function';
}

/**
 * Asks the user to pick a folder to save downloads into.
 * Must be called in response to a user action. Rejects with an AbortError if the user cancels.
 */
export function pickDownloadDirectory(): Promise<FileSystemDirectoryHandle> {
    if (!window.showDirectoryPicker) {
        return Promise.reject(new Error('Directory picker is not supported'));
    }

    return window.showDirectoryPicker({ id: 'jellyfin-downloads', mode: 'readwrite' });
}

async function getSubdirectory(root: FileSystemDirectoryHandle, folders: string[]) {
    let directory = root;
    for (const folder of folders) {
        const name = sanitizeFileName(folder);
        if (name) {
            directory = await directory.getDirectoryHandle(name, { create: true });
        }
    }
    return directory;
}

async function saveFile(root: FileSystemDirectoryHandle, item: DirectoryDownloadItem) {
    const response = await fetch(item.url);
    if (!response.ok || !response.body) {
        throw new Error(`Download failed with status ${response.status}`);
    }

    const directory = await getSubdirectory(root, item.folders ?? []);
    const fileHandle = await directory.getFileHandle(sanitizeFileName(item.filename), { create: true });
    const writable = await fileHandle.createWritable();
    // Streams to disk without buffering the whole file in memory. The file is only
    // written once the stream completes, and pipeTo aborts the writable on failure.
    await response.body.pipeTo(writable);
}

/**
 * Downloads files one at a time into folders under the given directory.
 * @returns The items that failed to download.
 */
export async function downloadToDirectory(
    root: FileSystemDirectoryHandle,
    items: DirectoryDownloadItem[]
): Promise<DirectoryDownloadItem[]> {
    const failed: DirectoryDownloadItem[] = [];

    for (const item of items) {
        try {
            await saveFile(root, item);
        } catch (err) {
            console.error('[directoryDownload] failed to download', item.filename, err);
            failed.push(item);
        }
    }

    return failed;
}
