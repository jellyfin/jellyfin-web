import { Cross1Icon } from '@radix-ui/react-icons';
import React, { useCallback, useEffect } from 'react';

import { vars } from 'styles/tokens.css';
import { Alert } from 'ui-primitives/Alert';
import { IconButton } from 'ui-primitives/IconButton';

interface ToastProps {
    readonly open: boolean;
    readonly message?: React.ReactNode;
    readonly onClose?: () => void;
    readonly autoHideDuration?: number;
}

export function Toast({
    open,
    message,
    onClose,
    autoHideDuration = 3300
}: ToastProps): React.ReactElement | null {
    const onCloseClick = useCallback(() => {
        onClose?.();
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const timeout = setTimeout(() => {
            onClose?.();
        }, autoHideDuration);
        return () => clearTimeout(timeout);
    }, [open, autoHideDuration, onClose]);

    if (!open) {
        return null;
    }

    return (
        <Alert
            variant='info'
            action={
                <IconButton variant='plain' size='sm' color='neutral' onClick={onCloseClick}>
                    <Cross1Icon />
                </IconButton>
            }
            style={{
                position: 'fixed',
                bottom: vars.spacing['6'],
                left: vars.spacing['6'],
                zIndex: Number(vars.zIndex.toast),
                minWidth: 240
            }}
        >
            {message}
        </Alert>
    );
}

export default Toast;
