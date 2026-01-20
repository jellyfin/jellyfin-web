import React from 'react';
import { JoyTextarea } from '../components/joy-ui/forms';
import type { TextareaProps } from '@mui/joy/Textarea';

export interface EmbyTextareaProps extends TextareaProps {
    label?: string;
    helperText?: string;
    error?: string;
}

const EmbyTextarea = React.forwardRef<HTMLTextAreaElement, EmbyTextareaProps>((props, ref) => {
    return <JoyTextarea ref={ref} {...props} />;
});

EmbyTextarea.displayName = 'EmbyTextarea';

export default EmbyTextarea;
