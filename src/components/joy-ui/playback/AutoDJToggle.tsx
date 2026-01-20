import React from 'react';
import Tooltip from '@mui/joy/Tooltip';
import IconButton from '@mui/joy/IconButton';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAutoDJStore } from 'store/autoDJStore';

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
        <Tooltip title={enabled ? 'Disable Auto-DJ' : 'Enable Auto-DJ'} arrow>
            <IconButton
                className={className}
                size={size}
                variant='plain'
                onClick={() => setEnabled(!enabled)}
                sx={{
                    color: enabled ? 'primary.main' : 'inherit',
                    '&:hover': {
                        color: enabled ? 'primary.dark' : 'text.primary',
                    }
                }}
            >
                <AutoAwesomeIcon />
            </IconButton>
        </Tooltip>
    );
};

export default AutoDJToggle;
