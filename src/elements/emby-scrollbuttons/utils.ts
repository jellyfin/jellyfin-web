import ScrollerFactory from 'lib/scroller';
import globalize from 'lib/globalize';

export enum ScrollDirection {
    RIGHT = 'right',
    LEFT = 'left'
}

interface ScrollState {
    scrollPos: number;
}

interface ScrollerItemSlideIntoViewProps {
    direction: ScrollDirection;
    scroller: ScrollerFactory | null;
    scrollState: ScrollState;
}

interface ScrollToWindowProps {
    scroller: ScrollerFactory;
    items: HTMLElement[];
    scrollState: ScrollState;
    direction: ScrollDirection
}

export function scrollerItemSlideIntoView({ direction, scroller, scrollState }: ScrollerItemSlideIntoViewProps) {
    if (!scroller) {
        return;
    }

    const slider: HTMLElement = scroller.getScrollSlider();
    const items = [...slider.children] as HTMLElement[];

    scrollToWindow({
        scroller,
        items,
        scrollState,
        direction
    });
}

function getFirstAndLastVisible(scrollFrame: HTMLElement, items: HTMLElement[], { scrollPos: scrollPosition }: ScrollState) {
    const isRTL = globalize.getIsRTL();
    const localeModifier = isRTL ? -1 : 1;

    const currentScrollPos = scrollPosition * localeModifier;
    const scrollerWidth = scrollFrame.offsetWidth;
    const itemWidth = items[0].offsetWidth;

    // Rounding down here will give us the first item index which is fully visible. We want the first partially visible
    // index so we'll subtract one.
    const firstVisibleIndex = Math.max(Math.floor(currentScrollPos / itemWidth) - 1, 0);
    // Rounding up will give us the last index which is at least partially visible (overflows at container end).
    const lastVisibleIndex = Math.floor((currentScrollPos + scrollerWidth) / itemWidth);

    return [firstVisibleIndex, lastVisibleIndex];
}

function scrollToWindow({
    scroller,
    items,
    scrollState,
    direction = ScrollDirection.RIGHT
}: ScrollToWindowProps) {
    // When we're rendering RTL, scrolling toward the end of the container is toward the left so all of our scroll
    // positions need to be negative.
    const isRTL = globalize.getIsRTL();
    const localeModifier = isRTL ? -1 : 1;

    // NOTE: The legacy scroller is passing in an Element which is the frame element and has some of the scroller
    // factory functions on it, but is not a true scroller factory. For legacy, we need to pass `scroller` directly
    // instead of getting the frame from the factory instance.
    const frame = scroller.getScrollFrame?.() ?? scroller;
    const [firstVisibleIndex, lastVisibleIndex] = getFirstAndLastVisible(frame, items, scrollState);

    let scrollToPosition: number;

    if (direction === ScrollDirection.RIGHT) {
        const nextItem = items[lastVisibleIndex] || items[lastVisibleIndex - 1];

        // This will be the position to anchor the item at `lastVisibleIndex` to the start of the view window.
        const nextItemScrollOffset = lastVisibleIndex * nextItem.offsetWidth;
        scrollToPosition = nextItemScrollOffset * localeModifier;
    } else {
        const previousItem = items[firstVisibleIndex];
        const previousItemScrollOffset = firstVisibleIndex * previousItem.offsetWidth;

        // Find the total number of items that can fit in a view window and subtract one to account for item at
        // `firstVisibleIndex`. The total width of these items is the amount that we need to adjust the scroll position by
        // to anchor item at `firstVisibleIndex` to the end of the view window.
        const offsetAdjustment = (Math.floor(frame.offsetWidth / previousItem.offsetWidth) - 1) * previousItem.offsetWidth;

        // This will be the position to anchor the item at `firstVisibleIndex` to the end of the view window.
        scrollToPosition = (previousItemScrollOffset - offsetAdjustment) * localeModifier;
    }

    if (scroller.slideTo) {
        scroller.slideTo(scrollToPosition, false, undefined);
    } else {
        // @ts-expect-error Legacy support passes in a `scroller` that isn't a ScrollFactory
        scroller.scrollToPosition(scrollToPosition);
    }
}
