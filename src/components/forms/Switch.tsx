import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Flex, FormHelperText, FormLabel, Switch as UIPrimitiveSwitch } from 'ui-primitives';

export interface SwitchProps {
    label?: string;
    helperText?: string;
    error?: string;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Switch = (props: SwitchProps) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <Flex
            style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: vars.spacing['4']
            }}
        >
            <Flex style={{ flexDirection: 'column', gap: vars.spacing['2'] }}>
                {label && <FormLabel>{label}</FormLabel>}
                {helperText && <FormHelperText>{helperText}</FormHelperText>}
                {error && (
                    <FormHelperText style={{ color: vars.colors.error }}>{error}</FormHelperText>
                )}
            </Flex>
            <UIPrimitiveSwitch {...rest} />
        </Flex>
    );
};
