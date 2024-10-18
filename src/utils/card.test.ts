import { describe, expect, it } from 'vitest';
import * as card from './card';

describe('Utils: card', () => {
    describe('Function: getSquareShape', () => {
        it('Should return "overflowSquare"', () => {
            const result = card.getSquareShape(true);
            expect(result).toEqual('overflowSquare');
        });
        it('Should return "square"', () => {
            const result = card.getSquareShape(false);
            expect(result).toEqual('square');
        });
    });

    describe('Function: getBackdropShape', () => {
        it('Should return "overflowBackdrop"', () => {
            const result = card.getBackdropShape(true);
            expect(result).toEqual('overflowBackdrop');
        });
        it('Should return "backdrop"', () => {
            const result = card.getBackdropShape(false);
            expect(result).toEqual('backdrop');
        });
    });

    describe('Function: getPortraitShape', () => {
        it('Should return "overflowPortrait"', () => {
            const result = card.getPortraitShape(true);
            expect(result).toEqual('overflowPortrait');
        });
        it('Should return "portrait"', () => {
            const result = card.getPortraitShape(false);
            expect(result).toEqual('portrait');
        });
    });
});
