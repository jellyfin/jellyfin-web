import { createTheme, ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type PropsWithChildren, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import AddServerForm from './AddServerForm';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => `translated:${key}`
    }
}));

const theme = createTheme({ cssVariables: true });

const ThemeWrapper = ({ children }: PropsWithChildren) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const renderForm = (ui: ReactElement) => ({
    user: userEvent.setup(),
    ...render(ui, { wrapper: ThemeWrapper })
});

const getAddressField = () => screen.getByLabelText(/translated:LabelServerHost/);
const getConnectButton = () => screen.getByRole('button', { name: 'translated:Connect' });
const getCancelButton = () => screen.getByRole('button', { name: 'translated:ButtonCancel' });

describe('AddServerForm', () => {
    it('focuses the address field, which opens a url keyboard without corrections', () => {
        const { container } = renderForm(<AddServerForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

        const field = getAddressField();
        expect(field).toHaveFocus();
        expect(field).toHaveAttribute('type', 'url');
        expect(field).toHaveAttribute('autocomplete', 'url');
        expect(field).toBeRequired();
        // On the input itself, where they stop mobile keyboards from changing the address
        expect(field).toHaveAttribute('autocapitalize', 'off');
        expect(field).toHaveAttribute('autocorrect', 'off');
        expect(field).toHaveAttribute('spellcheck', 'false');
        expect(field).toHaveAccessibleDescription('translated:LabelServerHostHelp');
        expect(container.querySelector('form')).toHaveAttribute('novalidate');
    });

    it('submits the normalized address', async () => {
        const onSubmit = vi.fn();
        const { user } = renderForm(<AddServerForm onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(getAddressField(), ' https://host:8096/ ');
        await user.click(getConnectButton());

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith('https://host:8096');
    });

    it('submits with enter in the field', async () => {
        const onSubmit = vi.fn();
        const { user } = renderForm(<AddServerForm onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(getAddressField(), 'host:8096{Enter}');

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith('host:8096');
    });

    it.each([
        [ 'empty', '' ],
        [ 'whitespace only', '   ' ]
    ])('marks an %s address invalid without submitting it', async (_, typed) => {
        const onSubmit = vi.fn();
        const { user } = renderForm(<AddServerForm onSubmit={onSubmit} onCancel={vi.fn()} />);

        if (typed) await user.type(getAddressField(), typed);
        await user.click(getConnectButton());

        expect(onSubmit).not.toHaveBeenCalled();
        const field = getAddressField();
        expect(field).toHaveAttribute('aria-invalid', 'true');
        expect(field).toHaveAccessibleDescription('translated:MessageEnterServerAddress');
        expect(field).toHaveFocus();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('clears the validation error once the address is edited', async () => {
        const { user } = renderForm(<AddServerForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

        await user.click(getConnectButton());
        await user.type(getAddressField(), 'h');

        const field = getAddressField();
        expect(field).toHaveAttribute('aria-invalid', 'false');
        expect(field).toHaveAccessibleDescription('translated:LabelServerHostHelp');
    });

    it('keeps the address readable and the connect button focusable while submitting', async () => {
        const onSubmit = vi.fn();
        const { user, rerender } = renderForm(<AddServerForm onSubmit={onSubmit} onCancel={vi.fn()} />);

        await user.type(getAddressField(), 'host');
        await user.click(getConnectButton());
        rerender(<AddServerForm isSubmitting onSubmit={onSubmit} onCancel={vi.fn()} />);

        const connectButton = getConnectButton();
        expect(connectButton).toHaveFocus();
        expect(connectButton).toHaveAttribute('aria-disabled', 'true');
        expect(connectButton).toBeEnabled();
        expect(getAddressField()).toHaveAttribute('readonly');
        expect(getAddressField()).toHaveValue('host');
        expect(getCancelButton()).toBeDisabled();

        // Neither the button nor enter in the field submits again
        await user.click(connectButton);
        await user.type(getAddressField(), '{Enter}');
        expect(onSubmit).toHaveBeenCalledOnce();
    });

    it('cancels', async () => {
        const onCancel = vi.fn();
        const { user } = renderForm(<AddServerForm onSubmit={vi.fn()} onCancel={onCancel} />);

        await user.click(getCancelButton());

        expect(onCancel).toHaveBeenCalledOnce();
    });
});
