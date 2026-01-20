import React from 'react';
import Button from '@mui/joy/Button';
import type { ButtonProps } from '@mui/joy/Button';
import { appRouter } from '../components/router/appRouter';
import { safeAppHost } from '../components/apphost';
import { AppFeature } from '../constants/appFeature';
import shell from '../scripts/shell';

export interface EmbyButtonProps extends ButtonProps {
    href?: string;
    target?: string;
    autoHide?: boolean;
}

const EmbyButton = React.forwardRef<HTMLButtonElement, EmbyButtonProps>(({
    href,
    target,
    autoHide,
    children,
    onClick,
    ...props
}, ref) => {
    
    // Auto-hide logic for external links
    if (autoHide && !safeAppHost.supports(AppFeature.ExternalLinks)) {
        return null;
    }

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement & HTMLButtonElement>) => {
        if (onClick) {
            onClick(e);
        }

        if (href && href !== '#') {
            if (target) {
                if (!safeAppHost.supports(AppFeature.TargetBlank)) {
                    e.preventDefault();
                    shell.openUrl(href);
                }
            } else {
                e.preventDefault();
                appRouter.show(href);
            }
        }
    };

    return (
        <Button
            ref={ref}
            onClick={handleClick}
            {...props}
        >
            {children}
        </Button>
    );
});

EmbyButton.displayName = 'EmbyButton';

export default EmbyButton;
