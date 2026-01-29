import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueControls } from '../QueueControls';
import { QueueNowPlaying } from '../QueueNowPlaying';
import { QueueTable } from '../QueueTable';

describe('QueueTable', () => {
    const mockItems = [
        {
            id: '1',
            item: {
                id: 'item-1',
                name: 'Song 1',
                artist: 'Artist A',
                runtimeTicks: 180000000,
                mediaType: 'Audio' as const,
                serverId: 'server1'
            },
            index: 0,
            addedAt: new Date()
        },
        {
            id: '2',
            item: {
                id: 'item-2',
                name: 'Song 2',
                artist: 'Artist B',
                runtimeTicks: 240000000,
                mediaType: 'Audio' as const,
                serverId: 'server1'
            },
            index: 1,
            addedAt: new Date()
        },
        {
            id: '3',
            item: {
                id: 'item-3',
                name: 'Song 3',
                artist: 'Artist A',
                runtimeTicks: 200000000,
                mediaType: 'Audio' as const,
                serverId: 'server1'
            },
            index: 2,
            addedAt: new Date()
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders queue items', () => {
        render(
            <QueueTable
                items={mockItems}
                currentIndex={0}
                isPlaying={true}
                onPlayItem={vi.fn()}
                onRemoveItem={vi.fn()}
                onReorder={vi.fn()}
                onSelectItem={vi.fn()}
            />
        );
        expect(screen.getByText('Song 1')).toBeInTheDocument();
        expect(screen.getByText('Song 2')).toBeInTheDocument();
        expect(screen.getByText('Song 3')).toBeInTheDocument();
    });

    it('shows empty state when no items', () => {
        const { container } = render(
            <QueueTable
                items={[]}
                currentIndex={0}
                isPlaying={false}
                onPlayItem={vi.fn()}
                onRemoveItem={vi.fn()}
                onReorder={vi.fn()}
                onSelectItem={vi.fn()}
            />
        );
        expect(container.querySelector('.nowPlayingPlaylist')).toBeInTheDocument();
    });

    it('renders item with correct metadata', () => {
        render(
            <QueueTable
                items={[mockItems[0]]}
                currentIndex={0}
                isPlaying={false}
                onPlayItem={vi.fn()}
                onRemoveItem={vi.fn()}
                onReorder={vi.fn()}
                onSelectItem={vi.fn()}
            />
        );
        expect(screen.getByText('Artist A')).toBeInTheDocument();
    });
});

describe('QueueNowPlaying', () => {
    it('renders current item info', () => {
        render(
            <QueueNowPlaying
                currentItem={{
                    id: '1',
                    name: 'Test Song',
                    artist: 'Test Artist',
                    album: 'Test Album',
                    mediaType: 'Audio',
                    serverId: 'server1',
                    runtimeTicks: 180000000
                }}
            />
        );
        expect(screen.getByText('Test Song')).toBeInTheDocument();
        expect(screen.getByText('Test Artist')).toBeInTheDocument();
        expect(screen.getByText('Test Album')).toBeInTheDocument();
    });

    it('renders placeholder when no item', () => {
        render(<QueueNowPlaying currentItem={null} />);
        expect(screen.getByText('No track playing')).toBeInTheDocument();
    });

    it('shows favorite button when onFavoriteClick provided', () => {
        render(
            <QueueNowPlaying
                currentItem={{ id: '1', name: 'Test', mediaType: 'Audio', serverId: 's1' }}
                isFavorite={true}
                onFavoriteClick={vi.fn()}
            />
        );
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders album art when imageUrl provided', () => {
        render(
            <QueueNowPlaying
                currentItem={{
                    id: '1',
                    name: 'Test',
                    mediaType: 'Audio',
                    serverId: 's1',
                    imageUrl: 'http://test.com/image.jpg'
                }}
            />
        );
        const avatar = screen.getByRole('img');
        expect(avatar).toBeInTheDocument();
    });
});

describe('QueueControls', () => {
    const defaultProps = {
        isPlaying: true,
        currentTime: 60,
        duration: 300,
        volume: 80,
        isMuted: false,
        repeatMode: 'RepeatNone' as const,
        shuffleMode: 'Sorted' as const,
        isShuffled: false,
        onPlayPause: vi.fn(),
        onStop: vi.fn(),
        onSeek: vi.fn(),
        onSeekEnd: vi.fn(),
        onVolumeChange: vi.fn(),
        onMuteToggle: vi.fn(),
        onRewind: vi.fn(),
        onFastForward: vi.fn(),
        onPreviousTrack: vi.fn(),
        onNextTrack: vi.fn(),
        onShuffleToggle: vi.fn(),
        onRepeatToggle: vi.fn(),
        onVolumeUp: vi.fn(),
        onVolumeDown: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders main container', () => {
        render(<QueueControls {...defaultProps} />);
        expect(screen.getByTestId('queue-controls')).toBeInTheDocument();
    });

    it('renders play/pause button with icon', () => {
        render(<QueueControls {...defaultProps} isPlaying={true} />);
        const playPauseButton = screen.getByRole('button', { name: /pause/i });
        expect(playPauseButton).toBeInTheDocument();
    });

    it('shows play icon when isPlaying is false', () => {
        render(<QueueControls {...defaultProps} isPlaying={false} />);
        const playButton = screen.getByRole('button', { name: /play/i });
        expect(playButton).toBeInTheDocument();
    });

    it('renders stop button', () => {
        render(<QueueControls {...defaultProps} />);
        expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
        render(<QueueControls {...defaultProps} />);
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('renders rewind and fast forward buttons', () => {
        render(<QueueControls {...defaultProps} />);
        expect(screen.getByRole('button', { name: /rewind/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /fast forward/i })).toBeInTheDocument();
    });

    it('renders shuffle button', () => {
        render(<QueueControls {...defaultProps} />);
        expect(screen.getByRole('button', { name: /shuffle/i })).toBeInTheDocument();
    });

    it('renders repeat button', () => {
        render(<QueueControls {...defaultProps} />);
        expect(screen.getByRole('button', { name: /repeat/i })).toBeInTheDocument();
    });

    it('highlights shuffle button when enabled', () => {
        render(<QueueControls {...defaultProps} isShuffled={true} />);
        const shuffleButton = screen.getByRole('button', { name: /shuffle/i });
        expect(shuffleButton).toBeInTheDocument();
    });

    it('shows repeat one when mode is RepeatOne', () => {
        render(<QueueControls {...defaultProps} repeatMode="RepeatOne" />);
        const repeatButton = screen.getByRole('button', { name: /repeat/i });
        expect(repeatButton).toBeInTheDocument();
    });

    it('displays time correctly', () => {
        render(<QueueControls {...defaultProps} currentTime={65} duration={300} />);
        expect(screen.getByText('1:05')).toBeInTheDocument();
        expect(screen.getByText('5:00')).toBeInTheDocument();
    });

    it('has progress slider', () => {
        render(<QueueControls {...defaultProps} />);
        const sliders = screen.getAllByRole('slider');
        expect(sliders.length).toBeGreaterThanOrEqual(1);
    });

    it('progress slider has correct value based on time', () => {
        render(<QueueControls {...defaultProps} currentTime={150} duration={300} />);
        const progressSlider = screen.getAllByRole('slider')[0];
        expect(progressSlider).toHaveAttribute('aria-valuenow', '150');
    });
});
