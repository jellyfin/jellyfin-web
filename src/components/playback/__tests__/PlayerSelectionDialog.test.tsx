import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { PlayerSelectionDialog } from '../PlayerSelectionDialog';

// Mock apphost
vi.mock('components/apphost', () => ({
    appHost: {
        appName: vi.fn(() => 'Test App'),
        appVersion: vi.fn(() => '1.0.0'),
        deviceName: vi.fn(() => 'Test Device'),
        deviceId: vi.fn(() => 'test-device-id'),
        init: vi.fn(),
        supports: vi.fn(() => true)
    },
    safeAppHost: {
        appName: vi.fn(() => 'Test App'),
        appVersion: vi.fn(() => '1.0.0'),
        deviceName: vi.fn(() => 'Test Device'),
        deviceId: vi.fn(() => 'test-device-id'),
        supports: vi.fn(() => true)
    }
}));

// Mock playbackManager
const mockGetPlayerInfo = vi.fn();
const mockGetTargets = vi.fn();
const mockTrySetActivePlayer = vi.fn();
const mockGetCurrentPlayer = vi.fn();
const mockEnableDisplayMirroring = vi.fn();

vi.mock('components/playback/playbackmanager', () => ({
    playbackManager: {
        getPlayerInfo: (...args: unknown[]) => mockGetPlayerInfo(...args),
        getTargets: (...args: unknown[]) => mockGetTargets(...args),
        trySetActivePlayer: (...args: unknown[]) => mockTrySetActivePlayer(...args),
        getCurrentPlayer: (...args: unknown[]) => mockGetCurrentPlayer(...args),
        getSupportedCommands: vi.fn(() => [])
    }
}));

// Mock player store
const mockUsePlayerStore = vi.fn();
vi.mock('../../store', () => ({
    usePlayerStore: (...args: unknown[]) => mockUsePlayerStore(...args)
}));

// Mock autocast
vi.mock('../../../scripts/autocast', () => ({
    enable: vi.fn(),
    isEnabled: vi.fn()
}));

import { enable as mockEnable, isEnabled as mockIsEnabled } from '../../../scripts/autocast';

// Mock appRouter
vi.mock('../../router/appRouter', () => ({
    appRouter: {
        showNowPlaying: vi.fn()
    }
}));

describe('PlayerSelectionDialog', () => {
    const mockTargets = [
        {
            id: 'player-1',
            name: 'Living Room TV',
            appName: 'Jellyfin for TV',
            deviceType: 'tv',
            isLocalPlayer: true,
            playerName: 'mpv',
            playableMediaTypes: ['Video', 'Audio']
        },
        {
            id: 'player-2',
            name: 'Chrome Cast',
            appName: 'Jellyfin Chrome',
            deviceType: 'cast',
            playerName: 'chromecast'
        }
    ];

    const defaultProps = {
        open: true,
        onClose: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();

        mockUsePlayerStore.mockReturnValue({
            currentPlayer: null,
            currentPlayerInfo: null
        });

        mockGetPlayerInfo.mockReturnValue(null);
        mockGetTargets.mockResolvedValue(mockTargets);
        mockTrySetActivePlayer.mockResolvedValue(undefined);
        mockIsEnabled.mockReturnValue(false);
        mockGetCurrentPlayer.mockReturnValue(null);
    });

    it('renders dialog title when open', () => {
        render(<PlayerSelectionDialog {...defaultProps} />);
        expect(screen.getByText('Play On')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<PlayerSelectionDialog {...defaultProps} open={false} />);
        expect(screen.queryByText('Play On')).not.toBeInTheDocument();
    });

    it('shows loading state while fetching targets', async () => {
        mockGetTargets.mockImplementation(() => new Promise(() => {}));
        render(<PlayerSelectionDialog {...defaultProps} />);
        expect(screen.getByText('Loading playback devices...')).toBeInTheDocument();
    });

    it('renders list of playback targets', async () => {
        render(<PlayerSelectionDialog {...defaultProps} />);
        expect(await screen.findByText('Living Room TV - Jellyfin for TV')).toBeInTheDocument();
        expect(await screen.findByText('Chrome Cast - Jellyfin Chrome')).toBeInTheDocument();
    });

    it('shows message when no targets found', async () => {
        mockGetTargets.mockResolvedValue([]);
        render(<PlayerSelectionDialog {...defaultProps} />);
        await waitFor(() => {
            expect(screen.getByText('No playback devices found')).toBeInTheDocument();
        });
    });

    it('calls onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(<PlayerSelectionDialog {...defaultProps} onClose={onClose} />);
        const closeButtons = screen.getAllByRole('button', { name: /close/i });
        fireEvent.click(closeButtons[0]);
        expect(onClose).toHaveBeenCalled();
    });

    it('shows active player menu when not local player', async () => {
        mockGetPlayerInfo.mockReturnValue({
            deviceName: 'Chromecast',
            name: 'Chromecast',
            isLocalPlayer: false,
            supportedCommands: ['DisplayContent', 'EndSession']
        });

        render(<PlayerSelectionDialog {...defaultProps} />);
        expect(await screen.findByText('Chromecast')).toBeInTheDocument();
    });

    it('shows remote control and disconnect buttons for active player', async () => {
        mockGetPlayerInfo.mockReturnValue({
            deviceName: 'Chromecast',
            name: 'Chromecast',
            isLocalPlayer: false,
            supportedCommands: ['DisplayContent', 'EndSession']
        });

        render(<PlayerSelectionDialog {...defaultProps} />);
        expect(await screen.findByText('Remote Control')).toBeInTheDocument();
        expect(await screen.findByText('Disconnect')).toBeInTheDocument();
    });

    it('shows display mirroring checkbox when supported', async () => {
        mockGetPlayerInfo.mockReturnValue({
            deviceName: 'Chromecast',
            name: 'Chromecast',
            isLocalPlayer: false,
            supportedCommands: ['DisplayContent', 'EndSession']
        });

        render(<PlayerSelectionDialog {...defaultProps} />);
        expect(await screen.findByLabelText('Enable display mirroring')).toBeInTheDocument();
    });

    it('shows auto-cast checkbox', async () => {
        mockGetPlayerInfo.mockReturnValue({
            deviceName: 'Chromecast',
            name: 'Chromecast',
            isLocalPlayer: false,
            supportedCommands: ['DisplayContent', 'EndSession']
        });

        render(<PlayerSelectionDialog {...defaultProps} />);
        expect(await screen.findByLabelText('Enable auto-cast')).toBeInTheDocument();
    });

    it('highlights currently active player', async () => {
        mockGetPlayerInfo.mockReturnValue({
            id: 'player-1',
            name: 'Living Room TV',
            isLocalPlayer: true
        });

        render(<PlayerSelectionDialog {...defaultProps} />);
        await waitFor(() => {
            const playingText = screen.getByText('Playing');
            expect(playingText).toBeInTheDocument();
        });
    });
});
