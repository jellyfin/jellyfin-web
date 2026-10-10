import React, { act, type PropsWithChildren } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventType } from 'constants/eventType';
import Events from 'utils/events';

const mocks = vi.hoisted(() => ({
    mainTabsManager: Promise.resolve({
        selectedTabIndex: vi.fn(),
        setTabs: vi.fn()
    })
}));

vi.mock('../../lib/globalize', () => ({
    default: { translate: (key: string) => key }
}));
vi.mock('../../components/backdrop/backdrop', () => ({ clearBackdrop: vi.fn() }));
vi.mock('../../components/layoutManager', () => ({ default: { tv: false } }));
vi.mock('../../components/Page', () => ({
    default: ({ children }: PropsWithChildren) => children
}));
vi.mock('../../scripts/libraryMenu', () => ({
    default: { setTitle: vi.fn() }
}));
vi.mock('../../components/maintabsmanager', () => mocks.mainTabsManager);
vi.mock('../../elements/emby-tabs/emby-tabs', () => ({}));
vi.mock('../../elements/emby-button/emby-button', () => ({}));
vi.mock('../../elements/emby-scroller/emby-scroller', () => ({}));

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
};

const createDeferred = <T,>(): Deferred<T> => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(promiseResolve => {
        resolve = promiseResolve;
    });

    return { promise, resolve };
};

describe('Home header lifecycle', () => {
    let root: Root | undefined;

    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = '';
        (globalThis as unknown as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;
    });

    afterEach(async () => {
        if (root) {
            await act(async () => root?.unmount());
            root = undefined;
        }
        document.body.innerHTML = '';
    });

    const renderHome = async () => {
        const container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        const { default: Home } = await import('./routes/home');

        await act(async () => {
            root?.render(
                <MemoryRouter>
                    <Home />
                </MemoryRouter>
            );
        });
    };

    it('does not restore the Home header class after deferred work completes', async () => {
        const deferred = createDeferred<{
            selectedTabIndex: ReturnType<typeof vi.fn>;
            setTabs: ReturnType<typeof vi.fn>;
        }>();
        mocks.mainTabsManager = deferred.promise;

        const header = document.createElement('div');
        header.className = 'skinHeader';
        header.append(Object.assign(document.createElement('div'), { className: 'headerTabs' }));
        document.body.append(header);

        await renderHome();
        await act(async () => root?.unmount());
        root = undefined;

        const mainTabsManager = {
            selectedTabIndex: vi.fn(),
            setTabs: vi.fn()
        };
        deferred.resolve(mainTabsManager);
        await act(async () => Promise.resolve());

        expect(mainTabsManager.selectedTabIndex).toHaveBeenCalled();
        expect(header.classList).not.toContain('noHomeButtonHeader');
    });

    it('owns the Home header class for the mounted lifecycle', async () => {
        const header = document.createElement('div');
        header.className = 'skinHeader';
        header.append(Object.assign(document.createElement('div'), { className: 'headerTabs' }));
        document.body.append(header);

        await renderHome();

        expect(header.classList).toContain('noHomeButtonHeader');

        await act(async () => root?.unmount());
        root = undefined;

        expect(header.classList).not.toContain('noHomeButtonHeader');
    });

    it('does not throw when the header is absent during cleanup', async () => {
        await renderHome();

        await expect(act(async () => root?.unmount())).resolves.toBeUndefined();
        root = undefined;
    });

    it('updates a header rendered after Home mounts and removes its listener on unmount', async () => {
        await renderHome();

        const header = document.createElement('div');
        header.className = 'skinHeader';
        header.append(Object.assign(document.createElement('div'), { className: 'headerTabs' }));
        document.body.append(header);

        await act(async () => Events.trigger(document, EventType.HEADER_RENDERED));
        expect(header.classList).toContain('noHomeButtonHeader');

        await act(async () => root?.unmount());
        root = undefined;
        expect(header.classList).not.toContain('noHomeButtonHeader');

        await act(async () => Events.trigger(document, EventType.HEADER_RENDERED));
        expect(header.classList).not.toContain('noHomeButtonHeader');
    });
});
