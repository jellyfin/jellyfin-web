import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { type FC, useEffect, useRef } from 'react';
import { useNavigationType } from 'react-router-dom';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import type { CardOptions } from 'types/cardOptions';
import 'elements/emby-scroller/emby-scroller';
import 'elements/emby-itemscontainer/emby-itemscontainer';

const SCROLL_KEY_PREFIX = 'jellyfin-scroll:search-row:';

// There seems to be some compatibility issues here between
// React and our legacy web components, so we need to inject
// them as an html string for now =/
const createScroller = ({ title = '' }) => ({
    __html: `<h2 class="sectionTitle sectionTitle-cards focuscontainer-x padded-left padded-right">${title}</h2>
    <div is="emby-scroller" data-horizontal="true" data-centerfocus="card" class="padded-top-focusscale padded-bottom-focusscale">
    <div is="emby-itemscontainer" class="focuscontainer-x itemsContainer scrollSlider"></div>
</div>`
});

type ScrollerInstance = {
    reload: () => void;
    slideTo: (pos: number, immediate?: boolean) => void;
    getScrollPosition: () => number;
    getScrollFrame: () => HTMLElement;
    getScrollSlider: () => HTMLElement;
    getScrollEventName: () => string;
};

type ScrollerElement = HTMLDivElement & {
    scroller?: ScrollerInstance;
};

interface SearchResultsRowProps {
    title?: string;
    sectionKey?: string;
    items?: BaseItemDto[];
    cardOptions?: CardOptions;
}

const SearchResultsRow: FC<SearchResultsRowProps> = ({ title, sectionKey, items = [], cardOptions = {} }) => {
    const element = useRef<HTMLDivElement>(null);
    const hasRestoredScroll = useRef(false);
    const navigationType = useNavigationType();

    useEffect(() => {
        cardBuilder.buildCards(items, {
            itemsContainer: element.current?.querySelector('.itemsContainer'),
            ...cardOptions
        });

        if (!sectionKey) return;

        const storageKey = `${SCROLL_KEY_PREFIX}${sectionKey}`;

        let setupRaf = 0;
        let restoreRaf = 0;
        let restoreObserver: ResizeObserver | undefined;
        let restoreTimeout: ReturnType<typeof setTimeout> | undefined;
        let scrollFrame: HTMLElement | undefined;
        let scrollEventName = '';
        let onScroll: (() => void) | undefined;
        let attempts = 0;

        const setup = () => {
            const scrollerEl = element.current?.querySelector('[is="emby-scroller"]') as ScrollerElement | null;
            const scroller = scrollerEl?.scroller;

            // The legacy emby-scroller custom element is upgraded asynchronously by
            // the web components polyfill, so its scroller factory is usually not
            // ready on the first effect run. Retry on the next frame until it is.
            if (!scroller) {
                if (attempts++ < 60) {
                    setupRaf = requestAnimationFrame(setup);
                }
                return;
            }

            scroller.reload();

            scrollFrame = scroller.getScrollFrame();
            const scrollSlider = scroller.getScrollSlider();
            scrollEventName = scroller.getScrollEventName();
            const isTransform = scrollEventName === 'scrollanimate';

            if (navigationType === 'POP' && !hasRestoredScroll.current) {
                const savedScroll = sessionStorage.getItem(storageKey);
                if (savedScroll !== null) {
                    const scrollPos = parseInt(savedScroll, 10);
                    const restoreScroll = () => {
                        scroller.reload();
                        scroller.slideTo(scrollPos, true);
                        // slideTo animates the position with a CSS transition, and the
                        // scroller keeps re-running it while the page layout settles
                        // after navigation, so the row crawls into place over several
                        // seconds. Clearing the transition snaps it instantly.
                        if (isTransform) {
                            scrollSlider.style.transition = 'none';
                        }
                    };

                    restoreRaf = requestAnimationFrame(restoreScroll);

                    restoreObserver = new ResizeObserver(restoreScroll);
                    restoreObserver.observe(scrollFrame);
                    restoreObserver.observe(scrollSlider);
                    restoreTimeout = setTimeout(() => {
                        restoreObserver?.disconnect();
                        if (isTransform) scrollSlider.style.transition = '';
                    }, 3000);
                }
            }
            hasRestoredScroll.current = true;

            let ticking = false;
            const saveScroll = () => {
                sessionStorage.setItem(storageKey, String(Math.round(scroller.getScrollPosition())));
                ticking = false;
            };
            onScroll = () => {
                if (!ticking) {
                    ticking = true;
                    requestAnimationFrame(saveScroll);
                }
            };

            scrollFrame.addEventListener(scrollEventName, onScroll, { passive: true });
        };

        setup();

        return () => {
            cancelAnimationFrame(setupRaf);
            cancelAnimationFrame(restoreRaf);
            restoreObserver?.disconnect();
            if (restoreTimeout) clearTimeout(restoreTimeout);
            if (scrollFrame && onScroll) {
                scrollFrame.removeEventListener(scrollEventName, onScroll);
            }
        };
    }, [cardOptions, items, navigationType, sectionKey]);

    return (
        <div
            ref={element}
            className='verticalSection'
            dangerouslySetInnerHTML={createScroller({ title })}
        />
    );
};

export default SearchResultsRow;
