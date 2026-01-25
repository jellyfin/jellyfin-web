import {
    Select as UIPrimitiveSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from 'ui-primitives/Select';
import { FormField } from './FormField';

export interface SelectProps {
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

export const Select = (props: SelectProps) => {
    const { label, helperText, error, options, onChange, placeholder, value, disabled, required } = props;
    return (
        <FormField label={label} helperText={helperText} error={error} required={required}>
            <UIPrimitiveSelect value={value} onValueChange={newValue => onChange?.(null, newValue)} disabled={disabled}>
                <SelectTrigger>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </UIPrimitiveSelect>
        </FormField>
    );
};
