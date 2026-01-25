import { Root } from '@radix-ui/react-separator';
import React, { type ReactElement } from 'react';
import { separatorHorizontal, separatorRoot, separatorStyles, separatorVertical } from './Separator.css';

export { separatorHorizontal, separatorRoot, separatorStyles, separatorVertical };

interface SeparatorProps {
    readonly orientation?: 'horizontal' | 'vertical';
    readonly decorative?: boolean;
    readonly className?: string;
}

export function Separator({ orientation = 'horizontal', decorative = true, className }: SeparatorProps): ReactElement {
    const baseClass = orientation === 'vertical' ? separatorVertical : separatorHorizontal;
    return (
        <Root
            className={`${separatorRoot} ${baseClass} ${className ?? ''}`}
            orientation={orientation}
            decorative={decorative}
        />
    );
}
