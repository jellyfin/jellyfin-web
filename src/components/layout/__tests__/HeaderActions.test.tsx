import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import inputManager from '../../../scripts/inputManager';
import { playbackManager } from '../../playback/playbackmanager';
import playerSelectionMenu from '../../playback/playerSelectionMenu';
import { HeaderActions } from '../HeaderActions';

// Mock dependencies
vi.mock('../../../store/uiStore', () => ({
    useUiStore: vi.fn((selector) =>
        selector({
            toggleSearch: vi.fn()
        })
    )
}));

vi.mock('../../playback/playbackmanager', () => ({
    playbackManager: {
        getPlayerInfo: vi.fn(() => ({ isLocalPlayer: true }))
    }
}));

vi.mock('../../playback/playerSelectionMenu', () => ({
    default: {
        show: vi.fn()
    }
}));

vi.mock('../../../scripts/inputManager', () => ({
    default: {
        handleCommand: vi.fn()
    }
}));

vi.mock('../../lib/globalize', () => ({
    default: {
        translate: (key: string) => key
    }
}));

vi.mock('../../../utils/events', () => ({
    default: {
        on: vi.fn(),
        off: vi.fn()
    }
}));

describe('HeaderActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call search command when search clicked', () => {
        render(<HeaderActions />);

        fireEvent.click(screen.getByLabelText('Search'));
        expect(inputManager.handleCommand).toHaveBeenCalledWith('search');
    });

    it('should call player selection menu when cast clicked', () => {
        render(<HeaderActions />);

        fireEvent.click(screen.getByLabelText('ButtonCast'));
        expect(playerSelectionMenu.show).toHaveBeenCalled();
    });

    it('should show cast_connected icon when casting', () => {
        (playbackManager.getPlayerInfo as any).mockReturnValue({ isLocalPlayer: false });
        render(<HeaderActions />);

        expect(screen.getByText('cast_connected')).toBeInTheDocument();
    });
});
