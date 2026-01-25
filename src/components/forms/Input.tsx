import React from 'react';
import { Input as UIPrimitiveInput, type InputProps as InputPrimitiveProps } from 'ui-primitives/Input';
import { FormField } from './FormField';

export interface InputProps extends InputPrimitiveProps {
    label?: string;
    helperText?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <FormField label={label} helperText={helperText} error={error} required={rest.required}>
            <UIPrimitiveInput ref={ref} {...rest} />
        </FormField>
    );
});

Input.displayName = 'Input';
