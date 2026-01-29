import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import AppHeader from './AppHeader';

// Mock the dynamic import
vi.mock('../scripts/libraryMenu', () => ({
    LibraryMenu: {
        setTitle: vi.fn(),
        setDefaultTitle: vi.fn()
    }
}));

describe('AppHeader', () => {
    it('should render the legacy DOM elements', () => {
        const { container } = render(<AppHeader />);

        expect(container.querySelector('.mainDrawer')).toBeInTheDocument();
        expect(container.querySelector('.skinHeader')).toBeInTheDocument();
        expect(container.querySelector('.mainDrawerHandle')).toBeInTheDocument();
    });

    it('should be hidden when isHidden is true', () => {
        const { container } = render(<AppHeader isHidden={true} />);

        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).toHaveStyle('display: none');
    });

    it('should not be hidden when isHidden is false', () => {
        const { container } = render(<AppHeader isHidden={false} />);

        const wrapper = container.firstChild as HTMLElement;
        expect(wrapper).not.toHaveStyle('display: none');
    });
});
