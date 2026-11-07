import { describe, expect, it } from 'vitest';

import { TICKS_PER_SECOND } from 'constants/time';

import { IntendedPosition } from './intendedPosition';

const START = 500 * TICKS_PER_SECOND;

describe('IntendedPosition', () => {
    it('passes the reading through when no stream is pending', () => {
        const position = new IntendedPosition();

        expect(position.resolve(42)).toBe(42);
    });

    it('returns the expected position while the stream loads', () => {
        const position = new IntendedPosition();
        position.expect(START);

        expect(position.resolve(0)).toBe(START);
        expect(position.resolve(NaN)).toBe(START);
    });

    it('ignores readings past the expected position until the player accepts the stream', () => {
        const position = new IntendedPosition();
        position.expect(START);

        expect(position.resolve(START + TICKS_PER_SECOND)).toBe(START);
    });

    it('keeps the expected position until the accepted stream gets within one second of it', () => {
        const position = new IntendedPosition();
        position.expect(START);
        position.accept();

        expect(position.resolve(0)).toBe(START);
        expect(position.resolve(START - 2 * TICKS_PER_SECOND)).toBe(START);
        expect(position.resolve(START - TICKS_PER_SECOND)).toBe(START - TICKS_PER_SECOND);
        expect(position.resolve(0)).toBe(0);
    });

    it('clears once the accepted stream reports a time past the expected position', () => {
        const position = new IntendedPosition();
        position.expect(START);
        position.accept();

        expect(position.resolve(START + TICKS_PER_SECOND)).toBe(START + TICKS_PER_SECOND);
        expect(position.resolve(0)).toBe(0);
    });

    it('treats a missing start position as the beginning', () => {
        const position = new IntendedPosition();
        position.expect();
        position.accept();

        expect(position.resolve(0)).toBe(0);
    });

    it('moves a pending position to a seek target', () => {
        const position = new IntendedPosition();
        position.expect(START);
        position.moveTo(2 * START);

        expect(position.resolve(0)).toBe(2 * START);

        position.accept();

        expect(position.resolve(START)).toBe(2 * START);
        expect(position.resolve(2 * START)).toBe(2 * START);
        expect(position.resolve(0)).toBe(0);
    });

    it('ignores a seek when no position is pending', () => {
        const position = new IntendedPosition();
        position.moveTo(START);

        expect(position.resolve(0)).toBe(0);
    });

    it('expects a new stream afresh after the last one was accepted', () => {
        const position = new IntendedPosition();
        position.expect(START);
        position.accept();
        position.expect(2 * START);

        expect(position.resolve(2 * START)).toBe(2 * START);
        expect(position.resolve(0)).toBe(2 * START);
    });

    it('drops the pending position when cleared', () => {
        const position = new IntendedPosition();
        position.expect(START);
        position.clear();

        expect(position.resolve(0)).toBe(0);
    });
});
