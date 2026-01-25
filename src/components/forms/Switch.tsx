import React from 'react';
import { Flex } from 'ui-primitives/Box';
import { FormHelperText, FormLabel, Switch as UIPrimitiveSwitch } from 'ui-primitives/FormControl';
import { vars } from 'styles/tokens.css';

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
        <Flex style={{ justifyContent: 'space-between', alignItems: 'center', gap: vars.spacing.sm }}>
            <Flex style={{ flexDirection: 'column', gap: vars.spacing.xs }}>
                {label && <FormLabel>{label}</FormLabel>}
                {helperText && <FormHelperText>{helperText}</FormHelperText>}
                {error && <FormHelperText style={{ color: vars.colors.error }}>{error}</FormHelperText>}
            </Flex>
            <UIPrimitiveSwitch {...rest} />
        </Flex>
    );
};
