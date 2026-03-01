import { describe, expect, test } from 'vitest';
import {
    getDefaultBackgroundClass,
    getDefaultColorIndex,
    getDesiredAspect,
    getPostersPerRow,
    isResizable,
    isUsingLiveTvNaming,
    resolveAction, resolveCardBoxCssClasses,
    resolveCardCssClasses,
    resolveCardImageContainerCssClasses,
    resolveMixedShapeByAspectRatio
} from './cardBuilderUtils';
import { ItemAction } from 'constants/itemAction';

describe('getDesiredAspect', () => {
    test('"portrait" (case insensitive)', () => {
        expect(getDesiredAspect('portrait')).toEqual((2 / 3));
        expect(getDesiredAspect('PorTRaIt')).toEqual((2 / 3));
    });

    test('"backdrop" (case insensitive)', () => {
        expect(getDesiredAspect('backdrop')).toEqual((16 / 9));
        expect(getDesiredAspect('BaCkDroP')).toEqual((16 / 9));
    });

    test('"square" (case insensitive)', () => {
        expect(getDesiredAspect('square')).toEqual(1);
        expect(getDesiredAspect('sQuArE')).toEqual(1);
    });

    test('"banner" (case insensitive)', () => {
        expect(getDesiredAspect('banner')).toEqual((1000 / 185));
        expect(getDesiredAspect('BaNnEr')).toEqual((1000 / 185));
    });

    test('invalid shape', () => expect(getDesiredAspect('invalid')).toBeNull());

    test('shape is not provided', () => expect(getDesiredAspect('')).toBeNull());
});

