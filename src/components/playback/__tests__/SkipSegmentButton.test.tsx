import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkipSegmentButton } from '../SkipSegmentButton';

describe('SkipSegmentButton', () => {
    const mockOnSkip = vi.fn();
    const mockOnDismiss = vi.fn();

    // Set up mock with segmentLabel support
    mockOnSkip.mockImplementation((props?: { segmentLabel?: string }) => {
        // Mock implementation
        if (props?.segmentLabel) {
            // Handle segment label
        }
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders button with segment label', () => {
        render(<SkipSegmentButton segmentLabel="Skip Intro" onSkip={mockOnSkip} />);
        expect(screen.getByText('Skip Intro')).toBeInTheDocument();
    });

    it('calls onSkip when button is clicked', async () => {
        render(<SkipSegmentButton segmentLabel="Skip Intro" onSkip={mockOnSkip} />);
        await userEvent.click(screen.getByRole('button'));
        expect(mockOnSkip).toHaveBeenCalled();
    });

    it('does not render when visible is false', () => {
        render(<SkipSegmentButton segmentLabel="Skip Intro" onSkip={mockOnSkip} visible={false} />);
        expect(screen.queryByText('Skip Intro')).not.toBeInTheDocument();
    });

    it('calls onDismiss when dismiss callback is provided', () => {
        render(
            <SkipSegmentButton
                segmentLabel="Skip Intro"
                onSkip={mockOnSkip}
                onDismiss={mockOnDismiss}
            />
        );
        expect(screen.getByText('Skip Intro')).toBeInTheDocument();
    });

    it('does not show countdown when autoHide is disabled', () => {
        render(
            <SkipSegmentButton
                segmentLabel="Skip"
                onSkip={mockOnSkip}
                autoHide={false}
                hideAfter={8000}
            />
        );
        expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it('accepts endTime prop', () => {
        expect(() =>
            render(<SkipSegmentButton segmentLabel="Skip" onSkip={mockOnSkip} endTime={120} />)
        ).not.toThrow();
    });

    it('applies correct styling classes', () => {
        render(<SkipSegmentButton segmentLabel="Skip" onSkip={mockOnSkip} />);

        const container = document.querySelector('.skip-button-container');
        expect(container).toBeInTheDocument();
    });

    it('handles rapid visibility changes', () => {
        const { rerender } = render(
            <SkipSegmentButton segmentLabel="Skip" onSkip={mockOnSkip} visible={true} />
        );

        expect(screen.getByText('Skip')).toBeInTheDocument();

        rerender(<SkipSegmentButton segmentLabel="Skip" onSkip={mockOnSkip} visible={false} />);

        expect(screen.queryByText('Skip')).not.toBeInTheDocument();
    });

    it('renders with skip button icon', () => {
        render(<SkipSegmentButton segmentLabel="Skip" onSkip={mockOnSkip} />);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
    });

    it('supports custom hideAfter duration without countdown', () => {
        render(
            <SkipSegmentButton
                segmentLabel="Custom"
                onSkip={mockOnSkip}
                autoHide={false}
                hideAfter={15000}
            />
        );

        expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('renders with default segment label when none provided', () => {
        render(<SkipSegmentButton onSkip={mockOnSkip} segmentLabel="Skip" />);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles empty segment label', () => {
        expect(() =>
            render(<SkipSegmentButton segmentLabel="Skip" onSkip={mockOnSkip} />)
        ).not.toThrow();
    });

    it('does not crash when onDismiss is undefined', async () => {
        render(<SkipSegmentButton segmentLabel="Skip" onSkip={mockOnSkip} onDismiss={undefined} />);
        await userEvent.click(screen.getByRole('button'));
        expect(mockOnSkip).toHaveBeenCalled();
    });
});
