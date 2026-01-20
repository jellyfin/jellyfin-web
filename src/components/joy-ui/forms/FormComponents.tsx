import React from 'react';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import FormHelperText from '@mui/joy/FormHelperText';
import Input from '@mui/joy/Input';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Checkbox from '@mui/joy/Checkbox';
import Switch from '@mui/joy/Switch';
import Textarea from '@mui/joy/Textarea';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';

export interface FormFieldProps {
    label?: string;
    helperText?: string;
    error?: string;
    children: React.ReactNode;
    required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({ label, helperText, error, children, required }) => (
    <FormControl error={!!error} required={required}>
        {label && <FormLabel>{label}</FormLabel>}
        {children}
        {(error || helperText) && (
            <FormHelperText sx={{ fontSize: 'xs' }}>
                {error || helperText}
            </FormHelperText>
        )}
    </FormControl>
);

export const JoyInput = React.forwardRef<HTMLInputElement, any>((props, ref) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <FormField label={label} helperText={helperText} error={error}>
            <Input ref={ref} {...rest} />
        </FormField>
    );
});

export const JoyTextarea = React.forwardRef<HTMLTextAreaElement, any>((props, ref) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <FormField label={label} helperText={helperText} error={error}>
            <Textarea ref={ref} minRows={3} {...rest} />
        </FormField>
    );
});

export const JoySwitch = (props: any) => {
    const { label, helperText, error, ...rest } = props;
    return (
        <FormControl orientation="horizontal" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack>
                {label && <FormLabel>{label}</FormLabel>}
                {helperText && <FormHelperText sx={{ fontSize: 'xs' }}>{helperText}</FormHelperText>}
            </Stack>
            <Switch {...rest} />
        </FormControl>
    );
};

export const JoySelect = (props: any) => {
    const { label, helperText, error, options, ...rest } = props;
    return (
        <FormField label={label} helperText={helperText} error={error}>
            <Select {...rest}>
                {options.map((opt: any) => (
                    <Option key={opt.value} value={opt.value}>
                        {opt.label}
                    </Option>
                ))}
            </Select>
        </FormField>
    );
};
