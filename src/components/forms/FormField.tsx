import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import { FormControl, FormHelperText, FormLabel } from 'ui-primitives';

export interface FormFieldProps {
    label?: string;
    helperText?: string;
    error?: string;
    children: React.ReactNode;
    required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    helperText,
    error,
    children,
    required
}) => (
    <FormControl>
        {label && (
            <FormLabel>
                {label}
                {required && (
                    <span
                        style={{ color: vars.colors.error, marginLeft: '4px' }}
                        aria-hidden="true"
                    >
                        *
                    </span>
                )}
            </FormLabel>
        )}
        {children}
        {(error || helperText) && (
            <FormHelperText style={error ? { color: vars.colors.error } : undefined}>
                {error || helperText}
            </FormHelperText>
        )}
    </FormControl>
);
