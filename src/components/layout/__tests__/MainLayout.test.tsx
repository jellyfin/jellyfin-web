import React from 'react';
import { render, screen } from '@testing-library/react';
import { MainLayout } from '../MainLayout';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import browser from '../../../scripts/browser';

// Mock browser
vi.mock('../../../scripts/browser', () => ({
    default: {
        mobile: false
    }
}));

// Mock components
vi.mock('../Header', () => ({
    Header: () => <div data-testid="mock-header">Header</div>
}));

vi.mock('../Sidebar', () => ({
    Sidebar: () => <div data-testid="mock-sidebar">Sidebar</div>
}));

vi.mock('../../ResponsiveDrawer', () => ({
    default: ({ children, open }: any) => (
        <div data-testid="mock-drawer" data-open={open}>
            {children}
        </div>
    ),
    DRAWER_WIDTH: 240
}));

vi.mock('../../AppBody', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="mock-app-body">{children}</div>
    )
}));

// Mock uiStore
const { mockToggleDrawer, mockUiStore } = vi.hoisted(() => {
    const toggle = vi.fn();
    const store: any = vi.fn((selector) => {
        const state = {
            isDrawerOpen: true,
            toggleDrawer: toggle
        };
        return selector ? selector(state) : state;
    });
    store.getState = () => ({
        isDrawerOpen: true,
        toggleDrawer: toggle
    });
    return { mockToggleDrawer: toggle, mockUiStore: store };
});

vi.mock('../../../store/uiStore', () => ({
    useUiStore: mockUiStore
}));

describe('MainLayout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (browser as any).mobile = false; // Default to desktop
    });

    it('should render header, sidebar and app body', () => {
        render(
            <MainLayout>
                <div data-testid="test-child">Child</div>
            </MainLayout>
        );

        expect(screen.getByTestId('mock-header')).toBeInTheDocument();
        expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('mock-app-body')).toContainElement(screen.getByTestId('test-child'));
    });

    it('should apply margin-left on desktop when drawer is open', () => {
        render(
            <MainLayout>
                <div>Child</div>
            </MainLayout>
        );

        const main = screen.getByRole('main');
        expect(main).toHaveStyle('margin-left: 240px');
    });

        it('should NOT apply margin-left on mobile', () => {

            (browser as any).mobile = true;

            render(

                <MainLayout>

                    <div>Child</div>

                </MainLayout>

            );

    

            const main = screen.getByRole('main');

            expect(main).toHaveStyle('margin-left: 0');

        });

    

        it('should auto-open drawer on desktop if initially closed', () => {

            (browser as any).mobile = false;

            

            // Setup mock to return closed initially

            mockUiStore.getState = () => ({

                isDrawerOpen: false,

                toggleDrawer: mockToggleDrawer

            });

    

            render(

                <MainLayout>

                    <div>Child</div>

                </MainLayout>

            );

    

            expect(mockToggleDrawer).toHaveBeenCalledWith(true);

        });

    });

    