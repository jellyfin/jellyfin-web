import React from 'react';
import { render, screen } from '@testing-library/react';
import { LayoutProvider } from '../LayoutProvider';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock child components
vi.mock('../../AppHeader', () => ({
    default: ({ isHidden }: { isHidden: boolean }) => (
        <div data-testid="app-header" data-hidden={isHidden}>
            AppHeader
        </div>
    )
}));

vi.mock('../../AppBody', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="app-body">{children}</div>
    )
}));

vi.mock('../MainLayout', () => ({
    MainLayout: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="main-layout">{children}</div>
    )
}));

// Mock hooks
const mockUseLayoutMode = vi.fn();
vi.mock('../useLayoutMode', () => ({
    useLayoutMode: () => mockUseLayoutMode()
}));

vi.mock('../useDrawerGestures', () => ({
    useDrawerGestures: vi.fn()
}));

vi.mock('../useLegacyDrawerSync', () => ({
    useLegacyDrawerSync: vi.fn()
}));

describe('LayoutProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render legacy layout when not in experimental or new path', () => {
        mockUseLayoutMode.mockReturnValue({ 
            shouldHideLegacyHeader: false,
            isNewLayoutPath: false,
            isExperimentalLayout: false
        });

        render(
            <LayoutProvider>
                <div data-testid="test-child">Child</div>
            </LayoutProvider>
        );

        const header = screen.getByTestId('app-header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveAttribute('data-hidden', 'false');
        expect(screen.getByTestId('app-body')).toContainElement(screen.getByTestId('test-child'));
        expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument();
    });

    it('should render MainLayout when in experimental layout', () => {
        mockUseLayoutMode.mockReturnValue({ 
            shouldHideLegacyHeader: true,
            isNewLayoutPath: false,
            isExperimentalLayout: true
        });

        render(
            <LayoutProvider>
                <div data-testid="test-child">Child</div>
            </LayoutProvider>
        );

        const header = screen.getByTestId('app-header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveAttribute('data-hidden', 'true');
        
        expect(screen.getByTestId('main-layout')).toContainElement(screen.getByTestId('test-child'));
        // AppBody is likely inside MainLayout (but mocked MainLayout renders children directly, which is test-child).
        // The Provider itself does NOT wrap MainLayout in AppBody (MainLayout does it internally).
        expect(screen.queryByTestId('app-body')).not.toBeInTheDocument(); 
    });

    it('should render children directly when on new layout path (dashboard)', () => {
        mockUseLayoutMode.mockReturnValue({ 
            shouldHideLegacyHeader: true,
            isNewLayoutPath: true,
            isExperimentalLayout: false 
        });

        render(
            <LayoutProvider>
                <div data-testid="test-child">Child</div>
            </LayoutProvider>
        );

        const header = screen.getByTestId('app-header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveAttribute('data-hidden', 'true');

        expect(screen.getByTestId('test-child')).toBeInTheDocument();
        expect(screen.queryByTestId('main-layout')).not.toBeInTheDocument();
        expect(screen.queryByTestId('app-body')).not.toBeInTheDocument(); 
    });
});
