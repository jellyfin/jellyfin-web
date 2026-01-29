import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import browser from '../scripts/browser';
import ResponsiveDrawer from './ResponsiveDrawer';

// Mock browser
vi.mock('../scripts/browser', () => ({
    default: {
        mobile: false
    }
}));

// Mock ui-primitives
vi.mock('ui-primitives/Drawer', () => ({
    Drawer: ({ children, open }: any) =>
        open ? <div data-testid="mock-drawer">{children}</div> : null
}));

vi.mock('ui-primitives/Box', () => ({
    Box: ({ children, ...props }: any) => (
        <div data-testid="mock-box" {...props}>
            {children}
        </div>
    )
}));

describe('ResponsiveDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset browser mock
        (browser as any).mobile = false;
    });

    it('should render desktop version when not mobile', () => {
        render(
            <ResponsiveDrawer open={true} onClose={() => {}} onOpen={() => {}}>
                <div>Content</div>
            </ResponsiveDrawer>
        );

        // Desktop version uses Box component="nav"
        // In our mock Box renders a div, we check for attributes if passed?
        // Box implementation usually passes props down.
        // Let's check for the style or class, or just presence.
        expect(screen.getByTestId('mock-box')).toBeInTheDocument();
        // We can check if it has specific styles if we want, but presence is enough for now.
    });

    it('should render mobile version when mobile', () => {
        (browser as any).mobile = true;
        render(
            <ResponsiveDrawer open={true} onClose={() => {}} onOpen={() => {}}>
                <div>Content</div>
            </ResponsiveDrawer>
        );

        expect(screen.getByTestId('mock-drawer')).toBeInTheDocument();
    });

    it('should not render mobile drawer when closed', () => {
        (browser as any).mobile = true;
        render(
            <ResponsiveDrawer open={false} onClose={() => {}} onOpen={() => {}}>
                <div>Content</div>
            </ResponsiveDrawer>
        );

        expect(screen.queryByTestId('mock-drawer')).not.toBeInTheDocument();
    });
});
