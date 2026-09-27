import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';
import PlayedButton from './PlayedButton';

// Tell React we are in a test environment that supports act()
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('hooks/useFetchItems', () => ({
    useTogglePlayedMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined) })
}));

vi.mock('lib/globalize', () => ({
    default: { translate: (key: string) => key }
}));

describe('PlayedButton focus behavior (issue #8542)', () => {
    let container: HTMLDivElement;

    afterEach(() => {
        document.body.innerHTML = '';
    });

    const renderButton = async () => {
        container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        await act(async () => {
            root.render(
                <QueryClientProvider client={new QueryClient()}>
                    <PlayedButton isPlayed={false} itemId='item1' itemType='Movie' />
                </QueryClientProvider>
            );
        });
        const button = container.querySelector('button');
        if (!button) throw new Error('button not rendered');
        return button;
    };

    test('pointer click releases focus so :focus-within overlay can hide', async () => {
        const button = await renderButton();
        button.focus();
        expect(document.activeElement).toBe(button);

        await act(async () => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
        });

        expect(document.activeElement).not.toBe(button);
    });

    test('keyboard click keeps focus', async () => {
        const button = await renderButton();
        button.focus();
        expect(document.activeElement).toBe(button);

        await act(async () => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
        });

        expect(document.activeElement).toBe(button);
    });
});
