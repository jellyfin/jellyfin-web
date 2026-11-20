import { createTheme, ThemeProvider } from '@mui/material/styles';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import DeleteServerDialog from './DeleteServerDialog';

vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => [ `translated:${key}`, ...args ].join(' ')
    }
}));

const SERVER = { Id: 'home-id', Name: 'Home' };
const theme = createTheme({ cssVariables: true });

const renderDialog = (props: Partial<React.ComponentProps<typeof DeleteServerDialog>> = {}) => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const ui = (overrides: Partial<React.ComponentProps<typeof DeleteServerDialog>> = {}) => (
        <ThemeProvider theme={theme}>
            <DeleteServerDialog
                server={SERVER}
                isActive={false}
                isDeleting={false}
                onConfirm={onConfirm}
                onClose={onClose}
                {...props}
                {...overrides}
            />
        </ThemeProvider>
    );
    const result = render(ui());
    return { ...result, onConfirm, onClose, rerenderDialog: (overrides: Partial<React.ComponentProps<typeof DeleteServerDialog>>) => result.rerender(ui(overrides)) };
};

describe('DeleteServerDialog', () => {
    it('asks for confirmation of the server, with the cancel button focused', () => {
        renderDialog();

        const dialog = screen.getByRole('dialog', { name: 'translated:DeleteName Home' });
        expect(dialog).toHaveAccessibleDescription('translated:DeleteServerConfirmation');
        expect(screen.getByRole('button', { name: 'translated:ButtonCancel' })).toHaveFocus();
        expect(screen.queryByText('translated:MessageDeleteActiveServerWarning')).not.toBeInTheDocument();
    });

    it('warns when the server is in use', () => {
        renderDialog({ isActive: true });

        expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
            'translated:DeleteServerConfirmation translated:MessageDeleteActiveServerWarning'
        );
    });

    it('confirms and cancels', () => {
        const { onConfirm, onClose } = renderDialog();

        fireEvent.click(screen.getByRole('button', { name: 'translated:Delete' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'translated:ButtonCancel' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('closes with escape', () => {
        const { onClose } = renderDialog();

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('can not be left, and keeps the focus on the delete button, while deleting', () => {
        const { onConfirm, onClose } = renderDialog({ isDeleting: true });

        const deleteButton = screen.getByRole('button', { name: 'translated:Delete' });
        deleteButton.focus();
        fireEvent.click(deleteButton);
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

        expect(deleteButton).toHaveFocus();
        expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByRole('button', { name: 'translated:ButtonCancel' })).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent('translated:MessageDeletingServer Home');
        expect(onConfirm).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('shows a failure and announces repeated ones again', () => {
        const { rerenderDialog } = renderDialog({ failureId: 1 });

        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('translated:MessageServerDeleteFailed');

        rerenderDialog({ failureId: 2 });

        expect(screen.getByRole('alert')).not.toBe(alert);
    });

    it('announces nothing before deleting', () => {
        renderDialog();

        expect(within(screen.getByRole('dialog')).getByRole('status')).toBeEmptyDOMElement();
    });

    it('shows no failure before one happened', () => {
        renderDialog();

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});
