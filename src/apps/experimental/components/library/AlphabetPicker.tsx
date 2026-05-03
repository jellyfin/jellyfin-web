import React, { useCallback } from 'react';
import classNames from 'classnames';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { LibraryViewSettings } from 'types/library';
import 'components/alphaPicker/style.scss';

interface AlphabetPickerProps {
    className?: string;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const LETTER_VALUES = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const AlphabetPicker: React.FC<AlphabetPickerProps> = ({
    className,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const handleValue = useCallback(
        (
            event: React.MouseEvent<HTMLElement>,
            newValue: string | null | undefined
        ) => {
            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Alphabet: newValue
            }));
        },
        [setLibraryViewSettings]
    );

    const containerClassName = classNames(
        'alphaPicker',
        className,
        'alphaPicker-fixed-right'
    );

    const btnClassName = classNames(
        'paper-icon-button-light',
        'alphaPickerButton'
    );

    return (
        <Box
            className={containerClassName}
            // eslint-disable-next-line react/jsx-no-bind
            sx={theme => ({
                position: 'fixed',
                bottom: '1.5em',
                fontSize: {
                    xs: '80%',
                    lg: '88%'
                },
                // This should render under the main AppBar but above the ItemsView AppBar
                zIndex: theme.zIndex.appBar - 1
            })}
        >
            <ToggleButtonGroup
                orientation='vertical'
                value={libraryViewSettings.Alphabet}
                exclusive
                color='primary'
                size='small'
                onChange={handleValue}
            >
                {LETTER_VALUES.map((l) => (
                    <ToggleButton
                        key={l}
                        value={l}
                        className={btnClassName}
                    >
                        {l}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </Box>
    );
};

export default AlphabetPicker;
