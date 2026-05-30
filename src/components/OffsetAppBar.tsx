import AppBar, { type AppBarProps } from '@mui/material/AppBar';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import React, { useLayoutEffect, useRef, useState, type FC, type PropsWithChildren } from 'react';

/** The default height of an AppBar. */
const DEFAULT_APP_BAR_HEIGHT = 64;
/** The height of a dense AppBar. */
const DENSE_APP_BAR_HEIGHT = 48;

interface OffsetAppBarProps extends AppBarProps {
    /** Use the dense variant of the AppBar, which has a smaller default height. */
    dense?: boolean;
    /** The elevation to apply when the user has scrolled. Defaults to 1. */
    elevation?: number;
}

/**
 * AppBar wrapper with a fixed position and a spacer to prevent content from rendering underneath.
 */
const OffsetAppBar: FC<PropsWithChildren<OffsetAppBarProps>> = ({
    children,
    dense = false,
    elevation = 1,
    ...props
}) => {
    const appBarRef = useRef<HTMLHtmlElement>(null);
    const [height, setHeight] = useState(dense ? DENSE_APP_BAR_HEIGHT : DEFAULT_APP_BAR_HEIGHT);

    const scrollTrigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 0
    });

    useLayoutEffect(() => {
        const el = appBarRef.current;
        if (!el) return;

        // Set initial measured height
        const updateHeight = () => {
            setHeight(Math.ceil(el.getBoundingClientRect().height || 0));
        };

        updateHeight();

        // Use ResizeObserver for dynamic changes
        const observer = new ResizeObserver(entries => {
            // Use requestAnimationFrame to batch DOM writes
            window.requestAnimationFrame(() => {
                for (const entry of entries) {
                    setHeight(Math.ceil(entry.contentRect.height || 0));
                }
            });
        });
        observer.observe(el);
        // Update on window resize as a fallback
        window.addEventListener('resize', updateHeight);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateHeight);
        };
    }, []);

    return (
        <>
            <AppBar
                {...props}
                ref={appBarRef}
                position='fixed'
                color={scrollTrigger ? 'default' : 'transparent'}
                elevation={scrollTrigger ? elevation : 0}
            >
                {children}
            </AppBar>
            {/* Spacer to prevent content rendering under the AppBar */}
            <div
                aria-hidden='true'
                style={{
                    height,
                    width: '100%',
                    flexShrink: 0
                }}
            />
        </>
    );
};

export default OffsetAppBar;
