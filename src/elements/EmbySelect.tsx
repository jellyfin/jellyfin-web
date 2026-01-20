import React from 'react';
import { JoySelect } from '../components/joy-ui/forms';
import type { SelectProps } from '@mui/joy/Select';

export interface EmbySelectProps extends SelectProps<any> {
    label?: string;
    helperText?: string;
    error?: string;
    options: { label: string; value: any }[];
}

const EmbySelect: React.FC<EmbySelectProps> = (props) => {
    return <JoySelect {...props} />;
};

export default EmbySelect;
