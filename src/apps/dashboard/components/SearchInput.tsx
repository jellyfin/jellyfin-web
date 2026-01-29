import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import React from 'react';

import { vars } from 'styles/tokens.css.ts';
import { Box, inputStyles } from 'ui-primitives';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    readonly label?: string;
}

export function SearchInput({ label, ...props }: SearchInputProps): React.ReactElement {
    return (
        <Box
            style={{
                display: 'flex',
                position: 'relative',
                borderRadius: vars.borderRadius.md,
                backgroundColor: `color-mix(in srgb, ${vars.colors.text} 15%, transparent)`,
                width: '100%'
            }}
        >
            <Box
                style={{
                    padding: `0 ${vars.spacing['5']}`,
                    height: '100%',
                    position: 'absolute',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <MagnifyingGlassIcon />
            </Box>
            <input
                className={inputStyles}
                placeholder={label}
                aria-label={label}
                style={{
                    padding: `${vars.spacing['4']} ${vars.spacing['4']} ${vars.spacing['4']} 0`,
                    paddingLeft: `calc(1em + ${vars.spacing['7']})`,
                    transition: `width ${vars.transitions.fast}`,
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none'
                }}
                {...props}
            />
        </Box>
    );
}

export default SearchInput;
