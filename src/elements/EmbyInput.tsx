import React from 'react';
import { JoyInput } from '../components/joy-ui/forms';
import type { InputProps } from '@mui/joy/Input';

export interface EmbyInputProps extends InputProps {
    label?: string;
    helperText?: string;
    error?: string;
}

const EmbyInput = React.forwardRef<HTMLInputElement, EmbyInputProps>((props, ref) => {
    return <JoyInput ref={ref} {...props} />;
});

EmbyInput.displayName = 'EmbyInput';

export default EmbyInput;
