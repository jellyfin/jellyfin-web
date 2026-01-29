let lastScrollY = 0;
let scrollDirection: 'up' | 'down' | null = null;
const headroomElements: Map<
    HTMLElement,
    { pinned: boolean; unpinThreshold: number; tolerance: number }
> = new Map();
let scrollHandlerAdded = false;

function handleGlobalScroll(): void {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;

    scrollDirection = delta > 0 ? 'down' : delta < 0 ? 'up' : null;

    if (scrollDirection === 'down') {
        headroomElements.forEach((config, element) => {
            if (currentScrollY > config.unpinThreshold && !config.pinned) {
                element.classList.add('headroomUnpinned');
                element.classList.remove('headroomPinned');
                config.pinned = false;
            }
        });
    } else if (scrollDirection === 'up') {
        headroomElements.forEach((config, element) => {
            if (!config.pinned) {
                element.classList.remove('headroomUnpinned');
                element.classList.add('headroomPinned');
                config.pinned = true;
            }
        });
    }

    lastScrollY = currentScrollY;
}

export function createHeadroom(
    element: HTMLElement,
    options: { unpinThreshold?: number; tolerance?: number } = {}
): { destroy: () => void } {
    const unpinThreshold = options.unpinThreshold ?? 0;
    const tolerance = options.tolerance ?? 5;

    if (!headroomElements.has(element)) {
        headroomElements.set(element, { pinned: true, unpinThreshold, tolerance });
        element.classList.add('headroom', 'headroomPinned');

        if (!scrollHandlerAdded) {
            window.addEventListener('scroll', handleGlobalScroll, { passive: true });
            scrollHandlerAdded = true;
        }
    }

    return {
        destroy: () => {
            headroomElements.delete(element);
            element.classList.remove('headroom', 'headroomPinned', 'headroomUnpinned');

            if (headroomElements.size === 0 && scrollHandlerAdded) {
                window.removeEventListener('scroll', handleGlobalScroll);
                scrollHandlerAdded = false;
            }
        }
    };
}

export function disableHeadroom(element: HTMLElement): void {
    const config = headroomElements.get(element);
    if (config) {
        element.classList.add('headroomDisabled');
        element.classList.remove('headroomUnpinned');
        element.classList.add('headroomPinned');
        config.pinned = true;
    }
}

export function enableHeadroom(element: HTMLElement): void {
    const config = headroomElements.get(element);
    if (config) {
        element.classList.remove('headroomDisabled');
    }
}
