import React, { type FC } from 'react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

import { Box } from 'ui-primitives/Box';
import { inputStyles } from 'ui-primitives/Input';
import { vars } from 'styles/tokens.css';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const SearchInput: FC<SearchInputProps> = ({ label, ...props }) => {
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
                    padding: `0 ${vars.spacing.md}`,
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
                    padding: `${vars.spacing.sm} ${vars.spacing.sm} ${vars.spacing.sm} 0`,
                    paddingLeft: `calc(1em + ${vars.spacing.xl})`,
                    transition: `width ${vars.transitions.fast}`,
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: 'none'
                }}
                {...props}
            />
        </Box>
    );
};

export default SearchInput;
