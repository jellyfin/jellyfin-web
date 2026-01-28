import React, { type ReactElement } from 'react';
import { spacerSizes } from './Spacer.css.ts';

export type SpacerSize = keyof typeof spacerSizes;

interface SpacerProps {
    readonly size?: SpacerSize;
    readonly className?: string;
}

export function Spacer({ size = 'md', className }: SpacerProps): ReactElement {
    return <div className={`${spacerSizes[size]} ${className ?? ''}`} />;
}

export { spacerSizes };
