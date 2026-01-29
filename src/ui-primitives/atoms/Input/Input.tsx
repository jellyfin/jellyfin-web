import React, {
    type CSSProperties,
    forwardRef,
    type InputHTMLAttributes,
    type ReactElement,
    type ReactNode
} from 'react';
import {
    formGroup,
    inputContainer,
    inputHelperText,
    inputLabel,
    inputStyles,
    textareaStyles
} from './Input.css.ts';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    readonly label?: string;
    readonly helperText?: ReactNode;
    readonly containerClass?: string;
    readonly as?: 'input' | 'textarea';
    readonly style?: CSSProperties;
    readonly endDecorator?: ReactNode;
    readonly rows?: number;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
    (
        {
            label,
            helperText,
            containerClass,
            id,
            className,
            as: Component = 'input',
            style,
            endDecorator,
            ...props
        },
        ref
    ): ReactElement => {
        const isTextarea = Component === 'textarea';
        const inputClass = isTextarea ? textareaStyles : inputStyles;

        return (
            <div className={containerClass ?? inputContainer}>
                {label !== undefined && label !== '' && (
                    <label htmlFor={id} className={inputLabel}>
                        {label}
                    </label>
                )}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isTextarea ? (
                        <textarea
                            id={id}
                            ref={ref as React.Ref<HTMLTextAreaElement>}
                            className={`${inputClass} ${className ?? ''}`}
                            style={style}
                            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                        />
                    ) : (
                        <input
                            id={id}
                            ref={ref as React.Ref<HTMLInputElement>}
                            className={`${inputClass} ${className ?? ''}`}
                            style={style}
                            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                        />
                    )}
                    {endDecorator}
                </div>
                {helperText !== undefined && <span className={inputHelperText}>{helperText}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;

export { inputStyles, textareaStyles, inputLabel, inputContainer, inputHelperText, formGroup };
