import Button from '@mui/joy/Button';
import Sheet from '@mui/joy/Sheet';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
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
  const { currentType, isEnabled, sensitivity, onTypeChange, onSensitivityChange, onToggleEnabled, className } = props;

  return (
    <Sheet
      variant="outlined"
      className={className}
      sx={[
        {
          backgroundColor: 'background.surface',
          borderRadius: 'md',
          p: 2,
          boxShadow: 'sm',
          borderColor: 'divider',
        },
        !isEnabled && { opacity: 0.6 },
      ]}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography level="title-md">Visualizer</Typography>
          <Button
            variant={isEnabled ? 'solid' : 'outlined'}
            color={isEnabled ? 'primary' : 'neutral'}
            size="sm"
            onClick={onToggleEnabled}
          >
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Button>
        </Stack>

        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
          Choose visualization style
        </Typography>

        <Stack spacing={1} direction="row" useFlexGap>
          <Button
            variant={currentType === 'waveform' ? 'solid' : 'outlined'}
            color={currentType === 'waveform' ? 'primary' : 'neutral'}
            onClick={() => onTypeChange('waveform')}
            sx={{ flex: 1 }}
          >
            Waveform
          </Button>
          <Button
            variant={currentType === 'frequency' ? 'solid' : 'outlined'}
            color={currentType === 'frequency' ? 'primary' : 'neutral'}
            onClick={() => onTypeChange('frequency')}
            sx={{ flex: 1 }}
          >
            Frequency
          </Button>
          <Button
            variant={currentType === 'butterchurn' ? 'solid' : 'outlined'}
            color={currentType === 'butterchurn' ? 'primary' : 'neutral'}
            onClick={() => onTypeChange('butterchurn')}
            sx={{ flex: 1 }}
          >
            Butterchurn
          </Button>
        </Stack>

        <Stack spacing={1} direction="row">
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
        </Stack>
      </Stack>
    </Sheet>
  );
}

export default VisualizerControls;
