import React, { type ReactNode } from 'react';
import { useToastStore } from '../../../store/toastStore';
import { Toast, type ToastPosition, toastViewport, toastViewportPosition } from './Toast';

// Re-export for compatibility
export { useToastStore as useToast };

export const ToastProvider: React.FC<{ children: ReactNode; position?: ToastPosition }> = ({
    children,
    position = 'top-right'
}) => {
    const toasts = useToastStore((state) => state.toasts);
    const dismiss = useToastStore((state) => state.dismiss);

    return (
        <>
            {children}
            <div
                className={`${toastViewport} ${toastViewportPosition[position]}`}
                data-state={toasts.length > 0 ? 'open' : 'closed'}
            >
                {toasts.map((t) => (
                    <Toast
                        key={t.id}
                        id={t.id}
                        title={t.title}
                        description={t.description}
                        variant={t.variant}
                        duration={t.duration}
                        action={t.action}
                        onClose={dismiss}
                    />
                ))}
            </div>
        </>
    );
};
