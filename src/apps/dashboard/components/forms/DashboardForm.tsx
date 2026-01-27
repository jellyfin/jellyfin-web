import React from 'react';

import globalize from 'lib/globalize';
import { Alert } from 'ui-primitives/Alert';
import { Box, Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Card, CardBody } from 'ui-primitives/Card';
import { Checkbox } from 'ui-primitives/Checkbox';
import { Divider } from 'ui-primitives/Divider';
import { FormControl, FormHelperText, FormLabel, Switch } from 'ui-primitives/FormControl';
import { Input } from 'ui-primitives/Input';
import { SelectInput } from 'ui-primitives/Select';
import { Heading, Text } from 'ui-primitives/Text';

interface DashboardFormProps {
    onSubmit: (e: React.FormEvent) => Promise<void> | void;
    onCancel?: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function DashboardForm({
    onSubmit,
    onCancel,
    title,
    description,
    children
}: Readonly<DashboardFormProps>): React.ReactElement {
    return (
        <Box style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
            <Heading.H3 style={{ marginBottom: description != null ? '8px' : '24px' }}>
                {title}
            </Heading.H3>
            {description != null && (
                <Text color='secondary' size='sm' style={{ marginBottom: '24px' }}>
                    {description}
                </Text>
            )}

            <form onSubmit={onSubmit}>
                {children}

                <Divider style={{ margin: '24px 0' }} />

                <Flex style={{ gap: '16px', justifyContent: 'flex-end' }}>
                    {onCancel && (
                        <Button variant='ghost' onClick={onCancel}>
                            {globalize.translate('ButtonCancel')}
                        </Button>
                    )}
                    <Button variant='primary' type='submit'>
                        {globalize.translate('Save')}
                    </Button>
                </Flex>
            </form>
        </Box>
    );
}

interface FormTextFieldProps {
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    helperText?: string;
    fullWidth?: boolean;
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    error?: string;
}

export function FormTextField({
    label,
    type = 'text',
    placeholder: _placeholder,
    required,
    helperText,
    fullWidth = true,
    value,
    onChange,
    onBlur,
    error
}: Readonly<FormTextFieldProps>): React.ReactElement {
    return (
        <Box style={{ marginBottom: '16px', width: fullWidth ? '100%' : 'auto' }}>
            <FormControl>
                <FormLabel>
                    {label}
                    {required && <span style={{ color: 'var(--error)' }}> *</span>}
                </FormLabel>
                <Input
                    type={type}
                    value={value ?? ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    onBlur={onBlur}
                    placeholder={_placeholder}
                    style={{ width: '100%' }}
                />
                {(helperText != null || error != null) && (
                    <FormHelperText>{error ?? helperText}</FormHelperText>
                )}
            </FormControl>
        </Box>
    );
}

interface FormSelectFieldProps {
    label: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
    helperText?: string;
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
}

export function FormSelectField({
    label,
    options,
    placeholder,
    required,
    helperText,
    value,
    onChange,
    error
}: Readonly<FormSelectFieldProps>): React.ReactElement {
    return (
        <Box style={{ marginBottom: '16px' }}>
            <FormControl>
                <FormLabel>
                    {label}
                    {required && <span style={{ color: 'var(--error)' }}> *</span>}
                </FormLabel>
                <SelectInput value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} style={{ width: '100%' }}>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </SelectInput>
                {(helperText != null || error != null) && (
                    <FormHelperText>{error ?? helperText}</FormHelperText>
                )}
            </FormControl>
        </Box>
    );
}

interface FormCheckboxFieldProps {
    label: string;
    description?: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
}

export function FormCheckboxField({
    label,
    description,
    checked,
    onChange
}: Readonly<FormCheckboxFieldProps>): React.ReactElement {
    return (
        <Box style={{ marginBottom: '16px' }}>
            <FormControl>
                <Flex style={{ alignItems: 'center', gap: '12px' }}>
                    <Checkbox checked={checked ?? false} onChangeChecked={onChange} />
                    <FormLabel style={{ marginBottom: 0 }}>{label}</FormLabel>
                </Flex>
                {description != null && (
                    <FormHelperText style={{ marginLeft: '36px' }}>{description}</FormHelperText>
                )}
            </FormControl>
        </Box>
    );
}

interface FormSwitchFieldProps {
    label: string;
    description?: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
}

export function FormSwitchField({
    label,
    description,
    checked,
    onChange
}: Readonly<FormSwitchFieldProps>): React.ReactElement {
    return (
        <Box style={{ marginBottom: '16px' }}>
            <FormControl>
                <Flex style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <FormLabel style={{ marginBottom: 0 }}>{label}</FormLabel>
                    <Switch checked={checked ?? false} onChange={(e) => onChange?.(e.target.checked)} />
                </Flex>
                {description != null && <FormHelperText>{description}</FormHelperText>}
            </FormControl>
        </Box>
    );
}

interface FormSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function FormSection({
    title,
    description,
    children
}: Readonly<FormSectionProps>): React.ReactElement {
    return (
        <Box style={{ marginBottom: '32px' }}>
            <Heading.H4 style={{ marginBottom: description != null ? '8px' : '16px' }}>
                {title}
            </Heading.H4>
            {description != null && (
                <Text color='secondary' size='sm' style={{ marginBottom: '16px' }}>
                    {description}
                </Text>
            )}
            {children}
        </Box>
    );
}

interface FormCardProps {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}

export function FormCard({ title, children, action }: Readonly<FormCardProps>): React.ReactElement {
    return (
        <Card style={{ marginBottom: '24px' }}>
            <CardBody>
                <Flex
                    style={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}
                >
                    <Text weight='bold'>{title}</Text>
                    {action}
                </Flex>
                {children}
            </CardBody>
        </Card>
    );
}

interface FormAlertProps {
    variant: 'info' | 'success' | 'warning' | 'error';
    children: React.ReactNode;
}

export function FormAlert({ variant, children }: Readonly<FormAlertProps>): React.ReactElement {
    return (
        <Alert variant={variant} style={{ marginBottom: '24px' }}>
            {children}
        </Alert>
    );
}

interface FormRowProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
}

export function FormRow({ children, style }: Readonly<FormRowProps>): React.ReactElement {
    return <Flex style={{ gap: '16px', ...style }}>{children}</Flex>;
}

interface FormColumnProps {
    children: React.ReactNode;
    flex?: number;
    style?: React.CSSProperties;
}

export function FormColumn({
    children,
    flex = 1,
    style
}: Readonly<FormColumnProps>): React.ReactElement {
    return <Box style={{ flex, ...style }}>{children}</Box>;
}
