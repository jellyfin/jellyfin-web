import { Button } from 'ui-primitives/Button';
import { Paper } from 'ui-primitives/Paper';
import { Box, Flex } from 'ui-primitives/Box';
import { Text, Heading } from 'ui-primitives/Text';
import React from 'react';

interface VisualizerControlsProps {
    currentType: string;
    isEnabled: boolean;
    sensitivity: number;
    onTypeChange: (type: string) => void;
    onSensitivityChange: (value: number) => void;
    onToggleEnabled: () => void;
    className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function VisualizerControls(props: VisualizerControlsProps) {
    const { currentType, isEnabled, sensitivity, onTypeChange, onSensitivityChange, onToggleEnabled, className } =
        props;

    return (
        <Paper
            variant="outlined"
            className={className}
            style={[
                {
                    backgroundColor: 'var(--joy-palette-background-surface)',
                    borderRadius: '8px',
                    padding: 16,
                    boxShadow: 'var(--joy-palette-shadow-sm)',
                    borderColor: 'var(--joy-palette-divider)'
                },
                !isEnabled && { opacity: 0.6 }
            ]}
        >
            <Box className={`${Flex} ${Flex.col}`} style={{ gap: 16 }}>
                <Box
                    className={`${Flex} ${Flex.row}`}
                    style={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                    <Heading.H4 style={{ margin: 0 }}>Visualizer</Heading.H4>
                    <Button
                        variant={isEnabled ? 'primary' : 'outlined'}
                        color={isEnabled ? 'primary' : 'neutral'}
                        size="sm"
                        onClick={onToggleEnabled}
                    >
                        {isEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                </Box>

                <Text size="sm" color="secondary">
                    Choose visualization style
                </Text>

                <Box className={`${Flex} ${Flex.row}`} style={{ gap: 8 }}>
                    <Button
                        variant={currentType === 'waveform' ? 'primary' : 'outlined'}
                        color={currentType === 'waveform' ? 'primary' : 'neutral'}
                        onClick={() => onTypeChange('waveform')}
                        style={{ flex: 1 }}
                    >
                        Waveform
                    </Button>
                    <Button
                        variant={currentType === 'frequency' ? 'primary' : 'outlined'}
                        color={currentType === 'frequency' ? 'primary' : 'neutral'}
                        onClick={() => onTypeChange('frequency')}
                        style={{ flex: 1 }}
                    >
                        Frequency
                    </Button>
                    <Button
                        variant={currentType === 'butterchurn' ? 'primary' : 'outlined'}
                        color={currentType === 'butterchurn' ? 'primary' : 'neutral'}
                        onClick={() => onTypeChange('butterchurn')}
                        style={{ flex: 1 }}
                    >
                        Butterchurn
                    </Button>
                </Box>

                <Box className={`${Flex} ${Flex.row}`} style={{ gap: 8 }}>
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => onSensitivityChange(Math.max(0, sensitivity - 0.1))}
                        disabled={!isEnabled || sensitivity <= 0}
                    >
                        -
                    </Button>
                    <Button
                        variant="outlined"
                        size="sm"
                        onClick={() => onSensitivityChange(Math.min(1, sensitivity + 0.1))}
                        disabled={!isEnabled || sensitivity >= 1}
                    >
                        +
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}

export default VisualizerControls;
