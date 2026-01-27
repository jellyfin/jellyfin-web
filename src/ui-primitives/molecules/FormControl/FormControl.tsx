import React, { useId, type ReactElement, type ReactNode, type CSSProperties } from 'react';
import { formGroup } from '../../atoms/Input';
import { formHelperText, formLabel, switchStyles, switchThumb } from './FormControl.css';

export { formHelperText, formLabel, switchStyles, switchThumb };

export interface SwitchProps {
    readonly checked?: boolean;
    readonly disabled?: boolean;
    readonly onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readonly className?: string;
    readonly id?: string;
    readonly 'aria-label'?: string;
    readonly label?: string;
}

export function Switch({
    checked = false,
    disabled = false,
    onChange,
    className,
    id,
    'aria-label': ariaLabel,
    label
}: SwitchProps): ReactElement {
    const inputId = useId();
    const resolvedId = id ?? inputId;
    return (
        <label
            htmlFor={resolvedId}
            style={{ display: 'inline-flex', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
            <input
                id={resolvedId}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                style={{ display: 'none' }}
                aria-label={ariaLabel ?? label ?? 'Toggle switch'}
            />
            <div
                className={`${switchStyles} ${className ?? ''}`}
                data-state={checked ? 'checked' : 'unchecked'}
                style={{ opacity: disabled ? 0.5 : 1 }}
            >
                <div className={switchThumb} data-state={checked ? 'checked' : 'unchecked'} />
            </div>
            {label !== undefined && <span style={{ marginLeft: 8 }}>{label}</span>}
        </label>
    );
}

interface FormControlProps {
    readonly children: ReactNode;
    readonly className?: string;
}

export function FormControl({ children, className }: FormControlProps): ReactElement {
    return <div className={`${formGroup} ${className ?? ''}`}>{children}</div>;
}

export function FormLabel({
    children,
    className,
    htmlFor,
    style
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly htmlFor?: string;
    readonly style?: CSSProperties;
}): ReactElement {
    if (htmlFor !== undefined && htmlFor !== '') {
        return (
            <label className={`${formLabel} ${className ?? ''}`} style={style} htmlFor={htmlFor}>
                {children}
            </label>
        );
    }
    return (
        <span className={`${formLabel} ${className ?? ''}`} style={style}>
            {children}
        </span>
    );
}

export function FormHelperText({
    children,
    className,
    style,
    id
}: {
    readonly children: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly id?: string;
}): ReactElement {
    return (
        <span id={id} className={`${formHelperText} ${className ?? ''}`} style={style}>
            {children}
        </span>
    );
}

interface FormControlLabelProps {
    readonly label: ReactNode;
    readonly control: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly htmlFor?: string;
}

export function FormControlLabel({ label, control, className, style, htmlFor }: FormControlLabelProps): ReactElement {
    const Component = htmlFor !== undefined && htmlFor !== '' ? 'label' : 'div';
    return (
        <Component
            className={className}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', ...style }}
            htmlFor={htmlFor}
        >
            {control}
            {typeof label === 'string' ? <span>{label}</span> : label}
        </Component>
    );
}
