import { Root as ToggleRoot } from '@radix-ui/react-toggle';
import {
    Item as ToggleGroupItemPrimitive,
    Root as ToggleGroupRoot,
    type ToggleGroupSingleProps
} from '@radix-ui/react-toggle-group';
import type { ReactElement, ReactNode } from 'react';
import {
    toggleGroupItem,
    toggleGroupRoot,
    toggleRoot,
    toggleSizes,
    toggleVariant
} from './Toggle.css.ts';

interface ToggleProps {
    readonly children: ReactNode;
    readonly pressed?: boolean;
    readonly onPressedChange?: (pressed: boolean) => void;
    readonly disabled?: boolean;
    readonly variant?: 'primary' | 'secondary' | 'outline';
    readonly size?: 'sm' | 'md' | 'lg';
    readonly className?: string;
}

export function Toggle({
    children,
    pressed,
    onPressedChange,
    disabled,
    variant = 'primary',
    size = 'md',
    className
}: ToggleProps): ReactElement {
    return (
        <ToggleRoot
            className={`${toggleRoot} ${toggleVariant[variant]} ${toggleSizes[size]} ${className ?? ''}`}
            pressed={pressed}
            onPressedChange={onPressedChange}
            disabled={disabled}
        >
            {children}
        </ToggleRoot>
    );
}

interface ToggleGroupItemProps {
    readonly children: ReactNode;
    readonly value: string;
    readonly disabled?: boolean;
    readonly className?: string;
}

export function ToggleGroup({
    children,
    value,
    onValueChange,
    defaultValue,
    disabled,
    className,
    ...props
}: ToggleGroupSingleProps & { readonly className?: string }): ReactElement {
    return (
        <ToggleGroupRoot
            className={`${toggleGroupRoot} ${className ?? ''}`}
            value={value}
            onValueChange={onValueChange}
            defaultValue={defaultValue}
            disabled={disabled}
            {...props}
        >
            {children}
        </ToggleGroupRoot>
    );
}

export function ToggleGroupItem({
    children,
    value,
    disabled,
    className
}: ToggleGroupItemProps): ReactElement {
    return (
        <ToggleGroupItemPrimitive
            className={`${toggleGroupItem} ${className ?? ''}`}
            value={value}
            disabled={disabled}
        >
            {children}
        </ToggleGroupItemPrimitive>
    );
}

export { toggleRoot, toggleVariant, toggleSizes, toggleGroupRoot, toggleGroupItem };
