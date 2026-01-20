import React from 'react';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Switch from '@mui/joy/Switch';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Tooltip from '@mui/joy/Tooltip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface AutoDJToggleProps {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    disabled?: boolean;
}

export const AutoDJToggle: React.FC<AutoDJToggleProps> = ({
    enabled,
    onToggle,
    disabled = false,
}) => {
    return (
        <Tooltip
            title={
                enabled
                    ? 'Auto-DJ is active. Transitions will be auto-managed.'
                    : 'Enable Auto-DJ for smart track transitions.'
            }
        >
            <FormControl
                sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}
                disabled={disabled}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AutoAwesomeIcon
                        fontSize='small'
                        sx={{ color: enabled ? 'var(--joy-palette-primary-text)' : 'text.secondary' }}
                    />
                    <FormLabel sx={{ cursor: 'pointer' }}>
                        <Typography level='body-sm'>Auto-DJ</Typography>
                    </FormLabel>
                </Box>
                <Switch
                    checked={enabled}
                    onChange={(e) => onToggle(e.target.checked)}
                    color={enabled ? 'primary' : 'neutral'}
                />
            </FormControl>
        </Tooltip>
    );
};

export default AutoDJToggle;
