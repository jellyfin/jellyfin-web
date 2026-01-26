import React, { type ReactNode, type ReactElement, type CSSProperties } from 'react';
import { Root, List, Trigger, Content } from '@radix-ui/react-tabs';
import { tabsList, tabTrigger, tabContent } from './Tabs.css';

interface TabsProps {
    readonly value: string;
    readonly onValueChange: (value: string) => void;
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}

export function Tabs({ value, onValueChange, children, className, style }: TabsProps): ReactElement {
    return (
        <Root value={value} onValueChange={onValueChange} className={className} style={style}>
            {children}
        </Root>
    );
}

interface TabListProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}

export function TabList({ children, className, style: listStyle }: TabListProps): ReactElement {
    return (
        <List className={`${tabsList} ${className ?? ''}`} style={listStyle}>
            {children}
        </List>
    );
}

interface TabProps {
    readonly value: string;
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly asChild?: boolean;
}

export function Tab({ value, children, className, style: tabStyle, asChild = false }: TabProps): ReactElement {
    return (
        <Trigger value={value} className={`${tabTrigger} ${className ?? ''}`} style={tabStyle} asChild={asChild}>
            {children}
        </Trigger>
    );
}

export function TabPanel({
    value,
    children,
    className,
    style
}: {
    readonly value: string;
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    return (
        <Content value={value} className={`${tabContent} ${className ?? ''}`} style={style}>
            {children}
        </Content>
    );
}

export { tabsList, tabTrigger, tabContent };
