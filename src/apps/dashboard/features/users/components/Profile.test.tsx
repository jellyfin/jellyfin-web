import type { UserDto, UserPolicy } from '@jellyfin/sdk/lib/generated-client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from 'test/renderWithRouter';

import Profile from './Profile';

const { updateUser, updatePolicy, hideLoading, setTitle } = vi.hoisted(() => ({
    updateUser: vi.fn(),
    updatePolicy: vi.fn(),
    hideLoading: vi.fn(),
    setTitle: vi.fn()
}));

vi.mock('apps/dashboard/features/users/api/useAuthProviders', () => ({ useAuthProviders: () => ({}) }));
vi.mock('apps/dashboard/features/users/api/usePasswordResetProviders', () => ({ usePasswordResetProviders: () => ({}) }));
vi.mock('apps/dashboard/features/users/api/useLibraryMediaFolders', () => ({ useLibraryMediaFolders: () => ({}) }));
vi.mock('apps/dashboard/features/users/api/useChannels', () => ({ useChannels: () => ({}) }));
vi.mock('apps/dashboard/features/users/api/useNetworkConfig', () => ({ useNetworkConfig: () => ({}) }));
vi.mock('apps/dashboard/features/users/api/useUpdateUser', () => ({
    useUpdateUser: () => ({ mutateAsync: updateUser })
}));
vi.mock('apps/dashboard/features/users/api/useUpdateUserPolicy', () => ({
    useUpdateUserPolicy: () => ({ mutateAsync: updatePolicy })
}));
vi.mock('components/loading/loading', () => ({ default: { show: vi.fn(), hide: hideLoading } }));
vi.mock('scripts/libraryMenu', () => ({ default: { setTitle } }));
vi.mock('components/layoutManager', () => ({ default: { tv: false } }));
vi.mock('elements/emby-button/LinkButton', () => ({ default: () => null }));
vi.mock('lib/globalize', () => ({ default: { translate: (key: string) => key } }));

const limitLabel = 'LabelUserMaxActiveVideoStreams';

function renderProfile(limit?: number) {
    const policy: UserPolicy & { MaxActiveVideoStreams?: number } = {
        AuthenticationProviderId: '',
        PasswordResetProviderId: '',
        MaxActiveSessions: 0,
        IsAdministrator: true
    };
    if (limit !== undefined) {
        policy.MaxActiveVideoStreams = limit;
    }
    const userDto: UserDto = { Id: 'user-id', Name: 'Viewer', Policy: policy };
    const result = renderWithRouter(<Profile userDto={userDto} />);
    return { ...result, policy, save: screen.getByRole('button', { name: 'Save' }) };
}

describe('administrative video stream limit', () => {
    beforeEach(() => {
        updateUser.mockReset().mockResolvedValue(undefined);
        updatePolicy.mockReset().mockResolvedValue(undefined);
        hideLoading.mockClear();
    });

    it.each([0, 1, 4, 2147483647])('saves %i as an integer without mutating the original policy', async (limit) => {
        const { policy, save } = renderProfile(2);
        const input = screen.getByRole('spinbutton', { name: limitLabel });

        expect(input).toHaveValue(2);
        fireEvent.change(input, { target: { value: String(limit) } });
        fireEvent.click(save);

        await waitFor(() => expect(updatePolicy).toHaveBeenCalledWith({
            userId: 'user-id',
            userPolicy: expect.objectContaining({ MaxActiveVideoStreams: limit, IsAdministrator: true })
        }));
        expect(policy.MaxActiveVideoStreams).toBe(2);
    });

    it('shows a saved zero', () => {
        renderProfile(0);
        expect(screen.getByRole('spinbutton', { name: limitLabel })).toHaveValue(0);
    });

    it.each(['', '-1', '0.5', '2147483648'])('rejects invalid input "%s" before either request', (value) => {
        const { save } = renderProfile(2);
        const input = screen.getByRole('spinbutton', { name: limitLabel });
        fireEvent.change(input, { target: { value } });
        const form = save.closest('form');
        expect(form).not.toBeNull();
        fireEvent.submit(form!);

        expect(input).toBeInvalid();
        expect(updateUser).not.toHaveBeenCalled();
        expect(updatePolicy).not.toHaveBeenCalled();
    });

    it('omits the field on a server with a legacy policy', async () => {
        const { save } = renderProfile();
        expect(screen.queryByRole('spinbutton', { name: limitLabel })).not.toBeInTheDocument();
        fireEvent.click(save);

        await waitFor(() => expect(updatePolicy).toHaveBeenCalledOnce());
        expect(updatePolicy.mock.calls[0][0].userPolicy).not.toHaveProperty('MaxActiveVideoStreams');
    });

    it('stops after an unsuccessful user update', async () => {
        updateUser.mockRejectedValueOnce(new Error('update user'));
        const { save } = renderProfile(1);
        fireEvent.click(save);

        expect(await screen.findByText('ErrorDefault')).toBeVisible();
        expect(updatePolicy).not.toHaveBeenCalled();
        expect(hideLoading).toHaveBeenCalledTimes(2);
    });

    it('keeps the entered value and allows retry after an unsuccessful policy update', async () => {
        updatePolicy.mockRejectedValueOnce(new Error('update policy'));
        const { save } = renderProfile(1);
        const input = screen.getByRole('spinbutton', { name: limitLabel });
        fireEvent.change(input, { target: { value: '3' } });
        fireEvent.click(save);

        expect(await screen.findByText('ErrorSavingUserPolicy')).toBeVisible();
        expect(hideLoading).toHaveBeenCalledTimes(2);
        expect(input).toHaveValue(3);

        fireEvent.click(save);
        await waitFor(() => expect(updatePolicy).toHaveBeenCalledTimes(2));
    });
});
