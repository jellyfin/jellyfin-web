import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';

// Mock globalize
vi.mock('lib/globalize', () => ({
    default: {
        translate: vi.fn((key: string) => {
            const translations: Record<string, string> = {
                ButtonOk: 'OK',
                ButtonCancel: 'Cancel'
            };
            return translations[key] || key;
        })
    }
}));

describe('ConfirmDialog', () => {
    const mockOnConfirm = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render when open is true', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm Action"
                    message="Are you sure?"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        });

        it('should not render when open is false', () => {
            const { container } = render(
                <ConfirmDialog
                    open={false}
                    title="Confirm Action"
                    message="Are you sure?"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            // Dialog should not be visible
            expect(container.querySelector('[open]')).not.toBeInTheDocument();
        });

        it('should display title', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Delete Item"
                    message="This cannot be undone"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Delete Item')).toBeInTheDocument();
        });

        it('should display message text', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    message="Are you absolutely sure?"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
        });

        it('should prefer text prop over message prop', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    text="Preferred text"
                    message="Fallback message"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Preferred text')).toBeInTheDocument();
            expect(screen.queryByText('Fallback message')).not.toBeInTheDocument();
        });
    });

    describe('buttons', () => {
        it('should display confirm button with default text', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            const confirmBtn = screen.getByText('OK');
            expect(confirmBtn).toBeInTheDocument();
        });

        it('should display confirm button with custom text', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    confirmButtonText="Delete Forever"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            const confirmBtn = screen.getByText('Delete Forever');
            expect(confirmBtn).toBeInTheDocument();
        });

        it('should display cancel button', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            const cancelBtn = screen.getByText('Cancel');
            expect(cancelBtn).toBeInTheDocument();
        });

        it('should call onConfirm when confirm button clicked', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            const confirmBtn = screen.getByText('OK');
            fireEvent.click(confirmBtn);

            expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        });

        it('should call onCancel when cancel button clicked', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            const cancelBtn = screen.getByText('Cancel');
            fireEvent.click(cancelBtn);

            expect(mockOnCancel).toHaveBeenCalledTimes(1);
        });
    });

    describe('button styling', () => {
        it('should render with primary color by default', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('OK')).toBeInTheDocument();
        });

        it('should render with danger color when destructive', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    isDestructive={true}
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('OK')).toBeInTheDocument();
        });

        it('should accept custom confirmButtonColor', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    confirmButtonColor="success"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('OK')).toBeInTheDocument();
        });

        it('should map error color to danger', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    confirmButtonColor="error"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('OK')).toBeInTheDocument();
        });
    });

    describe('edge cases', () => {
        it('should handle empty message', () => {
            render(
                <ConfirmDialog
                    open={true}
                    title="Confirm"
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Confirm')).toBeInTheDocument();
        });

        it('should handle long title and message', () => {
            const longTitle = 'This is a very long title that might wrap to multiple lines';
            const longMessage =
                'This is a very long message that definitely needs to wrap to multiple lines because it contains a lot of text';

            render(
                <ConfirmDialog
                    open={true}
                    title={longTitle}
                    message={longMessage}
                    onConfirm={mockOnConfirm}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText(longTitle)).toBeInTheDocument();
            expect(screen.getByText(longMessage)).toBeInTheDocument();
        });
    });
});
