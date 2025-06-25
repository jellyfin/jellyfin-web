import { useCallback, Dispatch, SetStateAction, MouseEvent } from 'react';
import classNames from 'classnames';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { LibraryViewSettings } from 'types/library';
import 'components/alphaPicker/style.scss';

interface AlphabetPickerProps {
    className?: string;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: Dispatch<
        SetStateAction<LibraryViewSettings>
    >;
}

export default function AlphabetPicker({ className, libraryViewSettings, setLibraryViewSettings }: AlphabetPickerProps) {
    const handleValue = useCallback(( _event: MouseEvent<HTMLElement>, newValue ?: string | null | undefined ) => {
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

    const letters = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    return (
        <Box
            className={containerClassName}
            sx={{
                position: 'fixed',
                bottom: '1.5em',
                fontSize: {
                    xs: '80%',
                    lg: '88%'
                }
            }}
        >
            <ToggleButtonGroup
                orientation='vertical'
                value={libraryViewSettings.Alphabet}
                exclusive
                color='primary'
                size='small'
                onChange={handleValue}
            >
                {letters.map((l) => (
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
