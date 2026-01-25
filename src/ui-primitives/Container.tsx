import type { ReactElement, ReactNode } from 'react';
import { container, maxWidth as maxWidthStyles } from './Container.css';

export { container as containerStyles, maxWidthStyles as containerMaxWidth };

interface ContainerProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none';
}

export function Container({ children, className, style: containerStyle, maxWidth: maxWidthProp = 'lg' }: ContainerProps): ReactElement {
    const maxWidthClass = maxWidthProp === 'none' ? maxWidthStyles.none : maxWidthStyles[maxWidthProp];
    return (
        <div className={`${container} ${maxWidthClass} ${className ?? ''}`} style={containerStyle}>
            {children}
        </div>
    );
}
