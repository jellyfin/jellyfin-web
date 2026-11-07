import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import appSettings from 'scripts/settings/appSettings';

import ManualLoginForm from './ManualLoginForm';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
    }
}));

vi.mock('scripts/settings/appSettings', () => ({
    default: {
        enableAutoLogin: vi.fn(() => true)
    }
}));

const TYPED_TEXT = 'correct horse';

describe('ManualLoginForm', () => {
    beforeEach(() => {
        vi.mocked(appSettings.enableAutoLogin).mockClear();
    });

    it('focuses the username when no user was selected', () => {
        render(<ManualLoginForm onSubmit={vi.fn()} />);

        expect(screen.getByLabelText(/translated:LabelUser/)).toHaveFocus();
        expect(screen.queryByRole('button', { name: 'translated:ButtonCancel' })).not.toBeInTheDocument();
    });

    it('prefills the selected user and focuses the password', () => {
        render(<ManualLoginForm initialUsername='alice' onSubmit={vi.fn()} />);

        expect(screen.getByLabelText(/translated:LabelUser/)).toHaveValue('alice');
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveFocus();
    });

    it('submits the credentials and saves the remember me setting', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn(() => Promise.resolve());
        render(<ManualLoginForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText(/translated:LabelUser/), 'bob');
        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('checkbox', { name: 'translated:RememberMe' }));
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        expect(appSettings.enableAutoLogin).toHaveBeenLastCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({ username: 'bob', password: TYPED_TEXT });
    });

    it('clears the password when the login fails', async () => {
        const user = userEvent.setup();
        render(<ManualLoginForm initialUsername='alice' onSubmit={() => Promise.reject(new Error('401'))} />);

        const password = screen.getByLabelText('translated:LabelPassword');
        await user.type(password, 'wrong');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        expect(password).toHaveValue('');
        expect(screen.getByLabelText(/translated:LabelUser/)).toHaveValue('alice');
    });

    it('shows a cancel button when cancelable', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        render(<ManualLoginForm onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: 'translated:ButtonCancel' }));

        expect(onCancel).toHaveBeenCalledOnce();
    });
});
