import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component } from './repositories';

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock('lib/globalize', () => ({ default: { translate: (key: string) => key } }));
vi.mock('components/Page', () => ({ default: ({ children }: React.PropsWithChildren) => <div>{children}</div> }));
vi.mock('components/loading/LoadingComponent', () => ({ default: () => null }));
vi.mock('apps/dashboard/features/plugins/components/RepositoryListItem', () => ({ default: () => null }));
vi.mock('apps/dashboard/features/plugins/api/useRepositories', () => ({
    useRepositories: () => ({ data: [], isPending: false, isError: false })
}));
vi.mock('apps/dashboard/features/plugins/api/useSetRepositories', () => ({
    useSetRepositories: () => ({ mutate, isPending: false })
}));

describe('Adding a plugin repository', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        // React requires this exact global name for act() in custom test environments.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        mutate.mockReset();
        act(() => root.render(<Component />));
        const button = container.querySelector('button');
        act(() => button?.click());
        const name = document.querySelector<HTMLInputElement>('input[name="Name"]');
        const url = document.querySelector<HTMLInputElement>('input[name="Url"]');
        name!.value = 'Invalid repository';
        url!.value = 'https://example.com/missing.json';
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it('keeps the entered values and shows an error when adding fails', () => {
        mutate.mockImplementation((_params, options) => {
            options.onError?.(new Error('404'));
            options.onSettled?.();
        });
        act(() => {
            document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        expect(document.querySelector('[role="dialog"]')?.getAttribute('aria-hidden')).not.toBe('true');
        expect(document.querySelector('[role="alert"]')?.textContent).toBe('RepositoryAddError');
        expect(document.querySelector<HTMLInputElement>('input[name="Url"]')?.value).toBe('https://example.com/missing.json');
    });

    it('requests validation of the new repository before saving', () => {
        act(() => {
            document.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        expect(mutate.mock.calls[0][0].validateRepository).toEqual({
            Name: 'Invalid repository', Url: 'https://example.com/missing.json', Enabled: true
        });
    });
});
