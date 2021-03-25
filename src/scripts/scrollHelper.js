import focusManager from '../components/focusManager';
import dom from './dom';
import '../assets/css/scrollstyles.scss';

function getBoundingClientRect(elem) {
    // Support: BlackBerry 5, iOS 3 (original iPhone)
    // If we don't have gBCR, just use 0,0 rather than error
    if (elem.getBoundingClientRect) {
        return elem.getBoundingClientRect();
    } else {
        return { top: 0, left: 0 };
    }
}

export function getPosition(scrollContainer, item, horizontal) {
    const slideeOffset = getBoundingClientRect(scrollContainer);
    const itemOffset = getBoundingClientRect(item);

    let offset = horizontal ? itemOffset.left - slideeOffset.left : itemOffset.top - slideeOffset.top;
    let size = horizontal ? itemOffset.width : itemOffset.height;
    if (!size && size !== 0) {
        size = item[horizontal ? 'offsetWidth' : 'offsetHeight'];
    }

    const currentStart = horizontal ? scrollContainer.scrollLeft : scrollContainer.scrollTop;

    offset += currentStart;

    const frameSize = horizontal ? scrollContainer.offsetWidth : scrollContainer.offsetHeight;

    const currentEnd = currentStart + frameSize;

    const isVisible = offset >= currentStart && (offset + size) <= currentEnd;

    return {
        start: offset,
        center: (offset - (frameSize / 2) + (size / 2)),
        end: offset - frameSize + size,
        size: size,
        isVisible: isVisible
    };
}

export function toCenter(container, elem, horizontal, skipWhenVisible) {
    const pos = getPosition(container, elem, horizontal);

    if (skipWhenVisible && pos.isVisible) {
        return;
    }

    if (container.scrollTo) {
        if (horizontal) {
            container.scrollTo(pos.center, 0);
        } else {
            container.scrollTo(0, pos.center);
        }
    } else {
        if (horizontal) {
            container.scrollLeft = Math.round(pos.center);
        } else {
            container.scrollTop = Math.round(pos.center);
        }
    }
}

export function toStart(container, elem, horizontal, skipWhenVisible) {
    const pos = getPosition(container, elem, horizontal);

    if (skipWhenVisible && pos.isVisible) {
        return;
    }

    if (container.scrollTo) {
        if (horizontal) {
            container.scrollTo(pos.start, 0);
        } else {
            container.scrollTo(0, pos.start);
        }
    } else {
        if (horizontal) {
            container.scrollLeft = Math.round(pos.start);
        } else {
            container.scrollTop = Math.round(pos.start);
        }
    }
}

function centerOnFocus(e, scrollSlider, horizontal) {
    const focused = focusManager.focusableParent(e.target);

    if (focused) {
        toCenter(scrollSlider, focused, horizontal);
    }
}

function centerOnFocusHorizontal(e) {
    centerOnFocus(e, this, true);
}

function centerOnFocusVertical(e) {
    centerOnFocus(e, this, false);
}

export const centerFocus = {
    on: function (element, horizontal) {
        if (horizontal) {
            dom.addEventListener(element, 'focus', centerOnFocusHorizontal, {
                capture: true,
                passive: true
            });
        } else {
            dom.addEventListener(element, 'focus', centerOnFocusVertical, {
                capture: true,
                passive: true
            });
        }
    },
    off: function (element, horizontal) {
        if (horizontal) {
            dom.removeEventListener(element, 'focus', centerOnFocusHorizontal, {
                capture: true,
                passive: true
            });
        } else {
            dom.removeEventListener(element, 'focus', centerOnFocusVertical, {
                capture: true,
                passive: true
            });
        }
    }
};

export default {
    getPosition: getPosition,
    centerFocus: centerFocus,
    toCenter: toCenter,
    toStart: toStart
};
