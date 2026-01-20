import React from 'react';
import Checkbox from '@mui/joy/Checkbox';
import type { CheckboxProps } from '@mui/joy/Checkbox';

export interface EmbyCheckboxProps extends CheckboxProps {
    label?: string;
}

const EmbyCheckbox = React.forwardRef<HTMLInputElement, EmbyCheckboxProps>(({ label, ...props }, ref) => {
    return (
        <Checkbox
            ref={ref}
            label={label}
            {...props}
        />
    );
});

EmbyCheckbox.displayName = 'EmbyCheckbox';

export default EmbyCheckbox;
