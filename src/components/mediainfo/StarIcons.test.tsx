import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import StarIcons from './StarIcons';

describe('StarIcons', () => {
    describe('rendering', () => {
        it('should render star icon', () => {
            render(<StarIcons communityRating={8.5} />);
            const starIcon = screen.getByText('star');
            expect(starIcon).toBeInTheDocument();
        });

        it('should display rating value', () => {
            render(<StarIcons communityRating={8.5} />);
            expect(screen.getByText('8.5')).toBeInTheDocument();
        });

        it('should format rating to one decimal place', () => {
            render(<StarIcons communityRating={7.456} />);
            expect(screen.getByText('7.5')).toBeInTheDocument();
        });

        it('should handle whole number ratings', () => {
            render(<StarIcons communityRating={9} />);
            expect(screen.getByText('9.0')).toBeInTheDocument();
        });

        it('should handle zero rating', () => {
            render(<StarIcons communityRating={0} />);
            expect(screen.getByText('0.0')).toBeInTheDocument();
        });

        it('should handle maximum rating', () => {
            render(<StarIcons communityRating={10} />);
            expect(screen.getByText('10.0')).toBeInTheDocument();
        });

        it('should handle very small ratings', () => {
            render(<StarIcons communityRating={0.1} />);
            expect(screen.getByText('0.1')).toBeInTheDocument();
        });

        it('should handle ratings with many decimals', () => {
            render(<StarIcons communityRating={7.89123} />);
            expect(screen.getByText('7.9')).toBeInTheDocument();
        });
    });

    describe('styling', () => {
        it('should apply default classes', () => {
            const { container } = render(<StarIcons communityRating={8.5} />);
            const box = container.querySelector('.mediaInfoItem');
            expect(box).toBeInTheDocument();
            expect(box).toHaveClass('starRatingContainer');
        });

        it('should apply custom className', () => {
            const { container } = render(
                <StarIcons communityRating={8.5} className="custom-class" />
            );
            const box = container.querySelector('.custom-class');
            expect(box).toBeInTheDocument();
        });

        it('should combine default and custom classes', () => {
            const { container } = render(<StarIcons communityRating={8.5} className="custom" />);
            const box = container.querySelector('.mediaInfoItem');
            expect(box).toHaveClass('mediaInfoItem');
            expect(box).toHaveClass('starRatingContainer');
            expect(box).toHaveClass('custom');
        });

        it('should have aria-hidden on star icon', () => {
            const { container } = render(<StarIcons communityRating={8.5} />);
            const starIcon = container.querySelector('.starIcon');
            expect(starIcon).toHaveAttribute('aria-hidden', 'true');
        });
    });

    describe('rating ranges', () => {
        it('should display low ratings', () => {
            render(<StarIcons communityRating={2.5} />);
            expect(screen.getByText('2.5')).toBeInTheDocument();
        });

        it('should display medium ratings', () => {
            render(<StarIcons communityRating={5.5} />);
            expect(screen.getByText('5.5')).toBeInTheDocument();
        });

        it('should display high ratings', () => {
            render(<StarIcons communityRating={8.5} />);
            expect(screen.getByText('8.5')).toBeInTheDocument();
        });
    });

    describe('edge cases', () => {
        it('should handle NaN gracefully', () => {
            const { container } = render(<StarIcons communityRating={NaN} />);
            expect(container).toBeInTheDocument();
        });

        it('should handle negative ratings', () => {
            render(<StarIcons communityRating={-1} />);
            expect(screen.getByText('-1.0')).toBeInTheDocument();
        });

        it('should handle ratings above 10', () => {
            render(<StarIcons communityRating={15} />);
            expect(screen.getByText('15.0')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have accessible rating display', () => {
            const { container } = render(<StarIcons communityRating={8.5} />);
            const ratingText = screen.getByText('8.5');
            expect(ratingText).toBeVisible();
        });

        it('should hide decorative icon from screen readers', () => {
            const { container } = render(<StarIcons communityRating={8.5} />);
            const starIcon = container.querySelector('[aria-hidden="true"]');
            expect(starIcon).toBeInTheDocument();
        });
    });
});
