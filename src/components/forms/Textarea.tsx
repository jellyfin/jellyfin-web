import React from 'react';
import { Input as UIPrimitiveInput, type InputProps as InputPrimitiveProps } from 'ui-primitives';
import { FormField } from './FormField';

export interface TextareaProps extends Omit<InputPrimitiveProps, 'as' | 'type'> {
    label?: string;
    helperText?: string;
    error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <FormField label={label} helperText={helperText} error={error} required={rest.required}>
            <UIPrimitiveInput ref={ref} as="textarea" rows={3} {...rest} />
        </FormField>
    );
});

Textarea.displayName = 'Textarea';
