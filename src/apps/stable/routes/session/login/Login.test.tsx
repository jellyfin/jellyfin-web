/**
 * Login View Tests
 *
 * Tests for the Login component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import Login from './Login';

// Mock stores
const mockSetCurrentServer = vi.fn();

vi.mock('store/serverStore', () => ({
    useServerStore: vi.fn(() => ({
        currentServer: { id: 'server-1', name: 'Test Server', address: 'http://localhost:8096' },
        setCurrentServer: mockSetCurrentServer
    }))
}));

// Mock ApiClient
const mockGetApiClient = vi.fn();
const mockAuthenticateUserByName = vi.fn();
const mockAuthenticateUserById = vi.fn();
const mockGetPublicUsers = vi.fn();

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        currentApiClient: vi.fn()
    }
}));

describe('Login', () => {
    const renderWithQueryClient = (ui: React.ReactElement) => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false }
            }
        });
        return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (window as any).ApiClient = {
            getApiClient: mockGetApiClient
        };
        mockGetApiClient.mockReturnValue({
            authenticateUserByName: mockAuthenticateUserByName,
            authenticateUserById: mockAuthenticateUserById,
            getPublicUsers: mockGetPublicUsers
        });
        mockGetPublicUsers.mockResolvedValue([
            { Id: 'user-1', Name: 'Test User', HasPassword: false },
            { Id: 'user-2', Name: 'Admin', HasPassword: true, PrimaryImageTag: 'tag1' }
        ]);
    });

    it('renders user selection when server is connected', async () => {
        renderWithQueryClient(<Login />);

        expect(screen.getByText('Who is watching?')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument();
            expect(screen.getByText('Admin')).toBeInTheDocument();
        });
    });

    it('shows manual login form when clicking sign in manually', () => {
        renderWithQueryClient(<Login />);

        const manualButton = screen.getByRole('button', { name: /sign in manually/i });
        fireEvent.click(manualButton);

        expect(screen.getByText('Sign in')).toBeInTheDocument();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('shows error when login fields are empty', async () => {
        renderWithQueryClient(<Login />);

        const manualButton = screen.getByRole('button', { name: /sign in manually/i });
        fireEvent.click(manualButton);

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(signInButton);

        await waitFor(() => {
            expect(screen.getByText('Please enter username and password')).toBeInTheDocument();
        });
    });

    it('navigates to home on successful login', async () => {
        mockAuthenticateUserByName.mockResolvedValue({
            User: { Id: 'user-1', Name: 'testuser' },
            AccessToken: 'token-123'
        });
        renderWithQueryClient(<Login />);

        const manualButton = screen.getByRole('button', { name: /sign in manually/i });
        fireEvent.click(manualButton);

        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);
        const signInButton = screen.getByRole('button', { name: /sign in/i });

        fireEvent.change(usernameInput, { target: { value: 'testuser' } });
        fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
        fireEvent.click(signInButton);

        await waitFor(() => {
            expect(mockSetCurrentServer).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-1',
                    accessToken: 'token-123'
                })
            );
        });
    });

    it('direct login for users without password', async () => {
        mockAuthenticateUserById.mockResolvedValue({
            User: { Id: 'user-1', Name: 'Test User' },
            AccessToken: 'token-123'
        });
        renderWithQueryClient(<Login />);

        const userButton = await screen.findByText('Test User');
        fireEvent.click(userButton);

        await waitFor(() => {
            expect(mockAuthenticateUserById).toHaveBeenCalledWith('user-1');
        });
    });
});
