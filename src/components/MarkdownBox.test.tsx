import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MarkdownBox from './MarkdownBox';

describe('MarkdownBox', () => {
    it('opens links in a new window', () => {
        render(<MarkdownBox markdown='See the [changelog](https://example.com/releases).' />);

        const link = screen.getByRole('link');

        expect(link).toHaveAttribute('href', 'https://example.com/releases');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('keeps the fallback when there is no markdown', () => {
        render(<MarkdownBox fallback='No changelog' />);

        expect(screen.getByText('No changelog')).toBeInTheDocument();
    });
});
