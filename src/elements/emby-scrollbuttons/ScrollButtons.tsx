import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import scrollerFactory from '../../libraries/scroller';
import globalize from '../../scripts/globalize';
import IconButton from '../emby-button/IconButton';
import './emby-scrollbuttons.scss';

enum Direction {
    RIGHT,
    LEFT,
  }

interface ScrollButtonsProps {
    scrollRef?: React.MutableRefObject<HTMLElement | null>;
    scrollerFactoryRef: React.MutableRefObject<scrollerFactory | null>;
    scrollState: {
        scrollSize: number;
        scrollPos: number;
        scrollWidth: number;
    }
}

const ScrollButtons: FC<ScrollButtonsProps> = ({ scrollerFactoryRef, scrollState }) => {
    const [localeScrollPos, setLocaleScrollPos] = useState<number>(0);
    const scrollButtonsRef = useRef<HTMLDivElement>(null);

    const scrollToPosition = useCallback((pos: number, immediate: boolean) => {
        if (scrollerFactoryRef.current) {
            scrollerFactoryRef.current.slideTo(pos, immediate, undefined );
        }
    }, [scrollerFactoryRef]);

    const onScrollButtonClick = useCallback((direction: Direction) => {
        let newPos;
        if (direction === Direction.LEFT) {
            newPos = Math.max(0, scrollState.scrollPos - scrollState.scrollSize);
        } else {
            newPos = scrollState.scrollPos + scrollState.scrollSize;
        }

        if (globalize.getIsRTL() && direction === Direction.LEFT) {
            newPos = scrollState.scrollPos + scrollState.scrollSize;
        } else if (globalize.getIsRTL()) {
            newPos = Math.min(0, scrollState.scrollPos - scrollState.scrollSize);
        }

        scrollToPosition(newPos, false);
    }, [ scrollState.scrollPos, scrollState.scrollSize, scrollToPosition ]);

    const triggerScrollLeft = useCallback(() => onScrollButtonClick(Direction.LEFT), [ onScrollButtonClick ]);
    const triggerScrollRight = useCallback(() => onScrollButtonClick(Direction.RIGHT), [ onScrollButtonClick ]);

    useEffect(() => {
        const parent = scrollButtonsRef.current?.parentNode as HTMLDivElement;
        parent.classList.add('emby-scroller-container');

        let localeAwarePos = scrollState.scrollPos;
        if (globalize.getIsElementRTL(scrollButtonsRef.current)) {
            localeAwarePos *= -1;
        }
        setLocaleScrollPos(localeAwarePos);
    }, [scrollState.scrollPos]);

    return (
        <div ref={scrollButtonsRef} className='emby-scrollbuttons padded-right'>

            <IconButton
                type='button'
                className='emby-scrollbuttons-button btnPrev'
                onClick={triggerScrollLeft}
                icon='chevron_left'
                disabled={localeScrollPos > 0 ? false : true}
            />

            <IconButton
                type='button'
                className='emby-scrollbuttons-button btnNext'
                onClick={triggerScrollRight}
                icon='chevron_right'
                disabled={scrollState.scrollWidth > 0 && localeScrollPos + scrollState.scrollSize >= scrollState.scrollWidth ? true : false}
            />
        </div>
    );
};

export default ScrollButtons;

