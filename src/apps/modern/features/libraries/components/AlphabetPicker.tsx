import React, { useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
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
                top: {
                    xs: '144px', // Extra small screens the AppBar wraps to 3 rows (128px) and we align top with 16px of spacing
                    sm: '96px' // Small screens the AppBar is 2 rows (96px) and we align center (no extra spacing)
                },
                bottom: 0,
                fontSize: '80%',
                display: 'flex',
                alignItems: {
                    xs: 'flex-start',
                    sm: 'center'
                },
                // This should render under the main AppBar if overlapping
                zIndex: theme.zIndex.appBar - 1
            })}
        >
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 1,
                    overflow: 'hidden'
                }}
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
                                paddingTop: {
                                    xs: 0,
                                    md: 0.25
                                },
                                paddingBottom: {
                                    xs: 0,
                                    md: 0.25
                                },
                                paddingLeft: 0.5,
                                paddingRight: 0.5
                            }}
                        >
                            {l}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Paper>
        </Box>
    );
};

export default AlphabetPicker;
