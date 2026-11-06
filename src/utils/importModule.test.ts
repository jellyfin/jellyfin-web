import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { importModule } from './importModule';

const getLoaderScript = () => document.head.querySelector<HTMLScriptElement>('script[type="module"]');

const getLoaderSource = (blob: Blob) => new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsText(blob);
});

const getVector = (source: string) => /window\.(\$importModule\$\w+) = m;/.exec(source)?.[1];

describe('importModule', () => {
    let blobs: Blob[];

    beforeEach(() => {
        blobs = [];
        Object.defineProperty(HTMLScriptElement.prototype, 'noModule', { configurable: true, value: false });
        URL.createObjectURL = vi.fn((blob: Blob) => {
            blobs.push(blob);
            return 'blob:test';
        });
        URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        delete (HTMLScriptElement.prototype as Partial<HTMLScriptElement>).noModule;
        document.head.innerHTML = '';
    });

    it('should resolve with the module exported by the loader', async () => {
        const promise = importModule('https://example.com/web/controller.js');
        const vector = getVector(await getLoaderSource(blobs[0]));
        const module = { default: () => null };

        expect(vector).toBeDefined();
        (window as unknown as Record<string, unknown>)[vector as string] = module;
        getLoaderScript()?.dispatchEvent(new Event('load'));

        await expect(promise).resolves.toBe(module);
        expect(getLoaderScript()).toBeNull();
        expect(vector as string in window).toBe(false);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });

    it('should reject when the module fails to evaluate', async () => {
        const promise = importModule('https://example.com/web/controller.js');
        getLoaderScript()?.dispatchEvent(new Event('load'));

        await expect(promise).rejects.toThrow('module failed to evaluate');
        expect(getLoaderScript()).toBeNull();
    });

    it('should reject when the module fails to load', async () => {
        const promise = importModule('https://example.com/web/controller.js');
        getLoaderScript()?.dispatchEvent(new Event('error'));

        await expect(promise).rejects.toThrow('Failed to import: https://example.com/web/controller.js');
        expect(getLoaderScript()).toBeNull();
    });

    it('should reject when module scripts are not supported', async () => {
        delete (HTMLScriptElement.prototype as Partial<HTMLScriptElement>).noModule;

        await expect(importModule('https://example.com/web/controller.js')).rejects.toThrow('not supported');
        expect(getLoaderScript()).toBeNull();
    });

    it('should escape the url in the loader source', async () => {
        void importModule('https://example.com/web/configurationpage?name=a\\b"c');
        const source = await getLoaderSource(blobs[0]);

        expect(source).toMatch(/^import \* as m from "https:\/\/example\.com\/web\/configurationpage\?name=a\\\\b%22c";/);
    });
});
