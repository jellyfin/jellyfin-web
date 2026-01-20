import React from 'react';
import Slider from '@mui/joy/Slider';
import type { SliderProps } from '@mui/joy/Slider';
import Box from '@mui/joy/Box';
import FormLabel from '@mui/joy/FormLabel';
import FormControl from '@mui/joy/FormControl';

export interface EmbySliderProps extends SliderProps {
    label?: string;
    helperText?: string;
}

const EmbySlider = React.forwardRef<HTMLSpanElement, EmbySliderProps>(({ label, helperText, ...props }, ref) => {
    return (
        <FormControl>
            {label && <FormLabel>{label}</FormLabel>}
            <Slider
                ref={ref}
                {...props}
            />
        </FormControl>
    );
});

EmbySlider.displayName = 'EmbySlider';

export default EmbySlider;