describe('getPostersPerRow', () => {
    test('resolves to default of 4 posters per row if shape is not provided', () => {
        expect(getPostersPerRow('', 0, false, false)).toEqual(4);
    });

    describe('portrait', () => {
        const postersPerRowForPortrait = (screenWidth: number, isTV: boolean) => (getPostersPerRow('portrait', screenWidth, false, isTV));

        test('television', () => expect(postersPerRowForPortrait(0, true)).toEqual(100 / 16.66666667));

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
        const postersPerRowForSquare = (screenWidth: number, isTV: boolean) => (getPostersPerRow('square', screenWidth, false, isTV));

        test('television', () => expect(postersPerRowForSquare(0, true)).toEqual(100 / 16.66666667));

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
        const postersPerRowForBanner = (screenWidth: number) => (getPostersPerRow('banner', screenWidth, false, false));

        test('screen width less than 800px', () => expect(postersPerRowForBanner(799)).toEqual(1));

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
        const postersPerRowForBackdrop = (screenWidth: number, isTV: boolean) => (getPostersPerRow('backdrop', screenWidth, false, isTV));

        test('television', () => expect(postersPerRowForBackdrop(0, true)).toEqual(4));

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
        const postersPerRowForSmallBackdrop = (screenWidth: number) => (getPostersPerRow('smallBackdrop', screenWidth, false, false));

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
        const postersPerRowForOverflowSmallBackdrop = (screenWidth: number, isLandscape = false, isTV = false) => (getPostersPerRow('overflowSmallBackdrop', screenWidth, isLandscape, isTV));

        test('television', () => expect(postersPerRowForOverflowSmallBackdrop(0, false, true)).toEqual(100 / 18.9));

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
        const postersPerRowForOverflowPortrait = (screenWidth: number, isLandscape = false, isTV = false) => (getPostersPerRow('overflowPortrait', screenWidth, isLandscape, isTV));

        test('television', () => expect(postersPerRowForOverflowPortrait(0, false, true)).toEqual(100 / 15.5));

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
        const postersPerRowForOverflowSquare = (screenWidth: number, isLandscape = false, isTV = false) => (getPostersPerRow('overflowSquare', screenWidth, isLandscape, isTV));

        test('television', () => expect(postersPerRowForOverflowSquare(0, false, true)).toEqual(100 / 15.5));

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
        const postersPerRowForOverflowBackdrop = (screenWidth: number, isLandscape = false, isTV = false) => (getPostersPerRow('overflowBackdrop', screenWidth, isLandscape, isTV));

        test('television', () => expect(postersPerRowForOverflowBackdrop(0, false, true)).toEqual(100 / 23.3));

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

test('isUsingLiveTvNaming', () => {
    expect(isUsingLiveTvNaming('Program')).toEqual(true);
    expect(isUsingLiveTvNaming('Timer')).toEqual(true);
    expect(isUsingLiveTvNaming('Recording')).toEqual(true);
});

describe('isResizable', () => {
    test('is resizable if difference between screen width and window width is greater than 20px', () => {
        Object.defineProperty(window, 'screen', {
            value: {
                availWidth: 2048
            }
        });
        expect(isResizable(1024)).toEqual(true);
    });

    test('is not resizable if difference between screen width and window width is less than or equal to 20px', () => {
        Object.defineProperty(window, 'screen', {
            value: {
                availWidth: 1044
            }
        });
        expect(isResizable(1024)).toEqual(false);
    });

    test('is not resizable if screen width is not provided', () => {
        Object.defineProperty(window, 'screen', {
            value: undefined
        });
        expect(isResizable(1024)).toEqual(false);
    });
});

describe('resolveAction', () => {
    test('default action', () => expect(resolveAction({ defaultAction: ItemAction.Link, isFolder: false, isPhoto: false })).toEqual(ItemAction.Link));

    test('photo', () => expect(resolveAction({ defaultAction: ItemAction.Link, isFolder: false, isPhoto: true })).toEqual(ItemAction.Play));

    test('default action is "play" and is folder', () => expect(resolveAction({ defaultAction: ItemAction.Play, isFolder: true, isPhoto: true })).toEqual(ItemAction.Link));
});

describe('resolveMixedShapeByAspectRatio', () => {
    test('primary aspect ratio is >= 1.33', () => {
        expect(resolveMixedShapeByAspectRatio(1.33)).toEqual('mixedBackdrop');
        expect(resolveMixedShapeByAspectRatio(1.34)).toEqual('mixedBackdrop');
    });

    test('primary aspect ratio is > 0.8', () => {
        expect(resolveMixedShapeByAspectRatio(0.81)).toEqual('mixedSquare');
        expect(resolveMixedShapeByAspectRatio(0.82)).toEqual('mixedSquare');
        expect(resolveMixedShapeByAspectRatio(1.32)).toEqual('mixedSquare');
    });

    test('primary aspect ratio is <= 0.8', () => {
        expect(resolveMixedShapeByAspectRatio(0.8)).toEqual('mixedPortrait');
        expect(resolveMixedShapeByAspectRatio(0.79)).toEqual('mixedPortrait');
        expect(resolveMixedShapeByAspectRatio(0.01)).toEqual('mixedPortrait');
    });

    test('primary aspect ratio is not provided', () => {
        expect(resolveMixedShapeByAspectRatio(undefined)).toEqual('mixedSquare');
        expect(resolveMixedShapeByAspectRatio(null)).toEqual('mixedSquare');
    });
});

describe('resolveCardCssClasses', () => {
    test('card CSS classes', () => {
        expect(resolveCardCssClasses({
            cardCssClass: 'custom-class',
            itemType: 'non-music',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card custom-class card-withuserdata');
    });

    test('card classes', () => {
        expect(resolveCardCssClasses({
            cardClass: 'custom-card',
            itemType: 'non-music',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card custom-card card-withuserdata');
    });

    test('shape', () => {
        expect(resolveCardCssClasses({
            shape: 'portrait',
            itemType: 'non-music',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card portraitCard card-withuserdata');
    });

    test('desktop', () => {
        expect(resolveCardCssClasses({
            itemType: 'non-music',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: true
        })
        ).toEqual('card card-hoverable card-withuserdata');
    });

    test('tv', () => {
        expect(resolveCardCssClasses({
            itemType: 'non-music',
            showChildCountIndicator: false,
            isTV: true,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card show-focus card-withuserdata');
    });

    test('tv with focus transform', () => {
        expect(resolveCardCssClasses({
            itemType: 'non-music',
            showChildCountIndicator: false,
            isTV: true,
            enableFocusTransform: true,
            isDesktop: false
        })
        ).toEqual('card show-focus show-animation card-withuserdata');
    });

    test('non-music item type', () => {
        expect(resolveCardCssClasses({
            itemType: 'non-music',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card card-withuserdata');
    });

    test('music item type', () => {
        expect(resolveCardCssClasses({
            itemType: 'MusicAlbum',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card');

        expect(resolveCardCssClasses({
            itemType: 'MusicArtist',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card');

        expect(resolveCardCssClasses({
            itemType: 'Audio',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card');
    });

    test('child count indicator', () => {
        expect(resolveCardCssClasses({
            itemType: 'non-music',
            showChildCountIndicator: true,
            childCount: 5,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card groupedCard card-withuserdata');
    });

    test('button tag name', () => {
        expect(resolveCardCssClasses({
            tagName: 'button',
            itemType: 'non-music',
            showChildCountIndicator: false,
            isTV: false,
            enableFocusTransform: false,
            isDesktop: false
        })
        ).toEqual('card card-withuserdata itemAction');
    });

    test('all', () => {
        expect(resolveCardCssClasses({
            shape: 'portrait',
            cardCssClass: 'card-css',
            cardClass: 'card',
            itemType: 'non-music',
            showChildCountIndicator: true,
            childCount: 5,
            tagName: 'button',
            isTV: true,
            enableFocusTransform: true,
            isDesktop: true
        })
        ).toEqual('card portraitCard card-css card-hoverable show-focus show-animation groupedCard card-withuserdata itemAction');
    });
});

describe('resolveCardImageContainerCssClasses', () => {
    test('with image URL, no cover image', () => {
        expect(resolveCardImageContainerCssClasses({
            itemType: '',
            itemName: 'Movie Name',
            imgUrl: 'https://jellyfin.org/some-image',
            hasCoverImage: false
        })).toEqual('cardImageContainer');
    });

    test('no cover image, no image URL', () => {
        expect(resolveCardImageContainerCssClasses({
            itemType: '',
            itemName: 'Movie Name',
            hasCoverImage: false
        })).toEqual('cardImageContainer defaultCardBackground defaultCardBackground1');
    });

    test('with cover image, no image URL', () => {
        expect(resolveCardImageContainerCssClasses({
            itemType: '',
            itemName: 'Movie Name',
            hasCoverImage: true
        })).toEqual('cardImageContainer coveredImage defaultCardBackground defaultCardBackground1');
    });

    test('with cover image, item type is TV channel, no image URL', () => {
        expect(resolveCardImageContainerCssClasses({
            itemType: 'TvChannel',
            itemName: 'Movie Name',
            hasCoverImage: true
        })).toEqual('cardImageContainer coveredImage coveredImage-contain defaultCardBackground defaultCardBackground1');
    });
});

describe('resolveCardBoxCssClasses', () => {
    test('non-card layout', () => expect(resolveCardBoxCssClasses({ cardLayout: false, hasOuterCardFooter: false })).toEqual('cardBox multiselect-container'));

    test('card layout', () => expect(resolveCardBoxCssClasses({ cardLayout: true, hasOuterCardFooter: false })).toEqual('cardBox visualCardBox multiselect-container'));

    test('has outer card footer', () => expect(resolveCardBoxCssClasses({ cardLayout: false, hasOuterCardFooter: true })).toEqual('cardBox cardBox-bottompadded multiselect-container'));
});

describe('getDefaultBackgroundClass', () => {
    test('no randomization string provided', () => {
        for (let i = 0; i < 100; i++) {
            const bgClass = getDefaultBackgroundClass();
            const colorIndex = parseInt(bgClass.slice(bgClass.length - 1), 10);
            expect(colorIndex).toBeGreaterThanOrEqual(1);
            expect(colorIndex).toBeLessThanOrEqual(5);
            expect(bgClass).toEqual(`defaultCardBackground defaultCardBackground${colorIndex}`);
        }
    });

    test('randomization string provided', () => {
        // eslint-disable-next-line sonarjs/pseudo-random
        const generateRandomString = (stringLength: number): string => (Math.random() + 1).toString(36).substring(stringLength);

        for (let i = 0; i < 100; i++) {
            const randomString = generateRandomString(6);
            const bgClass = getDefaultBackgroundClass(randomString);
            const colorIndex = getDefaultColorIndex(randomString);
            expect(bgClass).toEqual(`defaultCardBackground defaultCardBackground${colorIndex}`);
        }
    });
});

describe('getDefaultColorIndex', () => {
    test('no randomization string provided', () => {
        for (let i = 0; i < 100; i++) {
            const colorIndex = getDefaultColorIndex();
            expect(colorIndex).toBeGreaterThanOrEqual(1);
            expect(colorIndex).toBeLessThanOrEqual(5);
        }
    });

    test('randomization string provided', () => {
        expect(getDefaultColorIndex('Movie name')).toEqual(1);
        expect(getDefaultColorIndex('Mo')).toEqual(4);
        expect(getDefaultColorIndex('Mov')).toEqual(4);
        expect(getDefaultColorIndex('Movi')).toEqual(1);
        expect(getDefaultColorIndex('Movie')).toEqual(1);
        expect(getDefaultColorIndex('Movie ')).toEqual(2);
        expect(getDefaultColorIndex('Movie n')).toEqual(2);
        expect(getDefaultColorIndex('Movie na')).toEqual(3);
        expect(getDefaultColorIndex('Movie nam')).toEqual(3);
        expect(getDefaultColorIndex('Movie name')).toEqual(1);
        expect(getDefaultColorIndex('TV show')).toEqual(3);
        expect(getDefaultColorIndex('Music album')).toEqual(1);
        expect(getDefaultColorIndex('Song')).toEqual(3);
        expect(getDefaultColorIndex('Musical artist')).toEqual(1);
    });
});
