import { TICKS_PER_SECOND } from 'constants/time';

/**
 * This class remembers where the player is about to start playing at, while the player
 * is still loading a stream. Without this, changing the quality, the audio track, or a
 * burned-in subtitle while a stream is still loading would restart playback from 0:00.
 */
export class IntendedPosition {
    private ticks: number | null = null;
    private accepted = false;

    expect(ticks?: number) {
        this.ticks = ticks || 0;
        this.accepted = false;
    }

    accept() {
        this.accepted = true;
    }

    moveTo(ticks: number) {
        if (this.ticks !== null) {
            this.ticks = ticks;
        }
    }

    clear() {
        this.ticks = null;
        this.accepted = false;
    }

    resolve(reportedTicks: number) {
        if (this.ticks === null) {
            return reportedTicks;
        }

        if (this.accepted && reportedTicks >= this.ticks - TICKS_PER_SECOND) {
            this.ticks = null;
            return reportedTicks;
        }

        return this.ticks;
    }
}
