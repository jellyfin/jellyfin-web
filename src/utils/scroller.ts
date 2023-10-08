import ScrollerFactory from 'libraries/scroller';
import globalize from 'scripts/globalize';

export enum ScrollDirection {
  RIGHT = 'right',
  LEFT = 'left',
}

interface ScrollState {
  scrollPosition: number;
}
interface ScrollerSlideViewWindowProps {
  direction: ScrollDirection;
  scroller: ScrollerFactory | null;
  scrollState: ScrollState;
}
export function scrollerItemSlideIntoView({ direction, scroller, scrollState }: ScrollerSlideViewWindowProps) {
    if (!scroller) {
        return;
    }

    const slider: HTMLElement = scroller.getScrollSlider();
    const items = [...slider.children];

    if (direction === ScrollDirection.LEFT) {
        scrollToPreviousVisibleWindow(scroller, items as HTMLElement[], scrollState);
    } else {
        scrollToNextVisibleWindow(scroller, items as HTMLElement[], scrollState);
    }
}

function getFirstAndLastVisible(scrollFrame: HTMLElement, items: HTMLElement[], { scrollPosition }: ScrollState) {
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

function scrollToNextVisibleWindow(scroller: ScrollerFactory, items: HTMLElement[], scrollState: ScrollState) {
    const isRTL = globalize.getIsRTL();
    // When we're rendering RTL, scrolling toward the end of the container is toward the left so all of our scroll
    // positions need to be negative.
    const localeModifier = isRTL ? -1 : 1;
    // NOTE: Legacy scroller passing in an Element which is the frame element and has some of the scroller factory
    // functions on it, but is not a true scroller factory. For legacy, we need to pass `scroller` directly instead
    // of getting the frame from the factory instance.
    const [, lastVisibleIndex] = getFirstAndLastVisible(scroller.getScrollFrame?.() || scroller, items, scrollState);

    const nextItem = items[lastVisibleIndex];
    const nextItemScrollOffset = lastVisibleIndex * nextItem.offsetWidth;

    // This will be the position to anchor the item at `lastVisibleIndex` to the start of the view window.
    const nextItemScrollPos = (nextItemScrollOffset) * localeModifier;

    if (scroller.slideTo) {
        scroller.slideTo(nextItemScrollPos, false, undefined);
    } else {
        // @ts-expect-error Legacy support passes in a `scroller` that isn't a ScrollFactory
        scroller.scrollToPosition(nextItemScrollPos);
    }
}

function scrollToPreviousVisibleWindow(scroller: ScrollerFactory, items: HTMLElement[], scrollState: ScrollState) {
    // NOTE: Legacy scroller passing in an Element which is the frame element and has some of the scroller factory
    // functions on it, but is not a true scroller factory. For legacy, we need to pass `scroller` directly instead
    // of getting the frame from the factory instance.
    const frame = scroller.getScrollFrame?.() || scroller;
    const isRTL = globalize.getIsRTL();
    // When we're rendering RTL, scrolling toward the end of the container is toward the left so all of our scroll
    // positions need to be negative.
    const localeModifier = isRTL ? -1 : 1;

    const [firstVisibleIndex] = getFirstAndLastVisible(frame, items, scrollState);

    const previousItem = items[firstVisibleIndex];
    const previousItemScrollOffset = firstVisibleIndex * previousItem.offsetWidth;

    // Find the total number of items that can fit in a view window and subtract one to account for item at
    // `firstVisibleIndex`. The total width of these items is the amount that we need to adjust the scroll position by
    // to anchor item at `firstVisibleIndex` to the end of the view window.
    const offsetAdjustment = (Math.floor(frame.offsetWidth / previousItem.offsetWidth) - 1) * previousItem.offsetWidth;

    const previousItemScrollPos = (previousItemScrollOffset - offsetAdjustment) * localeModifier;

    if (scroller.slideTo) {
        scroller.slideTo(previousItemScrollPos, false, undefined);
    } else {
        // @ts-expect-error Legacy support passes in a `scroller` that isn't a ScrollFactory
        scroller.scrollToPosition(previousItemScrollPos);
    }
}
