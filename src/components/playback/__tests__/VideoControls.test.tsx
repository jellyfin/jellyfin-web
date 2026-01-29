import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoControls } from '../VideoControls';

describe('VideoControls', () => {
    const defaultProps = {
        isPlaying: true,
        currentTime: 60,
        duration: 300,
        volume: 80,
        isMuted: false,
        title: 'Test Video',
        onPlayPause: vi.fn(),
        onSeek: vi.fn(),
        onSeekEnd: vi.fn(),
        onVolumeChange: vi.fn(),
        onMuteToggle: vi.fn(),
        onRewind: vi.fn(),
        onFastForward: vi.fn(),
        isVisible: true,
        showOsd: true
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Core Rendering', () => {
        it('renders video title when provided', () => {
            render(<VideoControls {...defaultProps} />);
            expect(screen.getByText('Test Video')).toBeInTheDocument();
        });

        it('renders play/pause button', () => {
            render(<VideoControls {...defaultProps} />);
            expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
        });

        it('renders rewind button', () => {
            render(<VideoControls {...defaultProps} />);
            expect(screen.getByRole('button', { name: /rewind/i })).toBeInTheDocument();
        });

        it('renders fast forward button', () => {
            render(<VideoControls {...defaultProps} />);
            expect(screen.getByRole('button', { name: /fast forward/i })).toBeInTheDocument();
        });

        it('renders time displays', () => {
            render(<VideoControls {...defaultProps} />);
            expect(screen.getByText('1:00')).toBeInTheDocument();
            expect(screen.getByText('5:00')).toBeInTheDocument();
        });

        it('does not render title when not provided', () => {
            render(<VideoControls {...defaultProps} title={undefined} />);
            expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        });
    });

    describe('Play State', () => {
        it('shows pause button when isPlaying is true', () => {
            render(<VideoControls {...defaultProps} isPlaying={true} />);
            expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
        });

        it('shows play button when isPlaying is false', () => {
            render(<VideoControls {...defaultProps} isPlaying={false} />);
            expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
        });
    });

    describe('Seek', () => {
        it('slider exists and has correct attributes', () => {
            render(<VideoControls {...defaultProps} />);
            const slider = screen.getByRole('slider');
            expect(slider).toBeInTheDocument();
            expect(slider).toHaveAttribute('aria-valuemin', '0');
            expect(slider).toHaveAttribute('aria-valuemax', '100');
        });

        it('slider has correct initial value based on current time', () => {
            render(<VideoControls {...defaultProps} currentTime={150} duration={300} />);
            const slider = screen.getByRole('slider');
            expect(slider).toHaveAttribute('aria-valuenow', '50');
        });
    });

    describe('Time Formatting', () => {
        it('formats seconds correctly for short duration', () => {
            render(<VideoControls {...defaultProps} currentTime={65} duration={120} />);
            expect(screen.getByText('1:05')).toBeInTheDocument();
            expect(screen.getByText('2:00')).toBeInTheDocument();
        });

        it('formats seconds correctly for long duration with hours', () => {
            render(<VideoControls {...defaultProps} currentTime={3725} duration={7500} />);
            expect(screen.getByText('1:02:05')).toBeInTheDocument();
            expect(screen.getByText('2:05:00')).toBeInTheDocument();
        });

        it('handles zero duration', () => {
            render(<VideoControls {...defaultProps} currentTime={0} duration={0} />);
            const timeDisplays = screen.getAllByText('0:00');
            expect(timeDisplays.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Visibility Control', () => {
        it('renders controls when isVisible is true', () => {
            render(<VideoControls {...defaultProps} isVisible={true} />);
            expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
        });

        it('does not render when showOsd is false', () => {
            render(<VideoControls {...defaultProps} showOsd={false} />);
            expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument();
        });
    });

    describe('Props Interface', () => {
        it('accepts all required props', () => {
            expect(() => render(<VideoControls {...defaultProps} />)).not.toThrow();
        });

        it('accepts optional props without error', () => {
            expect(() =>
                render(
                    <VideoControls
                        {...defaultProps}
                        isRecording={false}
                        hasSubtitles={true}
                        hasMultipleAudioTracks={true}
                        hasChapters={true}
                        isFavorite={true}
                        canAirPlay={true}
                        canPiP={true}
                        canFullscreen={true}
                        bufferedRanges={[{ start: 0, end: 50 }]}
                        onSubtitlesClick={vi.fn()}
                        onAudioClick={vi.fn()}
                        onSettingsClick={vi.fn()}
                        onAirPlay={vi.fn()}
                        onPiPClick={vi.fn()}
                        onFullscreenClick={vi.fn()}
                        onFavoriteClick={vi.fn()}
                        onRecordClick={vi.fn()}
                        onPreviousTrack={vi.fn()}
                        onNextTrack={vi.fn()}
                        onPreviousChapter={vi.fn()}
                        onNextChapter={vi.fn()}
                    />
                )
            ).not.toThrow();
        });
    });
});
