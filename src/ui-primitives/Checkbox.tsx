import React, { type ChangeEvent, type CSSProperties, type ReactNode, type ReactElement, useCallback } from 'react';
import { checkboxContainer, checkboxInput, checkboxLabel } from './Checkbox.css';

interface CheckboxProps {
    readonly checked?: boolean;
    readonly defaultChecked?: boolean;
    readonly onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    readonly onChangeChecked?: (checked: boolean) => void;
    readonly children?: ReactNode;
    readonly className?: string;
    readonly style?: CSSProperties;
    readonly disabled?: boolean;
    readonly id?: string;
    readonly name?: string;
    readonly value?: string;
}

export function Checkbox({
    checked,
    defaultChecked,
    onChange,
    onChangeChecked,
    children,
    className,
    style,
    disabled,
    id,
    name,
    value
}: CheckboxProps): ReactElement {
    const defaultId = React.useId();
    const inputId = id ?? defaultId;

    const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
        onChange?.(event);
        onChangeChecked?.(event.target.checked);
    }, [onChange, onChangeChecked]);

    return (
        <label className={`${checkboxContainer} ${className ?? ''}`} style={style} htmlFor={inputId}>
            <input
                type='checkbox'
                id={inputId}
                name={name}
                value={value}
                className={checkboxInput}
                defaultChecked={defaultChecked}
                checked={checked}
                onChange={handleChange}
                disabled={disabled}
            />
            <span className={checkboxLabel}>{children}</span>
        </label>
    );
}

export { checkboxContainer, checkboxInput, checkboxLabel } from './Checkbox.css';
