import React, { type ReactNode, type ReactElement, useCallback } from 'react';
import {
    toastVariantStyles,
    toastContainer,
    toastContent,
    toastTitle,
    toastDescription,
    toastAction,
    toastClose,
    toastProgressBar,
    toastIndicator,
    toastIcon,
    toastViewport,
    toastViewportPosition
} from './Toast.css';

export {
    toastVariantStyles,
    toastContainer,
    toastContent,
    toastTitle,
    toastDescription,
    toastAction,
    toastClose,
    toastProgressBar,
    toastIndicator,
    toastIcon,
    toastViewport,
    toastViewportPosition
};

export type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface ToastProps {
    readonly id: string;
    readonly title: string;
    readonly description?: string;
    readonly variant?: ToastVariant;
    readonly duration?: number;
    readonly action?: {
        readonly label: string;
        readonly onClick: () => void;
    };
    readonly onClose: (id: string) => void;
    readonly showProgress?: boolean;
    readonly className?: string;
    readonly children?: ReactNode;
    readonly onMouseEnter?: () => void;
    readonly onMouseLeave?: () => void;
}

export function Toast({
    id,
    title,
    description,
    variant = 'default',
    duration,
    action,
    onClose,
    showProgress = true,
    className,
    onMouseEnter,
    onMouseLeave
}: ToastProps): ReactElement {
    const handleActionClick = useCallback(
        (e: React.MouseEvent): void => {
            e.stopPropagation();
            action?.onClick();
        },
        [action]
    );

    const handleCloseClick = useCallback(
        (e: React.MouseEvent): void => {
            e.stopPropagation();
            onClose(id);
        },
        [id, onClose]
    );

    return (
        <div
            className={`${toastContainer} ${toastVariantStyles[variant]} ${className ?? ''}`}
            data-toast-id={id}
            role="alert"
            aria-live="polite"
            aria-atomic="true"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={
                {
                    '--toast-duration': `${duration ?? 5000}ms`
                } as React.CSSProperties
            }
        >
            <div className={toastContent}>
                <div className={toastTitle}>{title}</div>
                {description !== undefined && description !== '' && (
                    <div className={toastDescription}>{description}</div>
                )}
                {action !== undefined && (
                    <button type="button" className={toastAction} onClick={handleActionClick}>
                        {action.label}
                    </button>
                )}
            </div>
            <button type="button" className={toastClose} onClick={handleCloseClick} aria-label="Close">
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                >
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
            {showProgress && <div className={toastProgressBar} data-state="running" />}
        </div>
    );
}

export function ToastTitle({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <div className={`${toastTitle} ${className ?? ''}`}>{children}</div>;
}

export function ToastDescription({
    children,
    className
}: {
    readonly children: ReactNode;
    readonly className?: string;
}): ReactElement {
    return <div className={`${toastDescription} ${className ?? ''}`}>{children}</div>;
}

export function ToastAction({
    children,
    onClick
}: {
    readonly children: ReactNode;
    readonly onClick: () => void;
}): ReactElement {
    return (
        <button type="button" className={toastAction} onClick={onClick}>
            {children}
        </button>
    );
}

export function ToastClose({ onClick }: { readonly onClick: () => void }): ReactElement {
    return (
        <button type="button" className={toastClose} onClick={onClick} aria-label="Close">
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
            >
                <path d="M18 6L6 18M6 6l12 12" />
            </svg>
        </button>
    );
}
