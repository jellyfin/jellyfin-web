import {
    type SliderProps as RadixSliderProps,
    Range,
    Root,
    Thumb,
    Track
} from '@radix-ui/react-slider';
import React, { type CSSProperties, forwardRef, type ReactElement } from 'react';
import { sliderRange, sliderRoot, sliderThumb, sliderTrack } from './Slider.css.ts';

export interface SliderProps extends Omit<RadixSliderProps, 'asChild'> {
    readonly className?: string;
    readonly style?: CSSProperties;
}

export const Slider = forwardRef<HTMLSpanElement, SliderProps>(
    (
        {
            value,
            defaultValue = [50],
            min = 0,
            max = 100,
            step = 1,
            onValueChange,
            orientation = 'horizontal',
            disabled = false,
            className,
            style,
            ...props
        },
        ref
    ): ReactElement => {
        return (
            <Root
                ref={ref}
                className={`${sliderRoot} ${className ?? ''}`}
                value={value}
                defaultValue={defaultValue}
                min={min}
                max={max}
                step={step}
                onValueChange={onValueChange}
                orientation={orientation}
                disabled={disabled}
                style={style}
                {...props}
            >
                <Track className={sliderTrack}>
                    <Range className={sliderRange} />
                </Track>
                <Thumb className={sliderThumb} />
            </Root>
        );
    }
);

Slider.displayName = 'Slider';

export default Slider;

export { sliderRoot, sliderTrack, sliderRange, sliderThumb };
