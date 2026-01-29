import globalize from 'lib/globalize';

import React, { useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Alert,
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Checkbox,
    Divider,
    Flex,
    FlexCol,
    FormControl,
    FormLabel,
    Heading,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    Text
} from 'ui-primitives';

interface SettingsSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
    return (
        <Box style={{ marginBottom: vars.spacing['6'] }}>
            <Heading.H4 style={{ marginBottom: description ? '8px' : '16px' }}>{title}</Heading.H4>
            {description && (
                <Text color="secondary" size="sm" style={{ marginBottom: vars.spacing['4'] }}>
                    {description}
                </Text>
            )}
            {children}
        </Box>
    );
}

interface FormSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    description?: string;
}

export function FormSelect({ label, value, onChange, options, description }: FormSelectProps) {
    return (
        <Box style={{ marginBottom: vars.spacing['4'] }}>
            <FormControl>
                <FormLabel>{label}</FormLabel>
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger>
                        <SelectValue
                            placeholder={options.find((o) => o.value === value)?.label || ''}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormControl>
            {description && (
                <Text size="sm" color="secondary" style={{ marginTop: vars.spacing['1'] }}>
                    {description}
                </Text>
            )}
        </Box>
    );
}

interface FormCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
}

export function FormCheckbox({ label, checked, onChange, description }: FormCheckboxProps) {
    return (
        <Box style={{ marginBottom: vars.spacing['4'] }}>
            <FormControl>
                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                    <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
                    <FormLabel style={{ marginBottom: 0 }}>{label}</FormLabel>
                </Flex>
            </FormControl>
            {description && (
                <Text
                    size="sm"
                    color="secondary"
                    style={{ marginTop: vars.spacing['1'], marginLeft: '36px' }}
                >
                    {description}
                </Text>
            )}
        </Box>
    );
}

interface ModernSettingsFormProps {
    onSave: () => void;
    onCancel: () => void;
    isSaving?: boolean;
    children: React.ReactNode;
}

export function ModernSettingsForm({
    onSave,
    onCancel,
    isSaving,
    children
}: ModernSettingsFormProps) {
    return (
        <Box style={{ maxWidth: '800px', margin: '0 auto', padding: vars.spacing['5'] }}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSave();
                }}
            >
                {children}

                <Divider style={{ margin: '32px 0' }} />

                <Flex style={{ gap: vars.spacing['4'], justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
                        {globalize.translate('ButtonCancel')}
                    </Button>
                    <Button variant="primary" type="submit" loading={isSaving}>
                        {globalize.translate('Save')}
                    </Button>
                </Flex>
            </form>
        </Box>
    );
}

interface ToggleSectionProps {
    title: string;
    checked: boolean;
    onToggle: (checked: boolean) => void;
    children: React.ReactNode;
}

export function ToggleSection({ title, checked, onToggle, children }: ToggleSectionProps) {
    return (
        <Box style={{ marginBottom: vars.spacing['5'] }}>
            <Flex
                style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: vars.spacing['4']
                }}
            >
                <Text weight="medium">{title}</Text>
                <Switch checked={checked} onChange={(e) => onToggle(e.target.checked)} />
            </Flex>
            {checked && (
                <Box style={{ paddingLeft: '16px', borderLeft: `2px solid var(--divider)` }}>
                    {children}
                </Box>
            )}
        </Box>
    );
}

interface SettingsCardProps {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}

export function SettingsCard({ title, children, action }: SettingsCardProps) {
    return (
        <Card style={{ marginBottom: vars.spacing['5'] }}>
            <CardHeader>
                <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text weight="bold">{title}</Text>
                    {action}
                </Flex>
            </CardHeader>
            <CardBody>{children}</CardBody>
        </Card>
    );
}

interface SettingsAlertProps {
    variant: 'info' | 'success' | 'warning' | 'error';
    children: React.ReactNode;
}

export function SettingsAlert({ variant, children }: SettingsAlertProps) {
    return (
        <Alert variant={variant} style={{ marginBottom: vars.spacing['5'] }}>
            {children}
        </Alert>
    );
}
