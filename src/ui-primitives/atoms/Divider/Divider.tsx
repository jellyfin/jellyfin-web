import React, { type CSSProperties, type ReactElement } from 'react';
import { dividerStyles, dividerVertical } from './Divider.css.ts';

interface DividerProps {
    readonly orientation?: 'horizontal' | 'vertical';
    readonly className?: string;
    readonly style?: CSSProperties;
}

export function Divider({
    orientation = 'horizontal',
    className,
    style
}: DividerProps): ReactElement {
    if (orientation === 'vertical') {
        return <span className={`${dividerVertical} ${className ?? ''}`} style={style} />;
    }
    return <hr className={`${dividerStyles} ${className ?? ''}`} style={style} />;
}

export { dividerStyles, dividerVertical } from './Divider.css.ts';
