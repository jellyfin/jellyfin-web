import { describe, expect, it } from 'vitest';
import * as cardShape from './shape';

describe('Utils: card', () => {
    describe('Function: getSquareShape', () => {
        it('Should return "overflowSquare"', () => {
            const result = cardShape.getSquareShape(true);
            expect(result).toEqual('overflowSquare');
        });
        it('Should return "square"', () => {
            const result = cardShape.getSquareShape(false);
            expect(result).toEqual('square');
        });
    });

    describe('Function: getBackdropShape', () => {
        it('Should return "overflowBackdrop"', () => {
            const result = cardShape.getBackdropShape(true);
            expect(result).toEqual('overflowBackdrop');
        });
        it('Should return "backdrop"', () => {
            const result = cardShape.getBackdropShape(false);
            expect(result).toEqual('backdrop');
        });
    });

    describe('Function: getPortraitShape', () => {
        it('Should return "overflowPortrait"', () => {
            const result = cardShape.getPortraitShape(true);
            expect(result).toEqual('overflowPortrait');
        });
        it('Should return "portrait"', () => {
            const result = cardShape.getPortraitShape(false);
            expect(result).toEqual('portrait');
        });
    });
});
