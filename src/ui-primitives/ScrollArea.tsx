import { Root, Viewport, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaCorner } from '@radix-ui/react-scroll-area';
import type { ReactElement, ReactNode } from 'react';
import {
    scrollAreaRoot,
    scrollAreaViewport,
    scrollAreaScrollbar,
    scrollAreaThumb,
    scrollAreaCorner
} from './ScrollArea.css';

interface ScrollAreaProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly horizontal?: boolean;
    readonly vertical?: boolean;
}

export function ScrollArea({ children, className, horizontal = true, vertical = true }: ScrollAreaProps): ReactElement {
    return (
        <Root className={`${scrollAreaRoot} ${className ?? ''}`}>
            <Viewport className={scrollAreaViewport}>{children}</Viewport>
            <ScrollAreaScrollbar className={scrollAreaScrollbar} orientation={vertical ? 'vertical' : 'horizontal'}>
                <ScrollAreaThumb className={scrollAreaThumb} />
            </ScrollAreaScrollbar>
            {horizontal && (
                <ScrollAreaScrollbar className={scrollAreaScrollbar} orientation='horizontal'>
                    <ScrollAreaThumb className={scrollAreaThumb} />
                </ScrollAreaScrollbar>
            )}
            <ScrollAreaCorner className={scrollAreaCorner} />
        </Root>
    );
}

export { scrollAreaRoot, scrollAreaViewport, scrollAreaScrollbar, scrollAreaThumb, scrollAreaCorner };
