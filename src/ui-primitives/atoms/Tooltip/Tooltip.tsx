import React, { type ReactNode, type ReactElement } from 'react';
import { Provider, Root, Trigger, Portal, Content, Arrow } from '@radix-ui/react-tooltip';
import { vars } from '../../../styles/tokens.css';
import { tooltipContent } from './Tooltip.css';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
    readonly title: string;
    readonly children: ReactNode;
    readonly className?: string;
    readonly placement?: TooltipPlacement;
    readonly variant?: 'plain' | 'soft' | 'solid';
}

export function Tooltip({ title, children, className, placement = 'top' }: TooltipProps): ReactElement {
    return (
        <Provider>
            <Root>
                <Trigger asChild className={className} aria-label={title}>
                    {children}
                </Trigger>
                <Portal>
                    <Content className={tooltipContent} side={placement} sideOffset={5}>
                        {title}
                        <Arrow style={{ fill: vars.colors.surfaceHover }} />
                    </Content>
                </Portal>
            </Root>
        </Provider>
    );
}

export { tooltipContent };
