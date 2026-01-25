import React from 'react';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import { MagicWandIcon } from '@radix-ui/react-icons';
import { useAutoDJStore } from 'store/autoDJStore';
import { vars } from 'styles/tokens.css';

interface AutoDJToggleProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const AutoDJToggle: React.FC<AutoDJToggleProps> = ({
    size = 'sm',
    className
}) => {
    const { enabled, setEnabled } = useAutoDJStore();

    return (
        <Tooltip title={enabled ? 'Disable Auto-DJ' : 'Enable Auto-DJ'}>
            <IconButton
                className={className}
                size={size}
                variant='plain'
                onClick={() => setEnabled(!enabled)}
                style={{
                    color: enabled ? vars.colors.primary : 'inherit',
                }}
            >
                <MagicWandIcon />
            </IconButton>
        </Tooltip>
    );
};

export default AutoDJToggle;
