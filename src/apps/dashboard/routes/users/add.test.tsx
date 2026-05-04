import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';

import UserNew from './add';
import {
    changeCheckbox,
    clickButton,
    dismissToast as dismissToastUtil,
    dispatchFormSubmit,
    flushEffects,
    waitUntil
} from '../../features/users/testUtils';

const TEST_PASSWORD = [ 'test', 'passphrase' ].join('-');

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(),
    loadingShow: vi.fn(),
    loadingHide: vi.fn(),
    createUserMutate: vi.fn(),
    updateUserPolicyMutate: vi.fn(),
    toastOnClose: undefined as undefined | ((event: Event, reason: string) => void),
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
    }
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => mocks.navigate
}));

vi.mock('../../../../lib/globalize', () => ({
    default: {
        translate: (key: string) => key
    }
}));

vi.mock('../../../../components/loading/loading', () => ({
    default: {
        show: mocks.loadingShow,
        hide: mocks.loadingHide
    }
}));

vi.mock('../../../../components/Page', () => ({
    default: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>
}));

vi.mock('../../../../elements/SectionTitleContainer', () => ({
    default: ({ title }: { title: string }) => <div>{title}</div>
}));

vi.mock('../../../../elements/emby-input/Input', () => ({
    default: ({ id, type = 'text', required = false }: { id: string; type?: string; required?: boolean }) => (
        <input id={id} type={type} required={required} />
    )
}));

vi.mock('../../../../elements/emby-button/Button', () => ({
    default: ({ id, type = 'button', className, title }: { id?: string; type?: 'button' | 'submit'; className?: string; title: string }) => (
        <button id={id} type={type} className={className}>{title}</button>
    )
}));

vi.mock('../../../../components/dashboard/users/AccessContainer', () => ({
    default: ({
        children,
        containerClassName,
        checkBoxClassName,
        listContainerClassName,
        accessClassName
    }: React.PropsWithChildren<{
        containerClassName: string;
        checkBoxClassName: string;
        listContainerClassName: string;
        accessClassName: string;
    }>) => (
        <div className={containerClassName}>
            <input type='checkbox' className={checkBoxClassName} />
            <div className={listContainerClassName}>
                <div className={accessClassName}>{children}</div>
            </div>
        </div>
    )
}));

