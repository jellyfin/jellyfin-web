import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import React, { type FC, useEffect, useRef } from 'react';
import { useNavigationType } from 'react-router-dom';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import type { CardOptions } from 'types/cardOptions';
import 'elements/emby-scroller/emby-scroller';
import 'elements/emby-itemscontainer/emby-itemscontainer';

const SCROLL_KEY_PREFIX = 'jellyfin-scroll:search-row:';
const MAX_SCROLLER_INIT_ATTEMPTS = 60;
const RESTORE_SETTLE_MS = 3000;

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
        let attempts = 0;
        let cleanupReady: (() => void) | undefined;

        const setup = () => {
            const scrollerEl = element.current?.querySelector('[is="emby-scroller"]') as ScrollerElement | null;
            const scroller = scrollerEl?.scroller;

            if (!scroller) {
                if (attempts++ < MAX_SCROLLER_INIT_ATTEMPTS) {
                    setupRaf = requestAnimationFrame(setup);
                }
                return;
            }

            scroller.reload();

            const scrollFrame = scroller.getScrollFrame();
            const scrollSlider = scroller.getScrollSlider();
            const scrollEventName = scroller.getScrollEventName();
            const isTransform = scrollEventName === 'scrollanimate';

            let restoreRaf = 0;
            let restoreObserver: ResizeObserver | undefined;
            let restoreTimeout: ReturnType<typeof setTimeout> | undefined;

            if (navigationType === 'POP' && !hasRestoredScroll.current) {
                const savedScroll = sessionStorage.getItem(storageKey);
                if (savedScroll !== null) {
                    const scrollPos = parseInt(savedScroll, 10);
                    const restoreScroll = () => {
                        scroller.reload();
                        scroller.slideTo(scrollPos, true);
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
                    }, RESTORE_SETTLE_MS);
                }
            }
            hasRestoredScroll.current = true;

            let ticking = false;
            const saveScroll = () => {
                sessionStorage.setItem(storageKey, String(Math.round(scroller.getScrollPosition())));
                ticking = false;
            };
            const onScroll = () => {
                if (!ticking) {
                    ticking = true;
                    requestAnimationFrame(saveScroll);
                }
            };

            scrollFrame.addEventListener(scrollEventName, onScroll, { passive: true });

            cleanupReady = () => {
                cancelAnimationFrame(restoreRaf);
                restoreObserver?.disconnect();
                if (restoreTimeout) clearTimeout(restoreTimeout);
                scrollFrame.removeEventListener(scrollEventName, onScroll);
            };
        };

        setup();

        return () => {
            cancelAnimationFrame(setupRaf);
            cleanupReady?.();
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
