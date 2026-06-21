import React, { useCallback } from 'react';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import 'components/alphaPicker/style.scss';

interface AlphabetPickerProps {
    value?: string | null;
    onChange: (value: string | null | undefined) => void;
}

const LETTER_VALUES = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const AlphabetPicker: React.FC<AlphabetPickerProps> = ({
    value,
    onChange
}) => {
    const handleValue = useCallback(
        (
            event: React.MouseEvent<HTMLElement>,
            newValue: string | null | undefined
        ) => {
            onChange(newValue);
        },
        [onChange]
    );

    return (
        <Box
            className='alphaPicker-fixed-right'
            // eslint-disable-next-line react/jsx-no-bind
            sx={theme => ({
                position: 'fixed',
                top: '112px', // This is the height of the AppBar + Tabs, this should be dynamic
                bottom: 0,
                fontSize: '80%',
                display: 'flex',
                alignItems: 'center',
                // This should render under the main AppBar but above the ItemsView AppBar
                zIndex: theme.zIndex.appBar - 1
            })}
        >
            <ToggleButtonGroup
                orientation='vertical'
                value={value}
                exclusive
                color='primary'
                size='small'
                onChange={handleValue}
            >
                {LETTER_VALUES.map((l) => (
                    <ToggleButton
                        key={l}
                        value={l}
                        sx={{
                            borderWidth: 0,
                            paddingTop: 0.25,
                            paddingBottom: 0.25,
                            paddingLeft: 0.5,
                            paddingRight: 0.5
                        }}
                    >
                        {l}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
};

export default AlphabetPicker;
