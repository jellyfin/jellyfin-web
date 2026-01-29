import React from 'react';
import { type InputProps as InputPrimitiveProps, Input as UIPrimitiveInput } from 'ui-primitives';
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
