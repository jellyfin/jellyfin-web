/* eslint-disable compat/compat, sonarjs/cognitive-complexity -- This opt-in desktop feature checks its required browser APIs before starting. */
import actionsheet from './actionSheet/actionSheet';
import * as store from './offlineResumeStore';
import type { OfflineResumeRecord, SaveFileHandle, SaveFilePickerOptions } from './offlineResumeStore';

const MAX_BUFFERED_BYTES = 1024 * 1024 * 1024;

export type OfflineQuality = '540p' | '720p' | '1080p';
export type OfflineSubtitleMode = 'none' | 'embed' | 'burn';

export interface OfflineTrackSelection {
    audioStreamIndex?: number | null;
    subtitleStreamIndex?: number | null;
    subtitleMode?: OfflineSubtitleMode;
}

export interface OfflineApiClient {
    getUrl(name: string, params?: Record<string, string | number | undefined | null>): string;
    accessToken(): string | null | undefined;
    getCurrentUserId(): string | null | undefined;
}

export interface OfflineMediaItem {
    Id: string;
    Name?: string | null;
}

export type OfflineJobStatus = 'Queued' | 'Preparing' | 'Ready' | 'Failed';

export interface OfflineDownloadJob {
    Id: string;
    Quality: OfflineQuality;
    AudioStreamIndex?: number | null;
    SubtitleStreamIndex?: number | null;
    SubtitleMode: OfflineSubtitleMode;
    Status: OfflineJobStatus;
    BytesProduced?: number;
    Size?: number;
    ETag?: string;
    ExpiresAt: string;
    Error?: string;
}

export interface ResumableDownloadResult {
    status: 'completed' | 'paused' | 'discarded';
    bytes?: number;
}

type WindowWithSavePicker = Window & {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;
};

export function validateTransferHeaders(response: Response, job: Pick<OfflineDownloadJob, 'Size' | 'ETag'>, offset: number): void {
    if (typeof job.Size !== 'number' || !Number.isSafeInteger(job.Size) || job.Size <= 0 || !/^"[a-f0-9]{64}"$/i.test(job.ETag || '')) {
        throw new Error('Invalid offline file identity.');
    }
    if (response.status !== (offset ? 206 : 200) || (response.headers.get('ETag') ?? '') !== (job.ETag ?? '')) {
        throw new Error('The saved file identity changed; no new bytes were appended. Discard and restart.');
    }
    if (Number(response.headers.get('Content-Length')) !== job.Size - offset) {
        throw new Error('The server returned an unexpected file length.');
    }
    if (!/^video\/mp4(?:;|$)/i.test(response.headers.get('Content-Type') || '')) {
        throw new Error('The server did not return MP4 bytes.');
    }
    if (offset && response.headers.get('Content-Range') !== `bytes ${offset}-${job.Size - 1}/${job.Size}`) {
        throw new Error('The server did not return the exact requested byte range.');
    }
}

function requestOptions(
    api: OfflineApiClient,
    method: string,
    signal?: AbortSignal,
    headers: Record<string, string> = {}
): RequestInit {
    const token = api.accessToken();
    if (!token || /[\r\n"]/.test(token)) throw new Error('Sign in before resuming a download.');
    return {
        method,
        signal,
        headers: { ...headers, Authorization: `MediaBrowser Token="${token}"` },
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error'
    };
}

async function json<T = OfflineDownloadJob>(api: OfflineApiClient, url: string, method: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, requestOptions(api, method, signal));
    if (!response.ok) throw new Error(`Offline preparation failed (HTTP ${response.status}).`);
    if (!/^application\/json(?:;|$)/i.test(response.headers.get('Content-Type') || '')) {
        throw new Error('The server returned invalid preparation metadata.');
    }
    return response.json() as Promise<T>;
}

function delay(signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const aborted = () => {
            clearTimeout(timer);
            reject(new DOMException('Paused', 'AbortError'));
        };
        const timer = setTimeout(() => {
            signal.removeEventListener('abort', aborted);
            resolve();
        }, 1000);
        if (signal.aborted) aborted();
        else signal.addEventListener('abort', aborted, { once: true });
    });
}

function randomOwner(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}

function isAbortError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';
}

