import { describe, expect, test } from 'vitest';
import cardBuilderUtils from './cardBuilderUtils';

describe('getDesiredAspect', () => {
    test('"portrait" (case insensitive)', () => {
        expect(cardBuilderUtils.getDesiredAspect('portrait')).toEqual((2 / 3));
        expect(cardBuilderUtils.getDesiredAspect('PorTRaIt')).toEqual((2 / 3));
    });

    test('"backdrop" (case insensitive)', () => {
        expect(cardBuilderUtils.getDesiredAspect('backdrop')).toEqual((16 / 9));
        expect(cardBuilderUtils.getDesiredAspect('BaCkDroP')).toEqual((16 / 9));
    });

    test('"square" (case insensitive)', () => {
        expect(cardBuilderUtils.getDesiredAspect('square')).toEqual(1);
        expect(cardBuilderUtils.getDesiredAspect('sQuArE')).toEqual(1);
    });

    test('"banner" (case insensitive)', () => {
        expect(cardBuilderUtils.getDesiredAspect('banner')).toEqual((1000 / 185));
        expect(cardBuilderUtils.getDesiredAspect('BaNnEr')).toEqual((1000 / 185));
    });

    test('invalid shape', () => {
        expect(cardBuilderUtils.getDesiredAspect('invalid')).toBeNull();
    });

    test('shape is not provided', () => {
        expect(cardBuilderUtils.getDesiredAspect('')).toBeNull();
    });
});

