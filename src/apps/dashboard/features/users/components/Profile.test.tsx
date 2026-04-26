import React, { type InputHTMLAttributes } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import type { SyncPlayUserAccessType, UserDto } from '@jellyfin/sdk/lib/generated-client';

import Profile from './Profile';
import {
    changeCheckbox,
    clickButton,
    cloneJson,
    dismissToast as dismissToastUtil,
    dispatchFormSubmit,
    flushEffects,
    waitUntil
} from '../testUtils';

const PASSWORD_RESET_PROVIDER_ID = [ 'sso', 'provider' ].join('-');

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(),
    loadingShow: vi.fn(),
    loadingHide: vi.fn(),
    setTitle: vi.fn(),
    updateUserMutate: vi.fn(),
    updateUserPolicyMutate: vi.fn(),
    toastOnClose: undefined as undefined | ((event: Event, reason: string) => void),
    authProvidersResponse: {
        data: [
            { Id: 'auth', Name: 'Default' }
        ],
        isSuccess: true
    },
    passwordResetProvidersResponse: {
        data: [
            { Id: 'reset', Name: 'Default' }
        ],
        isSuccess: true
    },
    mediaFoldersResponse: {
        data: {
            Items: [
                { Id: 'folder-1', Name: 'Movies' }
            ]
        },
        isSuccess: true
    },
    channelsResponse: {
        data: {
            Items: [
                { Id: 'channel-1', Name: 'News' }
            ]
        },
        isSuccess: true
    },
    networkConfigResponse: {
        data: {
            EnableRemoteAccess: true
        },
        isSuccess: true
    }
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mocks.navigate
}));

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => key
    }
}));

vi.mock('components/loading/loading', () => ({
    default: {
        show: mocks.loadingShow,
        hide: mocks.loadingHide
    }
}));

vi.mock('elements/emby-input/Input', () => ({
    default: ({ id, type = 'text', required = false, min, step, inputMode, pattern }: {
        id: string;
        type?: string;
        required?: boolean;
        min?: number | string;
        step?: number | string;
        inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
        pattern?: string;
    }) => (
        <input id={id} type={type} required={required} min={min} step={step} inputMode={inputMode} pattern={pattern} />
    )
}));

vi.mock('elements/emby-button/Button', () => ({
    default: ({ id, type = 'button', className, title }: { id?: string; type?: 'button' | 'submit'; className?: string; title: string }) => (
        <button id={id} type={type} className={className}>{title}</button>
    )
}));

vi.mock('elements/emby-button/LinkButton', () => ({
    default: ({ children, href, className }: React.PropsWithChildren<{ href?: string; className?: string }>) => (
        <a href={href} className={className}>{children}</a>
    )
}));

vi.mock('elements/CheckBoxElement', () => ({
    default: ({
        className,
        itemId,
        itemName,
        labelClassName,
        itemCheckedAttribute
    }: {
        className?: string;
        itemId?: string;
        itemName?: string | null;
        labelClassName?: string;
        itemCheckedAttribute?: string;
    }) => (
        <label className={labelClassName}>
            <input
                type='checkbox'
                className={className}
                data-id={itemId}
                defaultChecked={itemCheckedAttribute === ' checked="checked"'}
            />
            <span>{itemName}</span>
        </label>
    )
}));

vi.mock('elements/SelectElement', () => ({
    default: ({ id }: { id: string }) => (
        <select id={id} defaultValue=''>
            <option value=''>default</option>
            <option value='None'>None</option>
            <option value='CreateAndJoinGroups'>CreateAndJoinGroups</option>
        </select>
    )
}));

vi.mock('apps/dashboard/components/Toast', () => ({
    default: ({ open, message, onClose }: { open?: boolean; message?: string; onClose?: (event: Event, reason: string) => void }) => {
        mocks.toastOnClose = onClose;

        return open ? (
            <div data-testid='toast'>
                <span data-testid='toast-message'>{message}</span>
                <button
                    type='button'
                    data-testid='toast-close'
                >
                    close
                </button>
            </div>
        ) : null;
    }
}));

