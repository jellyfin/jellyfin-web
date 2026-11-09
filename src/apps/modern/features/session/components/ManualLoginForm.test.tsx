import type { Api } from '@jellyfin/sdk/lib/api';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type PropsWithChildren, type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import appSettings from 'scripts/settings/appSettings';

import ManualLoginForm, { type LoginFormError } from './ManualLoginForm';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
    }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {}
}));

vi.mock('scripts/settings/appSettings', () => ({
    default: {
        enableAutoLogin: vi.fn(() => true)
    }
}));

const TYPED_TEXT = 'correct horse';
const API = { configuration: { basePath: 'https://jellyfin.example' } } as Api;
const ALICE: UserDto = { Id: 'alice-id', Name: 'alice', PrimaryImageTag: 'tag' };
const CREDENTIALS_ERROR: LoginFormError = { kind: 'credentials', messageKey: 'MessageInvalidUser', id: 1 };
const PASSWORD_ERROR: LoginFormError = { kind: 'credentials', messageKey: 'MessageInvalidPassword', id: 1 };
const UNAUTHORIZED_ERROR: LoginFormError = { kind: 'unauthorized', messageKey: 'MessageUnauthorizedUser', id: 1 };
const CONNECTION_ERROR: LoginFormError = { kind: 'connection', messageKey: 'MessageServerUnreachable', id: 1 };

const theme = createTheme({ cssVariables: true });

const ThemeWrapper = ({ children }: PropsWithChildren) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

// rerender keeps the wrapper, so the theme stays available for the avatar
const renderForm = (ui: ReactElement) => render(ui, { wrapper: ThemeWrapper });

