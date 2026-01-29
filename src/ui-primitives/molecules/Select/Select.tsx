import {
    Content,
    Group,
    Icon,
    Item,
    ItemIndicator,
    ItemText,
    Label,
    Portal,
    Root,
    ScrollDownButton,
    ScrollUpButton,
    type SelectContentProps,
    type SelectItemProps,
    type SelectTriggerProps,
    Separator,
    Trigger,
    Value,
    Viewport
} from '@radix-ui/react-select';
import React, {
    forwardRef,
    type ReactElement,
    type ReactNode,
    type SelectHTMLAttributes
} from 'react';
import {
    selectContent,
    selectInputContainer,
    selectInputHelper,
    selectInputLabel,
    selectInputStyles,
    selectItem,
    selectItemIndicator,
    selectLabel,
    selectScrollButton,
    selectSeparator,
    selectTrigger,
    selectViewport
} from './Select.css.ts';

export const selectStyles = {
    trigger: selectTrigger,
    content: selectContent,
    viewport: selectViewport,
    item: selectItem,
    itemIndicator: selectItemIndicator,
    label: selectLabel,
    separator: selectSeparator,
    scrollButton: selectScrollButton
};

export const Select = Root;

export const SelectTrigger = forwardRef<
    HTMLButtonElement,
    SelectTriggerProps & { readonly className?: string }
>(({ children, className, ...props }, ref): ReactElement => {
    return (
        <Trigger ref={ref} className={`${selectTrigger} ${className ?? ''}`} {...props}>
            {children}
            <Icon style={{ display: 'flex' }}>
                <ChevronDownIcon />
            </Icon>
        </Trigger>
    );
});

SelectTrigger.displayName = 'SelectTrigger';

export function SelectValue({
    placeholder,
    className
}: {
    readonly placeholder?: string;
    readonly className?: string;
}): ReactElement {
    return <Value className={className} placeholder={placeholder} />;
}

export function SelectContent({
    children,
    className,
    position = 'popper',
    ...props
}: SelectContentProps & {
    readonly className?: string;
    readonly position?: 'popper' | 'item-aligned';
}): ReactElement {
    return (
        <Portal>
            <Content
                className={`${selectContent} ${className ?? ''}`}
                position={position}
                {...props}
            >
                <ScrollUpButton className={selectScrollButton}>
                    <ChevronUpIcon />
                </ScrollUpButton>
                <Viewport className={selectViewport}>{children}</Viewport>
                <ScrollDownButton className={selectScrollButton}>
                    <ChevronDownIcon />
                </ScrollDownButton>
            </Content>
        </Portal>
    );
}

export function SelectItem({
    children,
    value,
    className,
    ...props
}: SelectItemProps & { readonly className?: string }): ReactElement {
    return (
        <Item className={`${selectItem} ${className ?? ''}`} value={value} {...props}>
            <ItemIndicator className={selectItemIndicator}>
                <CheckIcon />
            </ItemIndicator>
            <ItemText>{children}</ItemText>
        </Item>
    );
}

export function SelectGroup({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <Group className={className}>{children}</Group>;
}

export function SelectLabel({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <Label className={`${selectLabel} ${className ?? ''}`}>{children}</Label>;
}

export function SelectSeparator({ className }: { readonly className?: string }): ReactElement {
    return <Separator className={`${selectSeparator} ${className ?? ''}`} />;
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
    readonly label?: string;
    readonly helperText?: ReactNode;
    readonly placeholder?: string;
}

export function SelectInput({
    label,
    helperText,
    placeholder,
    id,
    className,
    style: selectStyle,
    children,
    ...props
}: SelectInputProps): ReactElement {
    return (
        <div className={selectInputContainer}>
            {label !== undefined && label !== '' && (
                <label className={selectInputLabel} htmlFor={id}>
                    {label}
                </label>
            )}
            <select
                id={id}
                className={`${selectInputStyles} ${className ?? ''}`}
                style={selectStyle}
                {...props}
            >
                {placeholder !== undefined && placeholder !== '' && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {children}
            </select>
            {helperText !== undefined && <div className={selectInputHelper}>{helperText}</div>}
        </div>
    );
}

function ChevronDownIcon(): ReactElement {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ChevronUpIcon(): ReactElement {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M4 10L8 6L12 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CheckIcon(): ReactElement {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
        >
            <path
                d="M13 4L6 11L3 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export {
    selectContent,
    selectInputContainer,
    selectInputHelper,
    selectInputLabel,
    selectInputStyles,
    selectItem,
    selectItemIndicator,
    selectLabel,
    selectScrollButton,
    selectSeparator,
    selectTrigger,
    selectViewport
} from './Select.css.ts';
