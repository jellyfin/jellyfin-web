import React, { type ReactElement, type ReactNode } from 'react';
import { Root, Item, Indicator } from '@radix-ui/react-radio-group';
import {
    radioGroupIndicator,
    radioGroupIndicatorInner,
    radioGroupItem,
    radioGroupItemIndicator,
    radioGroupLabel,
    radioGroupRoot
} from './RadioGroup.css.ts';

export {
    radioGroupIndicator,
    radioGroupIndicatorInner,
    radioGroupItem,
    radioGroupItemIndicator,
    radioGroupLabel,
    radioGroupRoot
};

interface RadioGroupProps {
    readonly children: ReactNode;
    readonly value: string;
    readonly onValueChange: (value: string) => void;
    readonly className?: string;
}

export function RadioGroup({ children, value, onValueChange, className }: RadioGroupProps): ReactElement {
    return (
        <Root className={`${radioGroupRoot} ${className ?? ''}`} value={value} onValueChange={onValueChange}>
            {children}
        </Root>
    );
}

interface RadioGroupItemProps {
    readonly value: string;
    readonly id: string;
    readonly label: string;
    readonly disabled?: boolean;
}

export function RadioGroupItem({ value, id, label, disabled }: RadioGroupItemProps): ReactElement {
    return (
        <Item className={radioGroupItem} value={value} id={id} disabled={disabled}>
            <Indicator className={radioGroupIndicator}>
                <span className={radioGroupIndicatorInner} data-state="checked" />
            </Indicator>
            <label className={radioGroupLabel} htmlFor={id}>
                {label}
            </label>
        </Item>
    );
}

interface RadioProps {
    readonly value: string;
    readonly label: string;
    readonly disabled?: boolean;
    readonly id?: string;
}

export function Radio({ value, label, disabled = false, id }: RadioProps): ReactElement {
    const itemId = id ?? `radio-${value}`;
    return <RadioGroupItem value={value} id={itemId} label={label} disabled={disabled} />;
}

export function RadioGroupLabel({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <span className={`${radioGroupLabel} ${className ?? ''}`}>{children}</span>;
}

export function RadioGroupItemIndicator(): ReactElement {
    return (
        <Indicator className={radioGroupItemIndicator}>
            <span className={radioGroupIndicatorInner} data-state="checked" />
        </Indicator>
    );
}