export async function startResumableDownload(
    api: OfflineApiClient,
    item: OfflineMediaItem,
    quality: OfflineQuality,
    selection: OfflineTrackSelection,
    filename: string
): Promise<ResumableDownloadResult> {
    if (typeof indexedDB === 'undefined' || typeof AbortController === 'undefined' || !globalThis.crypto?.getRandomValues) {
        throw new Error('Resumable downloads need a current desktop browser with browser storage.');
    }
    const user = api.getCurrentUserId();
    if (!user) throw new Error('A signed-in user is required.');
    const query: Record<string, string | number> = { quality, subtitleMode: selection.subtitleMode || 'none' };
    if (selection.audioStreamIndex != null) query.audioStreamIndex = selection.audioStreamIndex;
    if (selection.subtitleStreamIndex != null) query.subtitleStreamIndex = selection.subtitleStreamIndex;
    const root = `Videos/${encodeURIComponent(item.Id)}/OfflineDownloads`;
    await store.prune();
    const controller = new AbortController();
    const dialog = document.createElement('dialog');
    dialog.style.maxWidth = '34em';
    dialog.style.padding = '1.5em';
    const title = document.createElement('h2');
    title.textContent = 'Resumable offline download';
    const progress = document.createElement('p');
    progress.textContent = 'Preparing a private temporary MP4. Interrupted downloads expire after 24 hours.';
    let discard = false;
    const pause = document.createElement('button');
    pause.type = 'button';
    pause.className = 'emby-button raised';
    pause.textContent = 'Pause';
    pause.addEventListener('click', () => controller.abort());
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'emby-button raised';
    remove.textContent = 'Discard temporary download';
    remove.addEventListener('click', () => {
        discard = true;
        controller.abort();
    });
    dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        controller.abort();
    });
    dialog.append(title, progress, pause, remove);
    document.body.appendChild(dialog);
    dialog.showModal();
    let job: OfflineDownloadJob | undefined;
    let key: string | undefined;
    let record: OfflineResumeRecord | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let writable: store.PartialWritableStream | undefined;
    let handle: SaveFileHandle | undefined;
    let offset = 0;
    let owner: string | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let ownershipLost = false;
    let succeeded = false;
    const discardServer = async () => {
        if (!job) return;
        // If offline, server TTL still bounds retention. Never put tokens in a URL.
        await fetch(api.getUrl(`${root}/${job.Id}`), requestOptions(api, 'DELETE')).catch(() => undefined);
    };
    try {
        job = await json(api, api.getUrl(root, query), 'POST', controller.signal);
        if (!/^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test(job.Id || '')) {
            throw new Error('Invalid temporary download id.');
        }
        key = `${api.getUrl('System/Info/Public')}|${user}|${job.Id}`;
        owner = randomOwner();
        const activeKey = key;
        const activeOwner = owner;
        await store.acquire(activeKey, activeOwner);
        heartbeat = setInterval(() => {
            store.renew(activeKey, activeOwner).catch(() => {
                ownershipLost = true;
                controller.abort();
            });
        }, 5000);
        if (job.Status === 'Queued') {
            // Deliberately do not await: poll progress while the server keeps its Prepare request scope alive.
            json(api, api.getUrl(`${root}/${job.Id}/Prepare`), 'POST', controller.signal).catch(() => undefined);
        }
        const deadline = Date.now() + 2 * 60 * 60 * 1000 + 60000;
        while (job.Status !== 'Ready') {
            if (job.Status === 'Failed') throw new Error(job.Error || 'Offline preparation failed. Discard it before retrying.');
            if (Date.now() > deadline) throw new Error('Preparation did not finish in time. It remains subject to automatic expiry.');
            progress.textContent = `Preparing the selected tracks: ${(Number(job.BytesProduced || 0) / 1048576).toFixed(1)} MiB. You can pause and return using the same choices.`;
            await delay(controller.signal);
            job = await json(api, api.getUrl(`${root}/${job.Id}`), 'GET', controller.signal);
        }
        if (typeof job.Size !== 'number' || !Number.isSafeInteger(job.Size) || job.Size <= 0 || job.Size > 2 * MAX_BUFFERED_BYTES || typeof job.ETag !== 'string' || !/^"[a-f0-9]{64}"$/i.test(job.ETag)) {
            throw new Error('Invalid completed file metadata.');
        }
        const jobSize = job.Size;
        const jobETag = job.ETag;
        record = await store.get(activeKey);
        if (record && (record.etag !== jobETag || record.size !== jobSize)) {
            throw new Error('The cached partial file no longer matches. Discard it before retrying.');
        }
        const pickerWindow = window as WindowWithSavePicker;
        const native = window.isSecureContext && typeof pickerWindow.showSaveFilePicker === 'function';
        if (record?.handle && !native) {
            throw new Error('Resume this partial file in the same direct-to-disk capable browser, or discard and choose a smaller preset.');
        }
        if (!native && jobSize > MAX_BUFFERED_BYTES) {
            discard = true;
            throw new Error('This MP4 exceeds the HTTP browser 1 GiB limit. Choose a smaller preset, or HTTPS with direct-to-disk support.');
        }
        record ||= { key: activeKey, etag: jobETag, size: jobSize, offset: 0, expiresAt: Date.parse(job.ExpiresAt) };
        if (!Number.isSafeInteger(record.offset) || record.offset < 0 || record.offset > jobSize || record.expiresAt !== Date.parse(job.ExpiresAt)) {
            throw new Error('Invalid saved partial-download metadata. Discard it before retrying.');
        }
        if (!Number.isFinite(record.expiresAt) || record.expiresAt <= Date.now()) {
            throw new Error('This temporary file expired. Discard it and prepare a new one.');
        }
        if (native && pickerWindow.showSaveFilePicker && (!record.offset || record.handle)) {
            // Restore transient user activation after metadata/polling network waits.
            dialog.close();
            const save = await actionsheet.show({
                title: record.handle ? 'Resume your saved partial MP4' : 'Save your offline MP4',
                items: [{ id: 'save', name: record.handle ? 'Continue saving the same file' : 'Choose where to save' }]
            });
            if (save !== 'save') throw new DOMException('Paused', 'AbortError');
            const accept: Record<string, string[]> = {};
            accept['video/mp4'] = ['.mp4'];
            handle = record.handle || await pickerWindow.showSaveFilePicker({
                suggestedName: filename,
                types: [{ description: 'MP4 video', accept }]
            });
            if (record.handle && await handle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
                throw new Error('Permission to resume the selected local file was not granted.');
            }
            if (record.handle && record.offset) {
                const partial = await handle.getFile();
                if (partial.size !== record.offset || partial.lastModified !== record.fileModified) {
                    throw new Error('The local partial file was edited. Discard this download before choosing a new file.');
                }
            }
            writable = await handle.createWritable({ keepExistingData: !!record.offset });
            await writable.seek(record.offset);
            record = { ...record, handle };
            dialog.showModal();
        }
        await store.renew(activeKey, activeOwner);
        await store.put(record, activeOwner);
        offset = record.offset;
        if (offset < jobSize) {
            const headers: Record<string, string> = offset ? { Range: `bytes=${offset}-`, 'If-Range': jobETag } : {};
            const response = await fetch(api.getUrl(`${root}/${job.Id}/File`), requestOptions(api, 'GET', controller.signal, headers));
            validateTransferHeaders(response, job, offset);
            if (!response.body) throw new Error('Streamed downloads are unavailable in this browser.');
            reader = response.body.getReader();
            while (true) {
                const part = await reader.read();
                if (part.done) break;
                if (offset + part.value.byteLength > jobSize) {
                    throw new Error('The response exceeded its promised size. No excess bytes were saved.');
                }
                if (writable) {
                    await store.renew(activeKey, activeOwner);
                    await writable.write(part.value);
                } else {
                    record = await store.append(record, part.value, activeOwner);
                }
                offset += part.value.byteLength;
                progress.textContent = `${(offset / 1048576).toFixed(1)} / ${(jobSize / 1048576).toFixed(1)} MiB. Pausing keeps the exact partial bytes for resume.`;
            }
        }
        if (offset !== jobSize) throw new Error('The connection ended early. Your last saved bytes are available to resume.');
        await store.renew(activeKey, activeOwner);
        if (writable) {
            await writable.close();
            writable = undefined;
        } else {
            const blob = await store.blob(record);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
        succeeded = true;
        await store.drop(activeKey);
        await discardServer();
        return { status: 'completed', bytes: offset };
    } catch (error) {
        controller.abort();
        if (reader) await reader.cancel().catch(() => undefined);
        if (writable && record && key && owner) {
            if (discard || ownershipLost || offset === record.offset || !handle) {
                await writable.abort().catch(() => undefined);
            } else {
                try {
                    await store.renew(key, owner);
                    await writable.close();
                    const partial = await handle.getFile();
                    await store.renew(key, owner);
                    await store.put({ ...record, handle, offset, fileModified: partial.lastModified }, owner);
                } catch {
                    await writable.abort().catch(() => undefined);
                }
            }
            writable = undefined;
        }
        if (discard) {
            if (key) await store.drop(key).catch(() => undefined);
            await discardServer();
            if (isAbortError(error)) return { status: 'discarded' };
        }
        if (isAbortError(error) && !ownershipLost) return { status: 'paused', bytes: offset };
        throw error;
    } finally {
        if (heartbeat) clearInterval(heartbeat);
        if (key && owner) await store.release(key, owner).catch(() => undefined);
        if (!succeeded && reader) await reader.cancel().catch(() => undefined);
        dialog.close();
        dialog.remove();
    }
}
/* eslint-enable compat/compat, sonarjs/cognitive-complexity */