vi.mock('scripts/libraryMenu', () => ({
    default: {
        setTitle: mocks.setTitle
    }
}));

vi.mock('apps/dashboard/features/users/api/useAuthProviders', () => ({
    useAuthProviders: () => mocks.authProvidersResponse
}));

vi.mock('apps/dashboard/features/users/api/usePasswordResetProviders', () => ({
    usePasswordResetProviders: () => mocks.passwordResetProvidersResponse
}));

vi.mock('apps/dashboard/features/users/api/useLibraryMediaFolders', () => ({
    useLibraryMediaFolders: () => mocks.mediaFoldersResponse
}));

vi.mock('apps/dashboard/features/users/api/useChannels', () => ({
    useChannels: () => mocks.channelsResponse
}));

vi.mock('apps/dashboard/features/users/api/useNetworkConfig', () => ({
    useNetworkConfig: () => mocks.networkConfigResponse
}));

vi.mock('apps/dashboard/features/users/api/useUpdateUser', () => ({
    useUpdateUser: () => ({
        mutate: mocks.updateUserMutate
    })
}));

vi.mock('apps/dashboard/features/users/api/useUpdateUserPolicy', () => ({
    useUpdateUserPolicy: () => ({
        mutate: mocks.updateUserPolicyMutate
    })
}));

