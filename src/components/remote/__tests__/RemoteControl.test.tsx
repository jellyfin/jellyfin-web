import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteControl } from '../RemoteControl';

describe('RemoteControl', () => {
    const mockOnPlayPause = vi.fn();
    const mockOnSeek = vi.fn();
    const mockOnVolumeChange = vi.fn();
    const mockOnMuteToggle = vi.fn();
    const mockOnPreviousTrack = vi.fn();
    const mockOnNextTrack = vi.fn();
    const mockOnShuffleToggle = vi.fn();
    const mockOnRepeatToggle = vi.fn();
    const mockOnAudioTrackSelect = vi.fn();
    const mockOnSubtitleTrackSelect = vi.fn();
    const mockOnFavoriteToggle = vi.fn();
    const mockOnFullscreen = vi.fn();
    const mockOnAirPlay = vi.fn();
    const mockOnPiP = vi.fn();

    const defaultProps = {
        currentItem: {
            id: '1',
            name: 'Test Song',
            artist: 'Test Artist',
            mediaType: 'Audio' as const,
            serverId: 'server1'
        },
        isPlaying: true,
        currentTime: 60,
        duration: 300,
        volume: 80,
        isMuted: false,
        repeatMode: 'RepeatNone' as const,
        shuffleMode: 'Sorted' as const,
        isShuffled: false,
        isFavorite: false,
        onPlayPause: mockOnPlayPause,
        onStop: vi.fn(),
        onSeek: mockOnSeek,
        onVolumeChange: mockOnVolumeChange,
        onMuteToggle: mockOnMuteToggle,
        onPreviousTrack: mockOnPreviousTrack,
        onNextTrack: mockOnNextTrack,
        onShuffleToggle: mockOnShuffleToggle,
        onRepeatToggle: mockOnRepeatToggle,
        onAudioTrackSelect: mockOnAudioTrackSelect,
        onSubtitleTrackSelect: mockOnSubtitleTrackSelect,
        onFavoriteToggle: mockOnFavoriteToggle,
        onFullscreen: mockOnFullscreen,
        onAirPlay: mockOnAirPlay,
        onPiP: mockOnPiP
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders now playing info', () => {
        const { getByText } = render(<RemoteControl {...defaultProps} />);
        expect(getByText('Test Song')).toBeInTheDocument();
        expect(getByText('Test Artist')).toBeInTheDocument();
    });

    it('shows play/pause button', () => {
        const { getByRole } = render(<RemoteControl {...defaultProps} isPlaying={true} />);
        expect(getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('shows play button when not playing', () => {
        const { getByRole } = render(<RemoteControl {...defaultProps} isPlaying={false} />);
        expect(getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    it('displays time correctly', () => {
        const { getByText } = render(
            <RemoteControl {...defaultProps} currentTime={65} duration={300} />
        );
        expect(getByText('1:05')).toBeInTheDocument();
        expect(getByText('5:00')).toBeInTheDocument();
    });

    it('has progress slider', () => {
        const { getAllByRole } = render(<RemoteControl {...defaultProps} />);
        const sliders = getAllByRole('slider');
        expect(sliders.length).toBeGreaterThanOrEqual(1);
    });

    it('shows control buttons', () => {
        const { getAllByRole } = render(<RemoteControl {...defaultProps} />);
        const buttons = getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(7);
    });

    it('shows album art', () => {
        const { container } = render(<RemoteControl {...defaultProps} />);
        const avatar = container.querySelector('.nowPlayingPageImageContainer');
        expect(avatar).toBeInTheDocument();
    });

    it('shows container with paper styling', () => {
        const { container } = render(<RemoteControl {...defaultProps} />);
        expect(container.querySelector('.remoteControlContent')).toBeInTheDocument();
    });

    it('handles empty current item', () => {
        const { getByText } = render(<RemoteControl {...defaultProps} currentItem={null} />);
        expect(getByText('No track playing')).toBeInTheDocument();
    });

    it('renders with all playback controls', () => {
        const { getByRole } = render(
            <RemoteControl {...defaultProps} canAirPlay={true} canPiP={true} canFullscreen={true} />
        );
        expect(getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('accepts audio tracks', () => {
        expect(() =>
            render(
                <RemoteControl
                    {...defaultProps}
                    audioTracks={[{ Index: 0, DisplayTitle: 'English' }]}
                    hasMultipleAudioTracks={true}
                    currentAudioIndex={0}
                />
            )
        ).not.toThrow();
    });

    it('accepts subtitle tracks', () => {
        expect(() =>
            render(
                <RemoteControl
                    {...defaultProps}
                    subtitleTracks={[{ Index: 0, DisplayTitle: 'English' }]}
                    hasSubtitles={true}
                    currentSubtitleIndex={0}
                />
            )
        ).not.toThrow();
    });

    it('has correct layout structure', () => {
        const { container } = render(<RemoteControl {...defaultProps} />);
        expect(container.querySelector('.remoteControlContent')).toBeInTheDocument();
    });

    it('renders volume slider', () => {
        const { getAllByRole } = render(<RemoteControl {...defaultProps} />);
        const sliders = getAllByRole('slider');
        expect(sliders.length).toBeGreaterThanOrEqual(1);
    });
});