vi.mock('../../../../elements/CheckBoxElement', () => ({
    default: ({
        className,
        itemId,
        itemName
    }: {
        className?: string;
        itemId?: string;
        itemName?: string | null;
    }) => (
        <label>
            <input type='checkbox' className={className} data-id={itemId} />
            <span>{itemName}</span>
        </label>
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

vi.mock('apps/dashboard/features/users/api/useLibraryMediaFolders', () => ({
    useLibraryMediaFolders: () => mocks.mediaFoldersResponse
}));

vi.mock('apps/dashboard/features/users/api/useChannels', () => ({
    useChannels: () => mocks.channelsResponse
}));

vi.mock('apps/dashboard/features/users/api/useCreateUser', () => ({
    useCreateUser: () => ({
        mutate: mocks.createUserMutate
    })
}));

vi.mock('apps/dashboard/features/users/api/useUpdateUserPolicy', () => ({
    useUpdateUserPolicy: () => ({
        mutate: mocks.updateUserPolicyMutate
    })
}));

describe('UserNew', () => {
    let container: HTMLDivElement;
    let root: Root;
    let historyBackSpy: ReturnType<typeof vi.spyOn>;

    const renderPage = async () => {
        flushSync(() => {
            root = createRoot(container);
            root.render(<UserNew />);
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

        mocks.mediaFoldersResponse.isSuccess = true;
        mocks.mediaFoldersResponse.data.Items = [
            { Id: 'folder-1', Name: 'Movies' }
        ];
        mocks.channelsResponse.isSuccess = true;
        mocks.channelsResponse.data.Items = [
            { Id: 'channel-1', Name: 'News' }
        ];
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

    it('loads the access lists, toggles the list visibility, and supports cancel navigation', async () => {
        await renderPage();

        await waitUntil(() => {
            expect(container.querySelectorAll('.chkFolder')).toHaveLength(1);
            expect(container.querySelectorAll('.chkChannel')).toHaveLength(1);
        });

        expect(mocks.loadingShow).toHaveBeenCalledOnce();
        expect(mocks.loadingHide).toHaveBeenCalledOnce();
        expect(container.querySelector('.channelAccessContainer')?.classList.contains('hide')).toBe(false);

        await changeCheckbox(container, '.chkEnableAllChannels', true);
        expect(container.querySelector('.channelAccessListContainer')?.classList.contains('hide')).toBe(true);

        await changeCheckbox(container, '.chkEnableAllChannels', false);
        expect(container.querySelector('.channelAccessListContainer')?.classList.contains('hide')).toBe(false);

        await changeCheckbox(container, '.chkEnableAllFolders', true);
        expect(container.querySelector('.folderAccessListContainer')?.classList.contains('hide')).toBe(true);

        await changeCheckbox(container, '.chkEnableAllFolders', false);
        expect(container.querySelector('.folderAccessListContainer')?.classList.contains('hide')).toBe(false);

        await clickButton(container, '#btnCancel');

        expect(historyBackSpy).toHaveBeenCalledOnce();
    });

    it('keeps the channel access section hidden when there are no channels', async () => {
        mocks.channelsResponse.data.Items = [];

        await renderPage();

        expect(container.querySelector('.channelAccessContainer')?.classList.contains('hide')).toBe(true);
        expect(container.querySelectorAll('.chkChannel')).toHaveLength(0);
    });

    it('hides loading and shows the server validation message when creating a user fails', async () => {
        mocks.createUserMutate.mockImplementation((params, options) => {
            expect(params).toEqual({
                createUserByName: {
                    Name: 'test / test',
                    Password: TEST_PASSWORD
                }
            });

            options?.onError?.({
                response: {
                    data: {
                        message: 'Usernames can contain unicode symbols, numbers (0-9), dashes (-), underscores (_), apostrophes (\'), and periods (.)'
                    }
                }
            });
        });

        await renderPage();

        mocks.loadingShow.mockClear();
        mocks.loadingHide.mockClear();

        (container.querySelector('#txtUsername') as HTMLInputElement).value = 'test / test';
        (container.querySelector('#txtPassword') as HTMLInputElement).value = TEST_PASSWORD;

        await dispatchFormSubmit(container, '.newUserProfileForm');

        expect(mocks.loadingShow).toHaveBeenCalledOnce();
        expect(mocks.loadingHide).toHaveBeenCalledOnce();
        expect(container.querySelector('[data-testid="toast-message"]')?.textContent).toContain('Usernames can contain unicode symbols');
        expect(mocks.updateUserPolicyMutate).not.toHaveBeenCalled();
        expect(mocks.navigate).not.toHaveBeenCalled();
    });

    it('falls back to the default error message when the create failure has no message', async () => {
        mocks.createUserMutate.mockImplementation((_params, options) => {
            options?.onError?.({});
        });

        await renderPage();

        mocks.loadingShow.mockClear();
        mocks.loadingHide.mockClear();

        (container.querySelector('#txtUsername') as HTMLInputElement).value = 'valid-name';

        await dispatchFormSubmit(container, '.newUserProfileForm');

        expect(mocks.loadingHide).toHaveBeenCalledOnce();
        expect(container.querySelector('[data-testid="toast-message"]')?.textContent).toBe('ErrorDefault');
    });

    it('closes the error toast when dismissed', async () => {
        mocks.createUserMutate.mockImplementation((_params, options) => {
            options?.onError?.({});
        });

        await renderPage();
        await dispatchFormSubmit(container, '.newUserProfileForm');

        await dismissToast();

        expect(container.querySelector('[data-testid="toast"]')).toBeNull();
    });

    it('hides loading and shows the nested policy update error message', async () => {
        mocks.createUserMutate.mockImplementation((_params, options) => {
            options?.onSuccess?.({
                data: {
                    Id: 'user-1',
                    Policy: {}
                }
            });
        });

        mocks.updateUserPolicyMutate.mockImplementation((_params, options) => {
            options?.onError?.(new Error('Policy update failed'));
        });

        await renderPage();

        mocks.loadingShow.mockClear();
        mocks.loadingHide.mockClear();

        (container.querySelector('#txtUsername') as HTMLInputElement).value = 'valid-name';
        (container.querySelector('#txtPassword') as HTMLInputElement).value = TEST_PASSWORD;

        await dispatchFormSubmit(container, '.newUserProfileForm');

        expect(mocks.createUserMutate).toHaveBeenCalledOnce();
        expect(mocks.updateUserPolicyMutate).toHaveBeenCalledOnce();
        expect(mocks.loadingHide).toHaveBeenCalledOnce();
        expect(container.querySelector('[data-testid="toast-message"]')?.textContent).toContain('Policy update failed');
        expect(mocks.navigate).not.toHaveBeenCalled();
    });

    it('submits individually selected folder and channel access ids', async () => {
        mocks.createUserMutate.mockImplementation((_params, options) => {
            options?.onSuccess?.({
                data: {
                    Id: 'user-1',
                    Policy: {}
                }
            });
        });

        mocks.updateUserPolicyMutate.mockImplementation((params, options) => {
            expect(params).toEqual({
                userId: 'user-1',
                userPolicy: {
                    EnableAllFolders: false,
                    EnabledFolders: ['folder-1'],
                    EnableAllChannels: false,
                    EnabledChannels: ['channel-1']
                }
            });

            options?.onSuccess?.();
        });

        await renderPage();
        await waitUntil(() => {
            expect(container.querySelectorAll('.chkFolder')).toHaveLength(1);
            expect(container.querySelectorAll('.chkChannel')).toHaveLength(1);
        });

        (container.querySelector('#txtUsername') as HTMLInputElement).value = 'valid-name';
        (container.querySelector('#txtPassword') as HTMLInputElement).value = TEST_PASSWORD;
        (container.querySelector('.chkFolder') as HTMLInputElement).checked = true;
        (container.querySelector('.chkChannel') as HTMLInputElement).checked = true;

        await dispatchFormSubmit(container, '.newUserProfileForm');

        expect(mocks.navigate).toHaveBeenCalledWith('/dashboard/users/user-1/profile');
    });

    it('submits full-access policy updates and navigates on success', async () => {
        mocks.createUserMutate.mockImplementation((_params, options) => {
            options?.onSuccess?.({
                data: {
                    Id: 'user-1',
                    Policy: {}
                }
            });
        });

        mocks.updateUserPolicyMutate.mockImplementation((params, options) => {
            expect(params).toEqual({
                userId: 'user-1',
                userPolicy: {
                    EnableAllFolders: true,
                    EnabledFolders: [],
                    EnableAllChannels: true,
                    EnabledChannels: []
                }
            });

            options?.onSuccess?.();
        });

        await renderPage();

        (container.querySelector('#txtUsername') as HTMLInputElement).value = 'valid-name';
        (container.querySelector('#txtPassword') as HTMLInputElement).value = TEST_PASSWORD;
        await changeCheckbox(container, '.chkEnableAllFolders', true);
        await changeCheckbox(container, '.chkEnableAllChannels', true);

        await dispatchFormSubmit(container, '.newUserProfileForm');

        expect(mocks.createUserMutate).toHaveBeenCalledOnce();
        expect(mocks.updateUserPolicyMutate).toHaveBeenCalledOnce();
        expect(mocks.navigate).toHaveBeenCalledWith('/dashboard/users/user-1/profile');
    });
});
