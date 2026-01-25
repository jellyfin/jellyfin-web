/**
 * WaveformCell Unit Tests
 * Tests waveform rendering logic without full React testing
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WaveformCell } from './WaveformCell';

const renderWithTheme = (component: React.ReactElement) => {
    return render(component);
};

describe('WaveformCell', () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('renders duration text when no peaks are available', () => {
            renderWithTheme(
                <WaveformCell
                    itemId="test-id"
                    duration={1800000000} // 3 minutes = 3 * 60 * 10000000
                    isCurrentTrack={false}
                    isNextTrack={false}
                />
            );

            expect(screen.getByText('3:00')).toBeInTheDocument();
        });

        it('renders canvas when peaks are provided', () => {
            const mockPeaks = new Array(100).fill(0).map(() => Math.random());

            renderWithTheme(
                <WaveformCell
                    itemId="test-id"
                    peaks={[mockPeaks]}
                    duration={180000000000}
                    isCurrentTrack={true}
                    isNextTrack={false}
                />
            );

            const canvas = document.querySelector('canvas');
            expect(canvas).toBeInTheDocument();
        });

        it('does not render canvas when not current/next and no peaks', () => {
            renderWithTheme(<WaveformCell itemId="test-id" isCurrentTrack={false} isNextTrack={false} />);

            const canvas = document.querySelector('canvas');
            expect(canvas).not.toBeInTheDocument();
        });
    });

    describe('Visibility Logic', () => {
        it('shows waveform for current track with peaks', () => {
            const mockPeaks = new Array(50).fill(0).map(() => Math.random());

            renderWithTheme(
                <WaveformCell
                    itemId="test-id"
                    peaks={[mockPeaks]}
                    duration={120000000000}
                    isCurrentTrack={true}
                    isNextTrack={false}
                />
            );

            const canvas = document.querySelector('canvas');
            expect(canvas).toBeInTheDocument();
        });

        it('shows waveform for next track with peaks', () => {
            const mockPeaks = new Array(50).fill(0).map(() => Math.random());

            renderWithTheme(
                <WaveformCell
                    itemId="test-id"
                    peaks={[mockPeaks]}
                    duration={120000000000}
                    isCurrentTrack={false}
                    isNextTrack={true}
                />
            );

            const canvas = document.querySelector('canvas');
            expect(canvas).toBeInTheDocument();
        });

        it('shows waveform for track with cached peaks', () => {
            const mockPeaks = new Array(50).fill(0).map(() => Math.random());

            renderWithTheme(
                <WaveformCell
                    itemId="test-id"
                    peaks={[mockPeaks]}
                    duration={120000000000}
                    isCurrentTrack={false}
                    isNextTrack={false}
                />
            );

            const canvas = document.querySelector('canvas');
            expect(canvas).toBeInTheDocument();
        });
    });

    describe('Duration Formatting', () => {
        it('formats duration correctly', () => {
            renderWithTheme(
                <WaveformCell
                    itemId="test-id"
                    duration={3000000000} // 5 minutes = 5 * 60 * 10000000
                    isCurrentTrack={false}
                    isNextTrack={false}
                />
            );

            expect(screen.getByText('5:00')).toBeInTheDocument();
        });

        it('shows empty box for zero duration with no peaks', () => {
            const { container } = renderWithTheme(
                <WaveformCell itemId="test-id" duration={0} isCurrentTrack={false} isNextTrack={false} />
            );

            expect(container.firstChild).toBeEmptyDOMElement();
        });

        it('shows empty box for undefined duration with no peaks', () => {
            const { container } = renderWithTheme(
                <WaveformCell itemId="test-id" duration={undefined} isCurrentTrack={false} isNextTrack={false} />
            );

            expect(container.firstChild).toBeEmptyDOMElement();
        });
    });

    describe('Sizing', () => {
        it('applies custom height', () => {
            const mockPeaks = new Array(50).fill(0).map(() => Math.random());

            renderWithTheme(
                <WaveformCell
                    itemId="test-id"
                    peaks={[mockPeaks]}
                    duration={120000000000}
                    isCurrentTrack={true}
                    isNextTrack={false}
                    height={60}
                />
            );

            const canvas = document.querySelector('canvas');
            expect(canvas?.parentElement).toHaveStyle({ height: '60px' });
        });

        it('uses default height when not specified', () => {
            const mockPeaks = new Array(50).fill(0).map(() => Math.random());

            renderWithTheme(
                <WaveformCell
                    itemId="test-id"
                    peaks={[mockPeaks]}
                    duration={120000000000}
                    isCurrentTrack={true}
                    isNextTrack={false}
                />
            );

            const canvas = document.querySelector('canvas');
            expect(canvas?.parentElement).toHaveStyle({ height: '40px' });
        });
    });
});
