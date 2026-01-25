import React from 'react';
import { Flex } from 'ui-primitives/Box';
import { FormControl, FormHelperText, FormLabel, Switch } from 'ui-primitives/FormControl';
import { Input, type InputProps } from 'ui-primitives/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui-primitives/Select';
import { vars } from 'styles/tokens.css';

export interface FormFieldProps {
    label?: string;
    helperText?: string;
    error?: string;
    children: React.ReactNode;
    required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({ label, helperText, error, children, required }) => (
    <FormControl>
        {label && (
            <FormLabel>
                {label}
                {required && (
                    <span style={{ color: vars.colors.error, marginLeft: '4px' }} aria-hidden='true'>*</span>
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

export interface JoyInputProps extends InputProps {
    label?: string;
    helperText?: string;
    error?: string;
}

export const JoyInput = React.forwardRef<HTMLInputElement, JoyInputProps>((props, ref) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <FormField label={label} helperText={helperText} error={error} required={rest.required}>
            <Input ref={ref} {...rest} />
        </FormField>
    );
});

export interface JoyTextareaProps extends Omit<InputProps, 'as' | 'type'> {
    label?: string;
    helperText?: string;
    error?: string;
}

export const JoyTextarea = React.forwardRef<HTMLTextAreaElement, JoyTextareaProps>((props, ref) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <FormField label={label} helperText={helperText} error={error} required={rest.required}>
            <Input ref={ref} as='textarea' rows={3} {...rest} />
        </FormField>
    );
});

export interface JoySwitchProps {
    label?: string;
    helperText?: string;
    error?: string;
    checked?: boolean;
    disabled?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const JoySwitch = (props: JoySwitchProps) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <Flex style={{ justifyContent: 'space-between', alignItems: 'center', gap: vars.spacing.sm }}>
            <Flex style={{ flexDirection: 'column', gap: vars.spacing.xs }}>
                {label && <FormLabel>{label}</FormLabel>}
                {helperText && <FormHelperText>{helperText}</FormHelperText>}
                {error && <FormHelperText style={{ color: vars.colors.error }}>{error}</FormHelperText>}
            </Flex>
            <Switch {...rest} />
        </Flex>
    );
};

export interface JoySelectProps {
    label?: string;
    helperText?: string;
    error?: string;
    options: { label: string; value: string }[];
    value?: string;
    onChange?: (event: unknown, value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}

export const JoySelect = (props: JoySelectProps) => {
    const { label, helperText, error, options, onChange, placeholder, value, disabled, required } = props;
    return (
        <FormField label={label} helperText={helperText} error={error} required={required}>
            <Select
                value={value}
                onValueChange={(newValue) => onChange?.(null, newValue)}
                disabled={disabled}
            >
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormField>
    );
};
