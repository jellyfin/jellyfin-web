import { Content, Overlay, Portal, Root } from '@radix-ui/react-dialog';
import React, { type CSSProperties, type ReactElement, type ReactNode, useCallback } from 'react';
import { drawerAnchor, drawerContent, drawerOverlay } from './Drawer.css.ts';

export type DrawerAnchor = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerProps {
    readonly anchor?: DrawerAnchor;
    readonly open: boolean;
    readonly onClose: () => void;
    readonly children: ReactNode;
    readonly style?: CSSProperties;
    readonly className?: string;
}

export function Drawer({
    anchor = 'left',
    open,
    onClose,
    children,
    style,
    className
}: DrawerProps): ReactElement {
    const handleOpenChange = useCallback(
        (value: boolean): void => {
            if (!value) {
                onClose();
            }
        },
        [onClose]
    );

    return (
        <Root open={open} onOpenChange={handleOpenChange}>
            <Portal>
                <Overlay className={drawerOverlay} />
                <Content
                    className={[drawerContent, drawerAnchor[anchor], className ?? ''].join(' ')}
                    style={style}
                >
                    {children}
                </Content>
            </Portal>
        </Root>
    );
}

export { drawerOverlay, drawerContent, drawerAnchor };
