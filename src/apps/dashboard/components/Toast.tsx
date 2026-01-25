import React, { useCallback, useEffect } from 'react';
import { Cross1Icon } from '@radix-ui/react-icons';

import { Alert } from 'ui-primitives/Alert';
import { IconButton } from 'ui-primitives/IconButton';
import { vars } from 'styles/tokens.css';

interface ToastProps {
    open: boolean;
    message?: React.ReactNode;
    onClose?: () => void;
    autoHideDuration?: number;
}

const Toast = ({ open, message, onClose, autoHideDuration = 3300 }: ToastProps): React.ReactElement | null => {
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
            variant="info"
            action={
                <IconButton variant="plain" size="sm" color="neutral" onClick={onCloseClick}>
                    <Cross1Icon />
                </IconButton>
            }
            style={{
                position: 'fixed',
                bottom: vars.spacing.lg,
                left: vars.spacing.lg,
                zIndex: Number(vars.zIndex.toast),
                minWidth: 240
            }}
        >
            {message}
        </Alert>
    );
};

export default Toast;
