/**
 * Select Server View Tests
 *
 * Tests for the SelectServerView component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { SelectServerView } from '../SelectServer';

// Mock stores - using factory function for flexibility
let mockServersValue = [
    { id: 'server-1', name: 'Home Server', address: 'http://localhost:8096' },
    { id: 'server-2', name: 'Work Server', address: 'http://work.local' },
];

const mockAddServer = vi.fn();
const mockRemoveServer = vi.fn();
const mockSetCurrentServer = vi.fn();
const mockSetConnecting = vi.fn();

vi.mock('store/serverStore', () => ({
    useServerStore: vi.fn(() => ({
        get servers() { return mockServersValue; },
        isConnecting: false,
        addServer: mockAddServer,
        removeServer: mockRemoveServer,
        setCurrentServer: mockSetCurrentServer,
    })),
}));

vi.mock('store/uiStore', () => ({
    useUiStore: vi.fn(() => ({
        setConnecting: mockSetConnecting,
    })),
}));

// Mock ServerConnections
const mockGetServerInfo = vi.fn();
const mockCredentialProvider = {
    credentials: vi.fn(),
};

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: {
        getServerInfo: mockGetServerInfo,
        credentialProvider: mockCredentialProvider,
    },
}));

describe('SelectServerView', () => {
    const mockOnServerSelected = vi.fn();
    const mockOnAddServer = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetServerInfo.mockReturnValue({
            Id: 'server-1',
            Name: 'Home Server',
            ManualAddress: 'http://localhost:8096',
        });
        mockCredentialProvider.credentials.mockResolvedValue({ Servers: [] });
    });

    it('renders select server title', () => {
        render(<SelectServerView onServerSelected={mockOnServerSelected} onAddServer={mockOnAddServer} />);

        expect(screen.getByRole('heading', { name: /select server/i })).toBeInTheDocument();
    });

    it('displays saved servers', () => {
        render(<SelectServerView onServerSelected={mockOnServerSelected} onAddServer={mockOnAddServer} />);

        expect(screen.getByText('Home Server')).toBeInTheDocument();
        expect(screen.getByText('Work Server')).toBeInTheDocument();
    });

    it.skip('calls onServerSelected when clicking a server', async () => {
        mockGetServerInfo.mockReturnValue({
            Id: 'server-1',
            Name: 'Home Server',
            ManualAddress: 'http://localhost:8096',
            LocalAddress: 'http://localhost:8096',
            RemoteAddress: '',
            LastConnectionMode: 3,
            DateLastAccessed: Date.now(),
        });

        render(<SelectServerView onServerSelected={mockOnServerSelected} onAddServer={mockOnAddServer} />);

        const serverButton = screen.getByText('Home Server').closest('li');
        fireEvent.click(serverButton!.firstChild as Element);

        await waitFor(() => {
            expect(mockOnServerSelected).toHaveBeenCalledWith('server-1');
        });
    });

    it.skip('allows adding a manual server', async () => {
        mockCredentialProvider.credentials.mockResolvedValue({ Servers: [] });

        render(<SelectServerView onServerSelected={mockOnServerSelected} onAddServer={mockOnAddServer} />);

        const addressInput = screen.getByPlaceholderText(/enter server address/i);
        const addButton = screen.getByRole('button', { name: /add/i });

        fireEvent.change(addressInput, { target: { value: 'http://myserver.local:8096' } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(mockAddServer).toHaveBeenCalled();
        }, { timeout: 1000 });
    });

    it.skip('shows error when adding empty server address', async () => {
        render(<SelectServerView onServerSelected={mockOnServerSelected} onAddServer={mockOnAddServer} />);

        const addButton = screen.getByRole('button', { name: /add/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText('Please enter a server address')).toBeInTheDocument();
        });
    });

    it('calls removeServer when deleting a server', async () => {
        render(<SelectServerView onServerSelected={mockOnServerSelected} onAddServer={mockOnAddServer} />);

        const deleteButtons = screen.getAllByTestId('DeleteIcon');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockRemoveServer).toHaveBeenCalledWith('server-1');
        });
    });

    it('displays no saved servers message when empty', async () => {
        mockServersValue = [];

        render(<SelectServerView onServerSelected={mockOnServerSelected} onAddServer={mockOnAddServer} />);

        expect(screen.getByText(/no saved servers/i)).toBeInTheDocument();
    });

    it.skip('displays server address in saved server list', () => {
        render(<SelectServerView onServerSelected={mockOnServerSelected} onAddServer={mockOnAddServer} />);

        expect(screen.getByText('http://localhost:8096')).toBeInTheDocument();
    });
});
