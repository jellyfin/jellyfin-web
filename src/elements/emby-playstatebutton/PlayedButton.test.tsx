import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import toast from 'components/toast/toast';

import PlayedButton from './PlayedButton';

const { markPlayedItem, markUnplayedItem } = vi.hoisted(() => ({
    markPlayedItem: vi.fn(),
    markUnplayedItem: vi.fn()
}));

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
    }
}));

vi.mock('components/toast/toast', () => ({
    default: vi.fn()
}));

vi.mock('hooks/useApi', () => ({
    useApi: () => ({ api: {}, user: { Id: 'user-1' } })
}));

vi.mock('@jellyfin/sdk/lib/utils/api/user-data-api', () => ({
    getUserDataApi: () => ({ markPlayedItem, markUnplayedItem })
}));

interface UserDataResponse {
    data: { Played: boolean }
}

function deferred() {
    let resolve!: (value: UserDataResponse) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<UserDataResponse>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function setup(isPlayed: boolean) {
    const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } }
    });
    render(
        <QueryClientProvider client={queryClient}>
            <PlayedButton isPlayed={isPlayed} itemId='item-1' itemType='Episode' />
        </QueryClientProvider>
    );
    return screen.getByRole('button');
}

describe('PlayedButton', () => {
    it('shows the new state at once and settles when the server responds', async () => {
        const request = deferred();
        markPlayedItem.mockReturnValueOnce(request.promise);
        const button = setup(false);
        expect(button).toHaveAttribute('title', 'translated:MarkPlayed');

        fireEvent.click(button);

        expect(button).toHaveAttribute('title', 'translated:Watched');
        await waitFor(() => expect(button).toBeDisabled());
        expect(markPlayedItem).toHaveBeenCalledWith({ userId: 'user-1', itemId: 'item-1' });

        request.resolve({ data: { Played: true } });

        await waitFor(() => expect(button).toBeEnabled());
        expect(button).toHaveAttribute('title', 'translated:Watched');
    });

    it('ignores further clicks while a request is pending', async () => {
        const request = deferred();
        markPlayedItem.mockReturnValueOnce(request.promise);
        const button = setup(false);

        fireEvent.click(button);
        await waitFor(() => expect(button).toBeDisabled());
        fireEvent.click(button);
        request.resolve({ data: { Played: true } });

        await waitFor(() => expect(button).toBeEnabled());
        expect(markPlayedItem).toHaveBeenCalledTimes(1);
        expect(markUnplayedItem).not.toHaveBeenCalled();
    });

    it('reverts and shows an error toast when the request fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        markUnplayedItem.mockRejectedValueOnce(new Error('offline'));
        const button = setup(true);
        expect(button).toHaveAttribute('title', 'translated:Watched');

        fireEvent.click(button);

        expect(button).toHaveAttribute('title', 'translated:MarkPlayed');
        await waitFor(() => expect(button).toHaveAttribute('title', 'translated:Watched'));
        expect(button).toBeEnabled();
        expect(toast).toHaveBeenCalledWith('translated:ErrorDefault');
    });
});
