import { MagicWandIcon } from '@radix-ui/react-icons';
import React from 'react';
import { useAutoDJStore } from 'store/autoDJStore';
import { vars } from 'styles/tokens.css.ts';
import { IconButton, Tooltip } from 'ui-primitives';

interface AutoDJToggleProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const AutoDJToggle: React.FC<AutoDJToggleProps> = ({ size = 'sm', className }) => {
    const { enabled, setEnabled } = useAutoDJStore();

    return (
        <Tooltip title={enabled ? 'Disable Auto-DJ' : 'Enable Auto-DJ'}>
            <IconButton
                className={className}
                size={size}
                variant="plain"
                onClick={() => setEnabled(!enabled)}
                style={{
                    color: enabled ? vars.colors.primary : 'inherit'
                }}
            >
                <MagicWandIcon />
            </IconButton>
        </Tooltip>
    );
};

export default AutoDJToggle;