describe('ManualLoginForm', () => {
    beforeEach(() => {
        vi.mocked(appSettings.enableAutoLogin).mockClear();
    });

    it('focuses the username when no user was selected', () => {
        renderForm(<ManualLoginForm onSubmit={vi.fn()} />);

        expect(screen.getByLabelText(/translated:LabelUsername/)).toHaveFocus();
        // On the input itself, where it stops mobile keyboards from capitalizing the name
        expect(screen.getByLabelText(/translated:LabelUsername/)).toHaveAttribute('autocapitalize', 'off');
        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'translated:ButtonBack' })).not.toBeInTheDocument();
    });

    it('shows the selected user instead of the username field and focuses the password', () => {
        const { container } = renderForm(<ManualLoginForm user={ALICE} api={API} onSubmit={vi.fn()} />);

        expect(screen.getByRole('heading', { level: 2, name: 'alice' })).toBeInTheDocument();
        expect(screen.getByRole('form', { name: 'alice' })).toBeInTheDocument();
        expect(screen.queryByLabelText(/translated:LabelUsername/)).not.toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveFocus();
        // The name is shown next to the avatar, so the avatar is not announced too
        expect(container.querySelector('img')).toHaveAttribute('alt', '');
        expect(screen.queryByRole('img', { name: 'alice' })).not.toBeInTheDocument();

        // The username stays available to password managers
        const hiddenUsername = container.querySelector('input[autocomplete="username"]');
        expect(hiddenUsername).toHaveValue('alice');
        expect(hiddenUsername).toHaveAttribute('readonly');
        expect(hiddenUsername).toHaveAttribute('tabindex', '-1');
        expect(hiddenUsername).toHaveAttribute('aria-hidden', 'true');
    });

    it('skips the hidden username when tabbing through the selected user form', async () => {
        const user = userEvent.setup();
        renderForm(<ManualLoginForm user={ALICE} api={API} onSubmit={vi.fn()} />);

        await user.tab();
        expect(screen.getByRole('checkbox', { name: 'translated:LabelKeepMeSignedIn' })).toHaveFocus();

        // Tabbing back from the password leaves the form instead of landing on the hidden username
        await user.tab({ shift: true });
        await user.tab({ shift: true });
        expect(document.body).toHaveFocus();
    });

    it('submits the selected user with the password', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        renderForm(<ManualLoginForm user={ALICE} api={API} onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        expect(onSubmit).toHaveBeenCalledWith({ username: 'alice', password: TYPED_TEXT });
    });

    it('submits the credentials and saves the remember me setting', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn(() => Promise.resolve());
        renderForm(<ManualLoginForm onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText(/translated:LabelUsername/), 'bob');
        await user.type(screen.getByLabelText('translated:LabelPassword'), TYPED_TEXT);
        await user.click(screen.getByRole('checkbox', { name: 'translated:LabelKeepMeSignedIn' }));
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        expect(appSettings.enableAutoLogin).toHaveBeenLastCalledWith(false);
        expect(onSubmit).toHaveBeenCalledWith({ username: 'bob', password: TYPED_TEXT });
    });

    it('clears and focuses the password when the credentials are invalid', async () => {
        const user = userEvent.setup();
        const { rerender } = renderForm(<ManualLoginForm user={ALICE} api={API} onSubmit={vi.fn()} />);
        const password = screen.getByLabelText('translated:LabelPassword');
        await user.type(password, 'wrong');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        rerender(<ManualLoginForm user={ALICE} api={API} error={PASSWORD_ERROR} onSubmit={vi.fn()} />);

        expect(password).toHaveValue('');
        expect(password).toHaveFocus();
        expect(password).toHaveAttribute('aria-invalid', 'true');
        expect(password).toHaveAccessibleDescription('translated:MessageInvalidPassword');
        // The focused password announces the message, so it is not announced twice
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('announces invalid credentials when the focus was moved out of the form', async () => {
        const user = userEvent.setup();
        const ui = (error?: LoginFormError) => (
            <>
                <button>outside</button>
                <ManualLoginForm user={ALICE} api={API} error={error} onSubmit={vi.fn()} />
            </>
        );
        const { rerender } = renderForm(ui());
        const password = screen.getByLabelText('translated:LabelPassword');
        await user.type(password, 'wrong');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));
        await user.click(screen.getByRole('button', { name: 'outside' }));

        rerender(ui(PASSWORD_ERROR));

        // The focus is left where the user moved it, so the alert announces the message instead of the field
        expect(screen.getByRole('button', { name: 'outside' })).toHaveFocus();
        expect(password).toHaveValue('');
        expect(screen.getByRole('alert')).toHaveTextContent('translated:MessageInvalidPassword');
    });

    it('marks a typed username invalid too and clears the marks once the fields are edited', async () => {
        const user = userEvent.setup();
        const { rerender } = renderForm(<ManualLoginForm onSubmit={vi.fn()} />);
        await user.type(screen.getByLabelText(/translated:LabelUsername/), 'bob');
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        rerender(<ManualLoginForm error={CREDENTIALS_ERROR} onSubmit={vi.fn()} />);

        const username = screen.getByLabelText(/translated:LabelUsername/);
        const password = screen.getByLabelText('translated:LabelPassword');
        expect(username).toHaveAttribute('aria-invalid', 'true');
        expect(password).toHaveAttribute('aria-invalid', 'true');

        await user.type(password, 'new');

        expect(password).not.toHaveAttribute('aria-invalid');
        expect(username).toHaveAttribute('aria-invalid', 'true');
        // The message stays until the next attempt
        expect(screen.getByText('translated:MessageInvalidUser')).toBeInTheDocument();
    });

    it.each([ UNAUTHORIZED_ERROR, CONNECTION_ERROR ])('announces $kind errors and keeps the password', async error => {
        const user = userEvent.setup();
        const { rerender } = renderForm(<ManualLoginForm user={ALICE} api={API} onSubmit={vi.fn()} />);
        const password = screen.getByLabelText('translated:LabelPassword');
        await user.type(password, TYPED_TEXT);
        await user.click(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        rerender(<ManualLoginForm user={ALICE} api={API} error={error} onSubmit={vi.fn()} />);

        expect(screen.getByRole('alert')).toHaveTextContent(`translated:${error.messageKey}`);
        expect(password).toHaveValue(TYPED_TEXT);
        expect(password).not.toHaveAttribute('aria-invalid');
        expect(screen.getByRole('button', { name: 'translated:ButtonSignIn' })).toHaveFocus();
    });

    it('keeps the controls focusable but inactive while submitting', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        renderForm(<ManualLoginForm user={ALICE} api={API} isSubmitting onSubmit={onSubmit} onCancel={vi.fn()} />);

        const signIn = screen.getByRole('button', { name: 'translated:ButtonSignIn' });
        expect(signIn).not.toBeDisabled();
        expect(signIn).toHaveAttribute('aria-disabled', 'true');
        expect(signIn.closest('form')).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveAttribute('readonly');
        // Leaving the form would not abandon the login, so it waits for the outcome
        expect(screen.getByRole('button', { name: 'translated:ButtonChooseAnotherUser' })).toBeDisabled();

        await user.click(signIn);
        fireEvent.submit(signIn.closest('form')!);

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('disables signing in while disabled, but keeps the fields editable', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        renderForm(<ManualLoginForm disabled onSubmit={onSubmit} />);

        await user.type(screen.getByLabelText(/translated:LabelUsername/), 'alice');
        await user.type(screen.getByLabelText('translated:LabelPassword'), `${TYPED_TEXT}{Enter}`);
        // Pressing enter in a field submits the form regardless of the button, so dispatch the submit directly
        fireEvent.submit(screen.getByRole('button', { name: 'translated:ButtonSignIn' }));

        expect(screen.getByLabelText(/translated:LabelUsername/)).toHaveValue('alice');
        expect(screen.getByLabelText('translated:LabelPassword')).toHaveValue(TYPED_TEXT);
        expect(screen.getByRole('button', { name: 'translated:ButtonSignIn' })).toBeDisabled();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows a back button when cancelable', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        renderForm(<ManualLoginForm onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(screen.getByRole('button', { name: 'translated:ButtonBack' }));

        expect(onCancel).toHaveBeenCalledOnce();
    });

    it('offers to choose another user instead of going back when a user is selected', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        renderForm(<ManualLoginForm user={ALICE} api={API} onSubmit={vi.fn()} onCancel={onCancel} />);

        expect(screen.queryByRole('button', { name: 'translated:ButtonBack' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'translated:ButtonChooseAnotherUser' }));

        expect(onCancel).toHaveBeenCalledOnce();
    });
});
