import {
    Root,
    Trigger,
    Portal,
    Overlay,
    Content,
    Title,
    Description,
    Close,
    type DialogCloseProps as RadixDialogCloseProps
} from '@radix-ui/react-dialog';
import React, { type ReactNode, type ReactElement, type CSSProperties } from 'react';
import {
    DialogOverlay as dialogOverlayStyle,
    DialogContent as dialogContentStyle,
    dialogTitleStyles,
    DialogDescription as dialogDescriptionStyle,
    DialogClose as dialogCloseStyle
} from './Dialog.css';

interface DialogProps {
    readonly open?: boolean;
    readonly onOpenChange?: (open: boolean) => void;
    readonly children: ReactNode;
}

export function Dialog({
    open,
    onOpenChange,
    children
}: DialogProps): ReactElement {
    return (
        <Root open={open} onOpenChange={onOpenChange}>
            {children}
        </Root>
    );
}

export function DialogTrigger({ children }: { readonly children: ReactNode }): ReactElement {
    return <Trigger asChild>{children}</Trigger>;
}

export function DialogPortal({ children }: { readonly children: ReactNode }): ReactElement {
    return <Portal>{children}</Portal>;
}

export function DialogOverlayComponent(): ReactElement {
    return <Overlay className={dialogOverlayStyle} />;
}

export { DialogOverlayComponent as DialogOverlay };

interface DialogContentProps {
    readonly children: ReactNode;
    readonly title?: string;
    readonly description?: string;
    readonly style?: CSSProperties;
}

export function DialogContentComponent({
    children,
    title,
    description,
    style: customStyle
}: DialogContentProps): ReactElement {
    return (
        <Content className={dialogContentStyle} style={customStyle}>
            {title !== undefined && title !== '' && <Title className={dialogTitleStyles}>{title}</Title>}
            {description !== undefined && description !== '' && (
                <Description className={dialogDescriptionStyle}>
                    {description}
                </Description>
            )}
            {children}
            <Close asChild>
                <button type='button' className={dialogCloseStyle} aria-label='Close'>
                    ✕
                </button>
            </Close>
        </Content>
    );
}

export { DialogContentComponent as DialogContent };

interface DialogDescriptionProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}

export function DialogDescription({
    children,
    className,
    style
}: DialogDescriptionProps): ReactElement {
    return (
        <Description className={`${dialogDescriptionStyle} ${className ?? ''}`} style={style}>
            {children}
        </Description>
    );
}

export function DialogClose(props: Readonly<RadixDialogCloseProps>): ReactElement {
    const { children, className, ...rest } = props;
    const combinedClassName = [dialogCloseStyle, className].filter(Boolean).join(' ');
    return (
        <Close className={combinedClassName} {...rest}>
            {children}
        </Close>
    );
}

export const DialogOverlayClass = dialogOverlayStyle;
export const DialogContentClass = dialogContentStyle;
export const DialogDescriptionClass = dialogDescriptionStyle;
export const DialogCloseClass = dialogCloseStyle;

export function DialogCloseButton({ onClick }: { readonly onClick?: () => void }): ReactElement {
    return (
        <Close asChild>
            <button type='button' className={dialogCloseStyle} onClick={onClick} aria-label='Close'>
                ✕
            </button>
        </Close>
    );
}

interface DialogTitleProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
}

export function DialogTitleComponent({
    children,
    className,
    style
}: DialogTitleProps): ReactElement {
    return (
        <Title className={`${dialogTitleStyles} ${className ?? ''}`} style={style}>
            {children}
        </Title>
    );
}

export { DialogTitleComponent as DialogTitle };