describe('getPostersPerRow', () => {
    test('resolves to default of 4 posters per row if shape is not provided', () => {
        expect(cardBuilderUtils.getPostersPerRow('', 0, false, false)).toEqual(4);
    });

    describe('portrait', () => {
        const postersPerRowForPortrait = (screenWidth, isTV) => (cardBuilderUtils.getPostersPerRow('portrait', screenWidth, false, isTV));

        test('television', () => {
            expect(postersPerRowForPortrait(0, true)).toEqual(100 / 16.66666667);
        });

        test('screen width less than 500px', () => {
            expect(postersPerRowForPortrait(100, false)).toEqual(100 / 33.33333333);
            expect(postersPerRowForPortrait(499, false)).toEqual(100 / 33.33333333);
        });

        test('screen width greater or equal to 500px', () => {
            expect(postersPerRowForPortrait(500, false)).toEqual(100 / 33.33333333);
            expect(postersPerRowForPortrait(501, false)).toEqual(100 / 33.33333333);
        });

        test('screen width greater or equal to 700px', () => {
            expect(postersPerRowForPortrait(700, false)).toEqual(4);
            expect(postersPerRowForPortrait(701, false)).toEqual(4);
        });

        test('screen width greater or equal to 800px', () => {
            expect(postersPerRowForPortrait(800, false)).toEqual(5);
            expect(postersPerRowForPortrait(801, false)).toEqual(5);
        });

        test('screen width greater or equal to 1200px', () => {
            expect(postersPerRowForPortrait(1200, false)).toEqual(100 / 16.66666667);
            expect(postersPerRowForPortrait(1201, false)).toEqual(100 / 16.66666667);
        });

        test('screen width greater or equal to 1400px', () => {
            expect(postersPerRowForPortrait(1400, false)).toEqual( 100 / 14.28571428571);
            expect(postersPerRowForPortrait(1401, false)).toEqual( 100 / 14.28571428571);
        });

        test('screen width greater or equal to 1600px', () => {
            expect(postersPerRowForPortrait(1600, false)).toEqual( 8);
            expect(postersPerRowForPortrait(1601, false)).toEqual( 8);
        });

        test('screen width greater or equal to 1920px', () => {
            expect(postersPerRowForPortrait(1920, false)).toEqual( 100 / 11.1111111111);
            expect(postersPerRowForPortrait(1921, false)).toEqual( 100 / 11.1111111111);
        });

        test('screen width greater or equal to 2200px', () => {
            expect(postersPerRowForPortrait(2200, false)).toEqual( 10);
            expect(postersPerRowForPortrait(2201, false)).toEqual( 10);
        });
    });

    describe('square', () => {
        const postersPerRowForSquare = (screenWidth, isTV) => (cardBuilderUtils.getPostersPerRow('square', screenWidth, false, isTV));

        test('television', () => {
            expect(postersPerRowForSquare(0, true)).toEqual(100 / 16.66666667);
        });

        test('screen width less than 500px', () => {
            expect(postersPerRowForSquare(100, false)).toEqual(2);
            expect(postersPerRowForSquare(499, false)).toEqual(2);
        });

        test('screen width greater or equal to 500px', () => {
            expect(postersPerRowForSquare(500, false)).toEqual(100 / 33.33333333);
            expect(postersPerRowForSquare(501, false)).toEqual(100 / 33.33333333);
        });

        test('screen width greater or equal to 700px', () => {
            expect(postersPerRowForSquare(700, false)).toEqual(4);
            expect(postersPerRowForSquare(701, false)).toEqual(4);
        });

        test('screen width greater or equal to 800px', () => {
            expect(postersPerRowForSquare(800, false)).toEqual(5);
            expect(postersPerRowForSquare(801, false)).toEqual(5);
        });

        test('screen width greater or equal to 1200px', () => {
            expect(postersPerRowForSquare(1200, false)).toEqual(100 / 16.66666667);
            expect(postersPerRowForSquare(1201, false)).toEqual(100 / 16.66666667);
        });

        test('screen width greater or equal to 1400px', () => {
            expect(postersPerRowForSquare(1400, false)).toEqual( 100 / 14.28571428571);
            expect(postersPerRowForSquare(1401, false)).toEqual( 100 / 14.28571428571);
        });

        test('screen width greater or equal to 1600px', () => {
            expect(postersPerRowForSquare(1600, false)).toEqual(8);
            expect(postersPerRowForSquare(1601, false)).toEqual(8);
        });

        test('screen width greater or equal to 1920px', () => {
            expect(postersPerRowForSquare(1920, false)).toEqual(100 / 11.1111111111);
            expect(postersPerRowForSquare(1921, false)).toEqual(100 / 11.1111111111);
        });

        test('screen width greater or equal to 2200px', () => {
            expect(postersPerRowForSquare(2200, false)).toEqual( 10);
            expect(postersPerRowForSquare(2201, false)).toEqual( 10);
        });
    });

    describe('banner', () => {
        const postersPerRowForBanner = (screenWidth) => (cardBuilderUtils.getPostersPerRow('banner', screenWidth, false, false));

        test('screen width less than 800px', () => {
            expect(postersPerRowForBanner(799)).toEqual(1);
        });

        test('screen width greater than or equal to 800px', () => {
            expect(postersPerRowForBanner(800)).toEqual(2);
            expect(postersPerRowForBanner(801)).toEqual(2);
        });

        test('screen width greater than or equal to 1200px', () => {
            expect(postersPerRowForBanner(1200)).toEqual(100 / 33.33333333);
            expect(postersPerRowForBanner(1201)).toEqual(100 / 33.33333333);
        });

        test('screen width greater than or equal to 2200px', () => {
            expect(postersPerRowForBanner(2200)).toEqual(4);
            expect(postersPerRowForBanner(2201)).toEqual(4);
        });
    });

    describe('backdrop', () => {
        const postersPerRowForBackdrop = (screenWidth, isTV) => (cardBuilderUtils.getPostersPerRow('backdrop', screenWidth, false, isTV));

        test('television', () => {
            expect(postersPerRowForBackdrop(0, true)).toEqual(4);
        });

        test('screen width less than 420px', () => {
            expect(postersPerRowForBackdrop(100, false)).toEqual(1);
            expect(postersPerRowForBackdrop(419, false)).toEqual(1);
        });

        test('screen width greater or equal to 420px', () => {
            expect(postersPerRowForBackdrop(420, false)).toEqual(2);
            expect(postersPerRowForBackdrop(421, false)).toEqual(2);
        });

        test('screen width greater or equal to 770px', () => {
            expect(postersPerRowForBackdrop(770, false)).toEqual(3);
            expect(postersPerRowForBackdrop(771, false)).toEqual(3);
        });

        test('screen width greater or equal to 1200px', () => {
            expect(postersPerRowForBackdrop(1200, false)).toEqual(4);
            expect(postersPerRowForBackdrop(1201, false)).toEqual(4);
        });

        test('screen width greater or equal to 1600px', () => {
            expect(postersPerRowForBackdrop(1600, false)).toEqual(5);
            expect(postersPerRowForBackdrop(1601, false)).toEqual(5);
        });

        test('screen width greater or equal to 2500px', () => {
            expect(postersPerRowForBackdrop(2500, false)).toEqual(6);
            expect(postersPerRowForBackdrop(2501, false)).toEqual(6);
        });
    });

    describe('small backdrop', () => {
        const postersPerRowForSmallBackdrop = (screenWidth) => (cardBuilderUtils.getPostersPerRow('smallBackdrop', screenWidth, false, false));

        test('screen width less than 500px', () => {
            expect(postersPerRowForSmallBackdrop(100)).toEqual(2);
            expect(postersPerRowForSmallBackdrop(499)).toEqual(2);
        });

        test('screen width greater or equal to 500px', () => {
            expect(postersPerRowForSmallBackdrop(500)).toEqual(100 / 33.33333333);
            expect(postersPerRowForSmallBackdrop(501)).toEqual(100 / 33.33333333);
        });

        test('screen width greater or equal to 800px', () => {
            expect(postersPerRowForSmallBackdrop(800)).toEqual(4);
            expect(postersPerRowForSmallBackdrop(801)).toEqual(4);
        });

        test('screen width greater or equal to 1000px', () => {
            expect(postersPerRowForSmallBackdrop(1000)).toEqual(5);
            expect(postersPerRowForSmallBackdrop(1001)).toEqual(5);
        });

        test('screen width greater or equal to 1200px', () => {
            expect(postersPerRowForSmallBackdrop(1200)).toEqual(100 / 16.66666667);
            expect(postersPerRowForSmallBackdrop(1201)).toEqual(100 / 16.66666667);
        });

        test('screen width greater or equal to 1400px', () => {
            expect(postersPerRowForSmallBackdrop(1400)).toEqual(100 / 14.2857142857);
            expect(postersPerRowForSmallBackdrop(1401)).toEqual(100 / 14.2857142857);
        });

        test('screen width greater or equal to 1600px', () => {
            expect(postersPerRowForSmallBackdrop(1600)).toEqual(8);
            expect(postersPerRowForSmallBackdrop(1601)).toEqual(8);
        });
    });

    describe('overflow small backdrop', () => {
        const postersPerRowForOverflowSmallBackdrop = (screenWidth, isLandscape, isTV) => (cardBuilderUtils.getPostersPerRow('overflowSmallBackdrop', screenWidth, isLandscape, isTV));

        test('television', () => {
            expect(postersPerRowForOverflowSmallBackdrop(0, false, true)).toEqual( 100 / 18.9);
        });

        describe('non-landscape', () => {
            test('screen width greater or equal to 540px', () => {
                expect(postersPerRowForOverflowSmallBackdrop(540, false)).toEqual(100 / 30);
                expect(postersPerRowForOverflowSmallBackdrop(541, false)).toEqual(100 / 30);
            });

            test('screen width is less than 540px', () => {
                expect(postersPerRowForOverflowSmallBackdrop(539, false)).toEqual(100 / 72);
                expect(postersPerRowForOverflowSmallBackdrop(100, false)).toEqual(100 / 72);
            });
        });

        describe('landscape', () => {
            test('screen width greater or equal to 800px', () => {
                expect(postersPerRowForOverflowSmallBackdrop(800, true)).toEqual(100 / 15.5);
                expect(postersPerRowForOverflowSmallBackdrop(801, true)).toEqual(100 / 15.5);
            });

            test('screen width is less than 800px', () => {
                expect(postersPerRowForOverflowSmallBackdrop(799, true)).toEqual(100 / 23.3);
                expect(postersPerRowForOverflowSmallBackdrop(100, true)).toEqual(100 / 23.3);
            });
        });
    });

    describe('overflow portrait', () => {
        const postersPerRowForOverflowPortrait = (screenWidth, isLandscape, isTV) => (cardBuilderUtils.getPostersPerRow('overflowPortrait', screenWidth, isLandscape, isTV));

        test('television', () => {
            expect(postersPerRowForOverflowPortrait(0, false, true)).toEqual( 100 / 15.5);
        });

        describe('non-landscape', () => {
            test('screen width greater or equal to 1400px', () => {
                expect(postersPerRowForOverflowPortrait(1400, false)).toEqual(100 / 15);
                expect(postersPerRowForOverflowPortrait(1401, false)).toEqual(100 / 15);
            });

            test('screen width greater or equal to 1200px', () => {
                expect(postersPerRowForOverflowPortrait(1200, false)).toEqual(100 / 18);
                expect(postersPerRowForOverflowPortrait(1201, false)).toEqual(100 / 18);
            });

            test('screen width greater or equal to 760px', () => {
                expect(postersPerRowForOverflowPortrait(760, false)).toEqual(100 / 23);
                expect(postersPerRowForOverflowPortrait(761, false)).toEqual(100 / 23);
            });

            test('screen width greater or equal to 400px', () => {
                expect(postersPerRowForOverflowPortrait(400, false)).toEqual(100 / 31.5);
                expect(postersPerRowForOverflowPortrait(401, false)).toEqual(100 / 31.5);
            });

            test('screen width is less than 400px', () => {
                expect(postersPerRowForOverflowPortrait(399, false)).toEqual(100 / 42);
                expect(postersPerRowForOverflowPortrait(100, false)).toEqual(100 / 42);
            });
        });

        describe('landscape', () => {
            test('screen width greater or equal to 1700px', () => {
                expect(postersPerRowForOverflowPortrait(1700, true)).toEqual(100 / 11.6);
                expect(postersPerRowForOverflowPortrait(1701, true)).toEqual(100 / 11.6);
            });

            test('screen width is less than 1700px', () => {
                expect(postersPerRowForOverflowPortrait(1699, true)).toEqual(100 / 15.5);
                expect(postersPerRowForOverflowPortrait(100, true)).toEqual(100 / 15.5);
            });
        });
    });

    describe('overflow square', () => {
        const postersPerRowForOverflowSquare = (screenWidth, isLandscape, isTV) => (cardBuilderUtils.getPostersPerRow('overflowSquare', screenWidth, isLandscape, isTV));

        test('television', () => {
            expect(postersPerRowForOverflowSquare(0, false, true)).toEqual( 100 / 15.5);
        });

        describe('non-landscape', () => {
            test('screen width greater or equal to 1400px', () => {
                expect(postersPerRowForOverflowSquare(1400, false)).toEqual(100 / 15);
                expect(postersPerRowForOverflowSquare(1401, false)).toEqual(100 / 15);
            });

            test('screen width greater or equal to 1200px', () => {
                expect(postersPerRowForOverflowSquare(1200, false)).toEqual(100 / 18);
                expect(postersPerRowForOverflowSquare(1201, false)).toEqual(100 / 18);
            });

            test('screen width greater or equal to 760px', () => {
                expect(postersPerRowForOverflowSquare(760, false)).toEqual(100 / 23);
                expect(postersPerRowForOverflowSquare(761, false)).toEqual(100 / 23);
            });

            test('screen width greater or equal to 540px', () => {
                expect(postersPerRowForOverflowSquare(540, false)).toEqual(100 / 31.5);
                expect(postersPerRowForOverflowSquare(541, false)).toEqual(100 / 31.5);
            });

            test('screen width is less than 540px', () => {
                expect(postersPerRowForOverflowSquare(539, false)).toEqual(100 / 42);
                expect(postersPerRowForOverflowSquare(100, false)).toEqual(100 / 42);
            });
        });

        describe('landscape', () => {
            test('screen width greater or equal to 1700px', () => {
                expect(postersPerRowForOverflowSquare(1700, true)).toEqual(100 / 11.6);
                expect(postersPerRowForOverflowSquare(1701, true)).toEqual(100 / 11.6);
            });

            test('screen width is less than 1700px', () => {
                expect(postersPerRowForOverflowSquare(1699, true)).toEqual(100 / 15.5);
                expect(postersPerRowForOverflowSquare(100, true)).toEqual(100 / 15.5);
            });
        });
    });

    describe('overflow backdrop', () => {
        const postersPerRowForOverflowBackdrop = (screenWidth, isLandscape, isTV) => (cardBuilderUtils.getPostersPerRow('overflowBackdrop', screenWidth, isLandscape, isTV));

        test('television', () => {
            expect(postersPerRowForOverflowBackdrop(0, false, true)).toEqual( 100 / 23.3);
        });

        describe('non-landscape', () => {
            test('screen width greater or equal to 1800px', () => {
                expect(postersPerRowForOverflowBackdrop(1800, false)).toEqual(100 / 23.5);
                expect(postersPerRowForOverflowBackdrop(1801, false)).toEqual(100 / 23.5);
            });

            test('screen width greater or equal to 1400px', () => {
                expect(postersPerRowForOverflowBackdrop(1400, false)).toEqual(100 / 30);
                expect(postersPerRowForOverflowBackdrop(1401, false)).toEqual(100 / 30);
            });

            test('screen width greater or equal to 760px', () => {
                expect(postersPerRowForOverflowBackdrop(760, false)).toEqual(100 / 40);
                expect(postersPerRowForOverflowBackdrop(761, false)).toEqual(100 / 40);
            });

            test('screen width greater or equal to 640px', () => {
                expect(postersPerRowForOverflowBackdrop(640, false)).toEqual(100 / 56);
                expect(postersPerRowForOverflowBackdrop(641, false)).toEqual(100 / 56);
            });

            test('screen width is less than 640px', () => {
                expect(postersPerRowForOverflowBackdrop(639, false)).toEqual(100 / 72);
                expect(postersPerRowForOverflowBackdrop(100, false)).toEqual(100 / 72);
            });
        });

        describe('landscape', () => {
            test('screen width greater or equal to 1700px', () => {
                expect(postersPerRowForOverflowBackdrop(1700, true)).toEqual(100 / 18.5);
                expect(postersPerRowForOverflowBackdrop(1701, true)).toEqual(100 / 18.5);
            });

            test('screen width is less than 1700px', () => {
                expect(postersPerRowForOverflowBackdrop(1699, true)).toEqual(100 / 23.3);
                expect(postersPerRowForOverflowBackdrop(100, true)).toEqual(100 / 23.3);
            });
        });
    });
});
