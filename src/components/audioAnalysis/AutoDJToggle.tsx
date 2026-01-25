import React from 'react';

import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

import { MagicWandIcon } from '@radix-ui/react-icons';
import * as styles from './AutoDJToggle.css';

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
        <div 
            style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: vars.spacing.xs, 
                opacity: disabled ? 0.5 : 1 
            }}
            title={
                enabled
                    ? 'Auto-DJ is active. Transitions will be auto-managed.'
                    : 'Enable Auto-DJ for smart track transitions.'
            }
        >
            <div className={styles.labelContainer}>
                <MagicWandIcon
                    style={{ color: enabled ? vars.colors.primary : vars.colors.textSecondary }}
                />
                <span className={styles.label} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
                    <Text size="sm">Auto-DJ</Text>
                </span>
            </div>
            <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onToggle(e.target.checked)}
                disabled={disabled}
                style={{
                    width: '20px',
                    height: '20px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
            />
        </div>
    );
};

export default AutoDJToggle;
