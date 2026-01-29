import {
    Content,
    Group,
    Item,
    ItemIndicator,
    Label,
    Portal,
    RadioGroup,
    RadioItem,
    Root,
    Separator,
    Sub,
    SubContent,
    SubTrigger,
    Trigger
} from '@radix-ui/react-dropdown-menu';
import React, { type ElementType, type ReactElement, type ReactNode } from 'react';
import {
    listItemDecorator,
    menuArrow,
    menuContent,
    menuItem,
    menuItemIndicator,
    menuItemVariant,
    menuLabel,
    menuRadioGroup,
    menuRadioItem,
    menuSeparator,
    menuTrigger,
    subMenuContent,
    subMenuTrigger,
    subMenuTriggerIndicator
} from './Menu.css.ts';

interface MenuProps {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
    readonly children: ReactNode;
    readonly trigger?: ReactNode;
    readonly align?: 'start' | 'center' | 'end';
    readonly sideOffset?: number;
    readonly id?: string;
}

export function Menu({
    open,
    onOpenChange,
    children,
    trigger,
    align = 'start',
    sideOffset = 4,
    id
}: MenuProps): ReactElement {
    if (!trigger) {
        return (
            <Root open={open} onOpenChange={onOpenChange}>
                {children}
            </Root>
        );
    }

    return (
        <Root open={open} onOpenChange={onOpenChange}>
            <Trigger asChild>{trigger}</Trigger>
            <Portal>
                <Content id={id} className={menuContent} align={align} sideOffset={sideOffset}>
                    {children}
                </Content>
            </Portal>
        </Root>
    );
}

interface MenuItemProps {
    readonly children: ReactNode;
    readonly onClick?: () => void;
    readonly variant?: 'default' | 'danger';
    readonly disabled?: boolean;
    readonly component?: ElementType;
    readonly to?: string;
}

export function MenuItem({
    children,
    onClick,
    variant = 'default',
    disabled
}: MenuItemProps): ReactElement {
    return (
        <Item
            className={`${menuItem} ${menuItemVariant[variant]}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </Item>
    );
}

export function MenuItemDecorator({ children }: { readonly children: ReactNode }): ReactElement {
    return <span className={listItemDecorator}>{children}</span>;
}

interface MenuRadioItemProps {
    readonly children: ReactNode;
    readonly value: string;
    readonly onSelect?: () => void;
}

export function MenuRadioItem({ children, value, onSelect }: MenuRadioItemProps): ReactElement {
    return (
        <RadioItem className={menuRadioItem} value={value} onSelect={onSelect}>
            <ItemIndicator className={menuItemIndicator}>✓</ItemIndicator>
            {children}
        </RadioItem>
    );
}

interface MenuRadioGroupProps {
    readonly children: ReactNode;
    readonly value: string;
    readonly onValueChange: (value: string) => void;
}

export function MenuRadioGroup({
    children,
    value,
    onValueChange
}: MenuRadioGroupProps): ReactElement {
    return (
        <RadioGroup className={menuRadioGroup} value={value} onValueChange={onValueChange}>
            {children}
        </RadioGroup>
    );
}

export function MenuSeparator(): ReactElement {
    return <Separator className={menuSeparator} />;
}

export function MenuLabel({ children }: { readonly children: ReactNode }): ReactElement {
    return <Label className={menuLabel}>{children}</Label>;
}

interface SubMenuProps {
    readonly children: ReactNode;
    readonly trigger: ReactNode;
    readonly alignOffset?: number;
}

export function SubMenu({ children, trigger, alignOffset = -4 }: SubMenuProps): ReactElement {
    return (
        <Sub>
            <SubTrigger className={`${menuItem} ${subMenuTrigger}`}>
                {trigger}
                <span className={subMenuTriggerIndicator}>▶</span>
            </SubTrigger>
            <Portal>
                <SubContent className={subMenuContent} alignOffset={alignOffset}>
                    {children}
                </SubContent>
            </Portal>
        </Sub>
    );
}

export function MenuTrigger({ children }: { readonly children: ReactNode }): ReactElement {
    return <Trigger asChild>{children}</Trigger>;
}

export function MenuPortal({ children }: { readonly children: ReactNode }): ReactElement {
    return <Portal>{children}</Portal>;
}

export function MenuContent({
    children,
    className,
    style,
    align = 'start',
    sideOffset = 4
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: React.CSSProperties;
    readonly align?: 'start' | 'center' | 'end';
    readonly sideOffset?: number;
}): ReactElement {
    return (
        <Content
            className={className ?? menuContent}
            style={style}
            align={align}
            sideOffset={sideOffset}
        >
            {children}
        </Content>
    );
}

export function MenuGroup({ children }: { readonly children: ReactNode }): ReactElement {
    return <Group>{children}</Group>;
}

export const menuStyles = {
    content: menuContent,
    item: menuItem,
    itemVariant: menuItemVariant,
    separator: menuSeparator,
    label: menuLabel,
    trigger: menuTrigger,
    arrow: menuArrow,
    radioGroup: menuRadioGroup,
    radioItem: menuRadioItem,
    itemIndicator: menuItemIndicator,
    subMenuContent: subMenuContent,
    subMenuTrigger: subMenuTrigger,
    subMenuTriggerIndicator: subMenuTriggerIndicator,
    listItemDecorator: listItemDecorator
};

export {
    menuContent,
    menuItem,
    menuItemVariant,
    menuSeparator,
    menuLabel,
    menuTrigger,
    menuArrow,
    menuRadioGroup,
    menuRadioItem,
    menuItemIndicator,
    subMenuContent,
    subMenuTrigger,
    subMenuTriggerIndicator,
    listItemDecorator as menuItemDecorator
};