describe('Profile', () => {
    let container: HTMLDivElement;
    let root: Root;
    let historyBackSpy: ReturnType<typeof vi.spyOn>;

    const createUserDto = (): UserDto => ({
        Id: 'user-1',
        Name: 'Existing User',
        Policy: {
            AuthenticationProviderId: '',
            PasswordResetProviderId: '',
            SyncPlayAccess: 'None' as SyncPlayUserAccessType
        }
    });

    const renderPage = async (userOverride = createUserDto()) => {
        flushSync(() => {
            root = createRoot(container);
            root.render(<Profile userDto={cloneJson(userOverride)} />);
        });

        await flushEffects();
    };

    const dismissToast = async () => {
        await dismissToastUtil(mocks.toastOnClose);
    };

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
        mocks.toastOnClose = undefined;

        mocks.authProvidersResponse.data = [
            { Id: 'auth', Name: 'Default' }
        ];
        mocks.authProvidersResponse.isSuccess = true;
        mocks.passwordResetProvidersResponse.data = [
            { Id: 'reset', Name: 'Default' }
        ];
        mocks.passwordResetProvidersResponse.isSuccess = true;
        mocks.mediaFoldersResponse.data.Items = [
            { Id: 'folder-1', Name: 'Movies' }
        ];
        mocks.mediaFoldersResponse.isSuccess = true;
        mocks.channelsResponse.data.Items = [
            { Id: 'channel-1', Name: 'News' }
        ];
        mocks.channelsResponse.isSuccess = true;
        mocks.networkConfigResponse.data.EnableRemoteAccess = true;
        mocks.networkConfigResponse.isSuccess = true;
    });

    afterEach(async () => {
        if (root) {
            flushSync(() => {
                root.unmount();
            });
        }

        container.remove();
        historyBackSpy.mockRestore();
        vi.clearAllMocks();
    });

    it('renders the loaded profile state, access lists, and interactive toggles', async () => {
        mocks.authProvidersResponse.data = [
            { Id: 'auth', Name: 'Default' },
            { Id: 'ldap', Name: 'LDAP' }
        ];
        mocks.passwordResetProvidersResponse.data = [
            { Id: 'reset', Name: 'Default' },
            { Id: 'sso', Name: 'SSO' }
        ];
        mocks.networkConfigResponse.data.EnableRemoteAccess = false;

        const userDto = createUserDto();
        userDto.Name = 'Disabled User';
        userDto.Policy = {
            AuthenticationProviderId: 'ldap',
            PasswordResetProviderId: PASSWORD_RESET_PROVIDER_ID,
            SyncPlayAccess: 'CreateAndJoinGroups' as SyncPlayUserAccessType,
            IsDisabled: true,
            EnableRemoteAccess: false,
            EnableContentDeletionFromFolders: ['folder-1', 'channel-1'],
            RemoteClientBitrateLimit: 4250000,
            LoginAttemptsBeforeLockout: 5,
            MaxActiveSessions: 3
        };

        await renderPage(userDto);

        await waitUntil(() => {
            expect(mocks.setTitle).toHaveBeenCalledWith('Disabled User');
            expect(container.querySelectorAll('.deleteAccess .chkFolder')).toHaveLength(2);
        });

        expect(mocks.loadingHide).toHaveBeenCalled();
        expect(container.querySelector('.fldSelectLoginProvider')?.classList.contains('hide')).toBe(false);
        expect(container.querySelector('.fldSelectPasswordResetProvider')?.classList.contains('hide')).toBe(false);
        expect(container.querySelector('.fldRemoteAccess')?.classList.contains('hide')).toBe(true);
        expect(container.querySelector('.disabledUserBanner')?.classList.contains('hide')).toBe(false);
        expect((container.querySelector('#txtUserName') as HTMLInputElement).value).toBe('Disabled User');
        expect((container.querySelector('#txtRemoteClientBitrateLimit') as HTMLInputElement).value).toBe('4.25');
        expect((container.querySelector('#txtLoginAttemptsBeforeLockout') as HTMLInputElement).value).toBe('5');
        expect((container.querySelector('#txtMaxActiveSessions') as HTMLInputElement).value).toBe('3');
        await changeCheckbox(container, '.chkEnableDeleteAllFolders', true);
        expect(container.querySelector('.deleteAccess')?.classList.contains('hide')).toBe(true);

        await changeCheckbox(container, '.chkEnableDeleteAllFolders', false);
        expect(container.querySelector('.deleteAccess')?.classList.contains('hide')).toBe(false);

        await clickButton(container, '#btnCancel');
        expect(historyBackSpy).toHaveBeenCalledOnce();
    });

    it('hides loading and shows the server validation message when updating a user fails', async () => {
        mocks.updateUserMutate.mockImplementation((params, options) => {
            expect(params.userDto.Name).toBe('test / test');

            options?.onError?.({
                response: {
                    data: 'Usernames can contain unicode symbols, numbers (0-9), dashes (-), underscores (_), apostrophes (\'), and periods (.)'
                }
            });
        });

        await renderPage();

        mocks.loadingShow.mockClear();
        mocks.loadingHide.mockClear();

        (container.querySelector('#txtUserName') as HTMLInputElement).value = 'test / test';

        await dispatchFormSubmit(container, '.editUserProfileForm');

        expect(mocks.loadingShow).toHaveBeenCalledOnce();
        expect(mocks.loadingHide).toHaveBeenCalledOnce();
        expect(container.querySelector('[data-testid="toast-message"]')?.textContent).toContain('Usernames can contain unicode symbols');
        expect(mocks.updateUserPolicyMutate).not.toHaveBeenCalled();
        expect(mocks.navigate).not.toHaveBeenCalled();
    });

    it('falls back to the default error message when the update failure has no message', async () => {
        mocks.updateUserMutate.mockImplementation((_params, options) => {
            options?.onError?.({});
        });

        await renderPage();

        mocks.loadingShow.mockClear();
        mocks.loadingHide.mockClear();

        await dispatchFormSubmit(container, '.editUserProfileForm');

        expect(mocks.loadingHide).toHaveBeenCalledOnce();
        expect(container.querySelector('[data-testid="toast-message"]')?.textContent).toBe('ErrorDefault');
    });

    it('closes the error toast when dismissed', async () => {
        mocks.updateUserMutate.mockImplementation((_params, options) => {
            options?.onError?.({});
        });

        await renderPage();
        await dispatchFormSubmit(container, '.editUserProfileForm');
        await dismissToast();

        expect(container.querySelector('[data-testid="toast"]')).toBeNull();
    });

    it('hides loading and shows the nested policy update error message', async () => {
        mocks.updateUserMutate.mockImplementation((_params, options) => {
            options?.onSuccess?.({}, { userId: 'user-1', userDto: cloneJson(createUserDto()) }, undefined);
        });

        mocks.updateUserPolicyMutate.mockImplementation((_params, options) => {
            options?.onError?.(new Error('Policy update failed'));
        });

        await renderPage();

        mocks.loadingShow.mockClear();
        mocks.loadingHide.mockClear();

        (container.querySelector('#txtUserName') as HTMLInputElement).value = 'valid-name';

        await dispatchFormSubmit(container, '.editUserProfileForm');

        expect(mocks.updateUserMutate).toHaveBeenCalledOnce();
        expect(mocks.updateUserPolicyMutate).toHaveBeenCalledOnce();
        expect(mocks.loadingHide).toHaveBeenCalledOnce();
        expect(container.querySelector('[data-testid="toast-message"]')?.textContent).toContain('Policy update failed');
        expect(mocks.navigate).not.toHaveBeenCalled();
    });

    it('submits the edited user policy and navigates with a saved toast on success', async () => {
        mocks.updateUserMutate.mockImplementation((params, options) => {
            expect(params.userId).toBe('user-1');
            expect(params.userDto.Name).toBe('Updated Name');
            expect(params.userDto.Policy.EnableRemoteAccess).toBe(true);
            expect(params.userDto.Policy.EnableContentDeletion).toBe(false);
            expect(params.userDto.Policy.EnableContentDeletionFromFolders).toEqual(['folder-1', 'channel-1']);
            expect(params.userDto.Policy.RemoteClientBitrateLimit).toBe(3500000);
            expect(params.userDto.Policy.LoginAttemptsBeforeLockout).toBe(7);
            expect(params.userDto.Policy.MaxActiveSessions).toBe(9);
            expect(params.userDto.Policy.SyncPlayAccess).toBe('CreateAndJoinGroups');

            options?.onSuccess?.({}, params, undefined);
        });

        mocks.updateUserPolicyMutate.mockImplementation((params, options) => {
            expect(params.userId).toBe('user-1');
            expect(params.userPolicy.EnableContentDeletionFromFolders).toEqual(['folder-1', 'channel-1']);
            options?.onSuccess?.();
        });

        await renderPage();

        await waitUntil(() => {
            expect(container.querySelectorAll('.deleteAccess .chkFolder')).toHaveLength(2);
        });

        mocks.loadingShow.mockClear();
        mocks.loadingHide.mockClear();

        (container.querySelector('#txtUserName') as HTMLInputElement).value = '  Updated Name  ';
        (container.querySelector('#txtRemoteClientBitrateLimit') as HTMLInputElement).value = '3.5';
        (container.querySelector('#txtLoginAttemptsBeforeLockout') as HTMLInputElement).value = '7';
        (container.querySelector('#txtMaxActiveSessions') as HTMLInputElement).value = '9';
        (container.querySelector('#selectSyncPlayAccess') as HTMLSelectElement).value = 'CreateAndJoinGroups';
        (container.querySelector('.chkRemoteAccess') as HTMLInputElement).checked = true;
        (container.querySelectorAll('.deleteAccess .chkFolder')[0] as HTMLInputElement).checked = true;
        (container.querySelectorAll('.deleteAccess .chkFolder')[1] as HTMLInputElement).checked = true;

        await dispatchFormSubmit(container, '.editUserProfileForm');

        expect(mocks.updateUserMutate).toHaveBeenCalledOnce();
        expect(mocks.updateUserPolicyMutate).toHaveBeenCalledOnce();
        expect(mocks.loadingHide).toHaveBeenCalledOnce();
        expect(mocks.navigate).toHaveBeenCalledWith('/dashboard/users', {
            state: { openSavedToast: true }
        });
    });
});
