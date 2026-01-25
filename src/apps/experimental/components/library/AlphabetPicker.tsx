import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Box } from 'ui-primitives/Box';
import { ToggleGroup, ToggleGroupItem } from 'ui-primitives/Toggle';
import { vars } from 'styles/tokens.css';

import { type LibraryViewSettings } from 'types/library';
import 'components/alphaPicker/style.css.ts';

interface AlphabetPickerProps {
    className?: string;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const AlphabetPicker: React.FC<AlphabetPickerProps> = ({ className, libraryViewSettings, setLibraryViewSettings }) => {
    const handleValue = useCallback(
        (event: React.MouseEvent<HTMLElement>, newValue: string | null | undefined) => {
            setLibraryViewSettings(prevState => ({
                ...prevState,
                StartIndex: 0,
                Alphabet: newValue
            }));
        },
        [setLibraryViewSettings]
    );

    const containerClassName = classNames('alphaPicker', className, 'alphaPicker-fixed-right');

    const btnClassName = classNames('paper-icon-button-light', 'alphaPickerButton');

    const letters = [
        '#',
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z'
    ];

    return (
        <Box
            className={containerClassName}
            style={{
                position: 'fixed',
                bottom: '1.5em',
                fontSize: vars.typography.fontSizeXs
            }}
        >
            <ToggleGroup
                type="single"
                value={libraryViewSettings.Alphabet ?? ''}
                onValueChange={value => {
                    handleValue({} as React.MouseEvent<HTMLElement>, value || null);
                }}
                className="alphaPickerButtonGroup"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: vars.spacing.xs,
                    backgroundColor: 'transparent',
                    borderRadius: vars.borderRadius.md
                }}
            >
                {letters.map(l => (
                    <ToggleGroupItem key={l} value={l} className={btnClassName}>
                        {l}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </Box>
    );
};

export default AlphabetPicker;
