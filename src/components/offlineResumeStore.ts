// Local partial bytes only; never persist access tokens. Server expiry is authoritative.
let database: Promise<IDBDatabase> | undefined;
const LEASE_MS = 120000;

export interface SaveFilePickerAcceptOption {
    description?: string;
    accept: Record<string, string[]>;
}

export interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: SaveFilePickerAcceptOption[];
}

export interface PartialWritableStream {
    write(data: Uint8Array): Promise<void>;
    seek(position: number): Promise<void>;
    close(): Promise<void>;
    abort(): Promise<void>;
}

export interface SaveFileHandle {
    requestPermission(descriptor: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
    getFile(): Promise<File>;
    createWritable(options?: { keepExistingData?: boolean }): Promise<PartialWritableStream>;
}

export interface OfflineResumeRecord {
    key: string;
    etag: string;
    size: number;
    offset: number;
    expiresAt: number;
    handle?: SaveFileHandle;
    fileModified?: number;
}

interface OfflineResumeChunk {
    key: string;
    offset: number;
    bytes: Uint8Array;
}

interface OfflineResumeLease {
    key: string;
    owner: string;
    until: number;
}

function db(): Promise<IDBDatabase> {
    if (!database) {
        database = new Promise((resolve, reject) => {
            const request = indexedDB.open('jellyfin-offline-resume-v2', 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore('records', { keyPath: 'key' });
                request.result.createObjectStore('chunks', { keyPath: ['key', 'offset'] });
                request.result.createObjectStore('leases', { keyPath: 'key' });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Browser storage is unavailable; resumable downloads need IndexedDB.'));
            request.onblocked = () => reject(new Error('Close other Jellyfin tabs and retry browser storage.'));
        });
    }
    return database;
}

async function run<T = void>(
    stores: string[],
    mode: IDBTransactionMode,
    action: (tx: IDBTransaction, done: (value: T) => void, fail: (message: string) => void) => void
): Promise<T> {
    const connection = await db();
    return new Promise<T>((resolve, reject) => {
        const transaction = connection.transaction(stores, mode);
        let result!: T;
        let failure: Error | undefined;
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = transaction.onabort = () => reject(
            failure || new Error('Browser storage failed or its quota was reached. Your last saved partial download is retained.')
        );
        const fail = (message: string) => {
            failure = new Error(message);
            transaction.abort();
        };
        action(transaction, (value: T) => {
            result = value;
        }, fail);
    });
}

const range = (key: string) => IDBKeyRange.bound([key, 0], [key, Number.MAX_SAFE_INTEGER]);

export async function acquire(key: string, owner: string): Promise<boolean> {
    return run<boolean>(['leases'], 'readwrite', (tx, done, fail) => {
        const store = tx.objectStore('leases');
        const request = store.get(key) as IDBRequest<OfflineResumeLease | undefined>;
        request.onsuccess = () => {
            if (request.result && request.result.owner !== owner && request.result.until > Date.now()) {
                fail('This download is already open in another tab. Pause it there first.');
                return;
            }
            store.put({ key, owner, until: Date.now() + LEASE_MS });
            done(true);
        };
    });
}

export async function renew(key: string, owner: string): Promise<boolean> {
    return run<boolean>(['leases'], 'readwrite', (tx, done, fail) => {
        const store = tx.objectStore('leases');
        const request = store.get(key) as IDBRequest<OfflineResumeLease | undefined>;
        request.onsuccess = () => {
            if (request.result?.owner !== owner) {
                fail('This download was resumed in another tab. This tab will stop without overwriting it.');
                return;
            }
            store.put({ key, owner, until: Date.now() + LEASE_MS });
            done(true);
        };
    });
}

export async function release(key: string, owner: string): Promise<void> {
    return run<void>(['leases'], 'readwrite', (tx) => {
        const store = tx.objectStore('leases');
        const request = store.get(key) as IDBRequest<OfflineResumeLease | undefined>;
        request.onsuccess = () => {
            if (request.result?.owner === owner) store.delete(key);
        };
    });
}

export async function get(key: string): Promise<OfflineResumeRecord | undefined> {
    return run<OfflineResumeRecord | undefined>(['records'], 'readonly', (tx, done) => {
        const request = tx.objectStore('records').get(key) as IDBRequest<OfflineResumeRecord | undefined>;
        request.onsuccess = () => done(request.result);
    });
}

export async function put(record: OfflineResumeRecord, owner: string): Promise<boolean> {
    return run<boolean>(['records', 'leases'], 'readwrite', (tx, done, fail) => {
        const lease = tx.objectStore('leases').get(record.key) as IDBRequest<OfflineResumeLease | undefined>;
        lease.onsuccess = () => {
            if (lease.result?.owner !== owner) {
                fail('Download ownership changed to another tab.');
                return;
            }
            tx.objectStore('records').put(record);
            done(true);
        };
    });
}

export async function append(record: OfflineResumeRecord, bytes: Uint8Array, owner: string): Promise<OfflineResumeRecord> {
    return run<OfflineResumeRecord>(['records', 'chunks', 'leases'], 'readwrite', (tx, done, fail) => {
        const lease = tx.objectStore('leases').get(record.key) as IDBRequest<OfflineResumeLease | undefined>;
        lease.onsuccess = () => {
            if (lease.result?.owner !== owner) {
                fail('Download ownership changed to another tab.');
                return;
            }
            const request = tx.objectStore('records').get(record.key) as IDBRequest<OfflineResumeRecord | undefined>;
            request.onsuccess = () => {
                const current = request.result;
                if (current?.offset !== record.offset || current?.etag !== record.etag) {
                    fail('The partial download changed. Resume it from its current tab.');
                    return;
                }
                const next: OfflineResumeRecord = { ...current, offset: current.offset + bytes.byteLength };
                const chunk: OfflineResumeChunk = { key: record.key, offset: current.offset, bytes };
                tx.objectStore('chunks').put(chunk);
                tx.objectStore('records').put(next);
                done(next);
            };
        };
    });
}

export async function blob(record: OfflineResumeRecord): Promise<Blob> {
    return run<Blob>(['chunks'], 'readonly', (tx, done, fail) => {
        const request = tx.objectStore('chunks').getAll(range(record.key)) as IDBRequest<OfflineResumeChunk[]>;
        request.onsuccess = () => {
            let offset = 0;
            const buffers: BlobPart[] = [];
            for (const chunk of request.result) {
                if (chunk.offset !== offset) {
                    fail('The saved partial download has a gap; discard it before retrying.');
                    return;
                }
                offset += chunk.bytes.byteLength;
                buffers.push(chunk.bytes as unknown as BlobPart);
            }
            if (offset !== record.size) {
                fail('The saved download is incomplete.');
                return;
            }
            done(new Blob(buffers, { type: 'video/mp4' }));
        };
    });
}

export async function drop(key: string): Promise<void> {
    return run<void>(['records', 'chunks'], 'readwrite', (tx) => {
        tx.objectStore('records').delete(key);
        tx.objectStore('chunks').delete(range(key));
    });
}

export async function prune(): Promise<void> {
    const records = await run<OfflineResumeRecord[]>(['records'], 'readonly', (tx, done) => {
        const request = tx.objectStore('records').getAll() as IDBRequest<OfflineResumeRecord[]>;
        request.onsuccess = () => done(request.result);
    });
    for (const record of records) {
        // A closed browser cannot run a timer: local expired bytes are purged on the next visit.
        if (record.expiresAt <= Date.now()) await drop(record.key);
    }
}
