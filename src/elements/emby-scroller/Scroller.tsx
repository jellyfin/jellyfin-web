import React, {
    type FC,
    type PropsWithChildren,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import classNames from 'classnames';
import useElementSize from 'hooks/useElementSize';
import layoutManager from '../../components/layoutManager';
import dom from '../../utils/dom';
import browser from '../../scripts/browser';
import focusManager from '../../components/focusManager';
import ScrollerFactory from 'lib/scroller';
import ScrollButtons from '../emby-scrollbuttons/ScrollButtons';
import './emby-scroller.scss';

export interface ScrollerProps {
    className?: string;
    isHorizontalEnabled?: boolean;
    isMouseWheelEnabled?: boolean;
    isCenterFocusEnabled?: boolean;
    isScrollButtonsEnabled?: boolean;
    isSkipFocusWhenVisibleEnabled?: boolean;
    isScrollEventEnabled?: boolean;
    isHideScrollbarEnabled?: boolean;
    isAllowNativeSmoothScrollEnabled?: boolean;
}

const Scroller: FC<PropsWithChildren<ScrollerProps>> = ({
    className,
    isHorizontalEnabled = true,
    isMouseWheelEnabled = false,
    isCenterFocusEnabled = false,
    isScrollButtonsEnabled = true,
    isSkipFocusWhenVisibleEnabled = false,
    isScrollEventEnabled = false,
    isHideScrollbarEnabled = false,
    isAllowNativeSmoothScrollEnabled = false,
    children
}) => {
    const [scrollRef, size] = useElementSize();

    const [showControls, setShowControls] = useState(false);
    const [scrollState, setScrollState] = useState({
        scrollSize: size.width,
        scrollPos: 0,
        scrollWidth: 0
    });
    const scrollerFactoryRef = useRef<ScrollerFactory | null>(null);

    const getScrollSlider = useCallback(() => {
        if (scrollerFactoryRef.current) {
            return scrollerFactoryRef.current.getScrollSlider();
        }
    }, [scrollerFactoryRef]);

    const getScrollPosition = useCallback(() => {
        if (scrollerFactoryRef.current) {
            return scrollerFactoryRef.current.getScrollPosition();
        }

        return 0;
    }, [scrollerFactoryRef]);

    const getScrollWidth = useCallback(() => {
        if (scrollerFactoryRef.current) {
            return scrollerFactoryRef.current.getScrollSize();
        }

        return 0;
    }, [scrollerFactoryRef]);

    const getStyleValue = useCallback(
        (style: CSSStyleDeclaration, name: string) => {
            let value = style.getPropertyValue(name);
            if (!value) {
                return 0;
            }

            value = value.replace('px', '');
            if (!value) {
                return 0;
            }

            if (isNaN(parseInt(value, 10))) {
                return 0;
            }

            return Number(value);
        },
        []
    );

    const getScrollSize = useCallback(() => {
        const scroller = scrollRef?.current as HTMLDivElement;
        let scrollSize = scroller.offsetWidth;
        let style = window.getComputedStyle(scroller, null);

        let paddingLeft = getStyleValue(style, 'padding-left');
        if (paddingLeft) {
            scrollSize -= paddingLeft;
        }

        let paddingRight = getStyleValue(style, 'padding-right');
        if (paddingRight) {
            scrollSize -= paddingRight;
        }

        const slider = getScrollSlider();
        style = window.getComputedStyle(slider, null);

        paddingLeft = getStyleValue(style, 'padding-left');
        if (paddingLeft) {
            scrollSize -= paddingLeft;
        }

        paddingRight = getStyleValue(style, 'padding-right');
        if (paddingRight) {
            scrollSize -= paddingRight;
        }

        return scrollSize;
    }, [getScrollSlider, getStyleValue, scrollRef]);

    const onScroll = useCallback(() => {
        const scrollSize = getScrollSize();
        const scrollPos = getScrollPosition();
        const scrollWidth = getScrollWidth();

        setScrollState({
            scrollSize: scrollSize,
            scrollPos: scrollPos,
            scrollWidth: scrollWidth
        });
    }, [getScrollPosition, getScrollSize, getScrollWidth]);

    const initCenterFocus = useCallback(
        (elem: HTMLElement, scrollerInstance: ScrollerFactory) => {
            dom.addEventListener(
                elem,
                'focus',
                function (e: FocusEvent) {
                    const focused = focusManager.focusableParent(e.target);
                    if (focused) {
                        scrollerInstance.toCenter(focused, false);
                    }
                },
                {
                    capture: true,
                    passive: true
                }
            );
        },
        []
    );

    const addScrollEventListener = useCallback(
        (fn: () => void, options: AddEventListenerOptions | undefined) => {
            if (scrollerFactoryRef.current) {
                dom.addEventListener(
                    scrollerFactoryRef.current.getScrollFrame(),
                    scrollerFactoryRef.current.getScrollEventName(),
                    fn,
                    options
                );
            }
        },
        [scrollerFactoryRef]
    );

    const removeScrollEventListener = useCallback(
        (fn: () => void, options: AddEventListenerOptions | undefined) => {
            if (scrollerFactoryRef.current) {
                dom.removeEventListener(
                    scrollerFactoryRef.current.getScrollFrame(),
                    scrollerFactoryRef.current.getScrollEventName(),
                    fn,
                    options
                );
            }
        },
        [scrollerFactoryRef]
    );

    useEffect(() => {
        const frame = scrollRef.current;

        if (!frame) {
            console.error('Unexpected null reference');
            return;
        }

        const enableScrollButtons =
            layoutManager.desktop &&
            isHorizontalEnabled &&
            isScrollButtonsEnabled;

        const options = {
            horizontal: isHorizontalEnabled,
            mouseDragging: 1,
            mouseWheel: isMouseWheelEnabled,
            touchDragging: 1,
            slidee: scrollRef.current?.querySelector('.scrollSlider'),
            scrollBy: 200,
            speed: isHorizontalEnabled ? 270 : 240,
            elasticBounds: 1,
            dragHandle: 1,
            autoImmediate: true,
            skipSlideToWhenVisible: isSkipFocusWhenVisibleEnabled,
            dispatchScrollEvent: enableScrollButtons || isScrollEventEnabled,
            hideScrollbar: enableScrollButtons || isHideScrollbarEnabled,
            allowNativeSmoothScroll:
                isAllowNativeSmoothScrollEnabled && !enableScrollButtons,
            allowNativeScroll: !enableScrollButtons,
            forceHideScrollbars: enableScrollButtons,
            // In edge, with the native scroll, the content jumps around when hovering over the buttons
            requireAnimation: enableScrollButtons && browser.edge
        };

        // If just inserted it might not have any height yet - yes this is a hack
        scrollerFactoryRef.current = new ScrollerFactory(frame, options);
        scrollerFactoryRef.current.init();
        scrollerFactoryRef.current.reload();

        if (layoutManager.tv && isCenterFocusEnabled) {
            initCenterFocus(frame, scrollerFactoryRef.current);
        }

        if (enableScrollButtons) {
            addScrollEventListener(onScroll, {
                capture: false,
                passive: true
            });
            setShowControls(true);
        }

        return () => {
            if (scrollerFactoryRef.current) {
                scrollerFactoryRef.current.destroy();
                scrollerFactoryRef.current = null;
            }

            removeScrollEventListener(onScroll, {
                capture: false,
                passive: true
            });
        };
    }, [
        addScrollEventListener,
        initCenterFocus,
        isAllowNativeSmoothScrollEnabled,
        isCenterFocusEnabled,
        isHideScrollbarEnabled,
        isHorizontalEnabled,
        isMouseWheelEnabled,
        isScrollButtonsEnabled,
        isScrollEventEnabled,
        isSkipFocusWhenVisibleEnabled,
        onScroll,
        removeScrollEventListener,
        scrollRef
    ]);

    return (
        <>
            {showControls &&
                scrollState.scrollWidth > scrollState.scrollSize + 20 && (
                    <ScrollButtons
                        scrollerFactoryRef={scrollerFactoryRef}
                        scrollState={scrollState}
                    />
                )}

            <div
                ref={scrollRef}
                className={classNames('emby-scroller', className)}
            >
                {children}
            </div>
        </>
    );
};

export default Scroller;
