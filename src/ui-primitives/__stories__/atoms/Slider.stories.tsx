import * as SliderPrimitive from '@radix-ui/react-slider';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { motion } from 'motion/react';
import { type ReactElement, useCallback, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';

interface SliderProps {
    value?: number[];
    onValueChange?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}

function Slider({
    value = [50],
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    disabled
}: Readonly<SliderProps>): ReactElement {
    return (
        <SliderPrimitive.Root
            value={value}
            onValueChange={onValueChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '200px',
                height: '20px',
                cursor: disabled === true ? 'not-allowed' : 'pointer',
                opacity: disabled === true ? 0.5 : 1
            }}
        >
            <SliderPrimitive.Track
                style={{
                    position: 'relative',
                    flexGrow: 1,
                    height: '4px',
                    backgroundColor: vars.colors.divider,
                    borderRadius: '2px'
                }}
            >
                <SliderPrimitive.Range
                    style={{
                        position: 'absolute',
                        height: '100%',
                        backgroundColor: vars.colors.primary,
                        borderRadius: '2px'
                    }}
                />
            </SliderPrimitive.Track>
            {value.map((_, i) => (
                <SliderPrimitive.Thumb key={`thumb-${i}`} asChild>
                    <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: vars.colors.primary,
                            borderRadius: '50%',
                            boxShadow: vars.shadows.sm,
                            outline: 'none'
                        }}
                    />
                </SliderPrimitive.Thumb>
            ))}
        </SliderPrimitive.Root>
    );
}

const meta: Meta<typeof Slider> = {
    title: 'UI Primitives/Slider',
    component: Slider,
    parameters: { layout: 'centered' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory(): ReactElement {
    const [value, setValue] = useState([50]);
    const handleValueChange = useCallback((newValue: number[]): void => {
        setValue(newValue);
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: vars.spacing['5'],
                alignItems: 'center'
            }}
        >
            <Slider value={value} onValueChange={handleValueChange} />
            <span style={{ color: vars.colors.text }}>{value[0]}</span>
        </div>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function RangeStory(): ReactElement {
    const [value, setValue] = useState([25, 75]);
    const handleValueChange = useCallback((newValue: number[]): void => {
        setValue(newValue);
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: vars.spacing['5'],
                alignItems: 'center'
            }}
        >
            <Slider value={value} onValueChange={handleValueChange} />
            <span style={{ color: vars.colors.text }}>
                {value[0]} - {value[1]}
            </span>
        </div>
    );
}

export const Range: Story = {
    render: RangeStory
};

function VolumeControlStory(): ReactElement {
    const [value, setValue] = useState([80]);
    const handleValueChange = useCallback((newValue: number[]): void => {
        setValue(newValue);
    }, []);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: vars.spacing['4'] }}>
            <span style={{ color: vars.colors.text }}>🔊</span>
            <Slider value={value} onValueChange={handleValueChange} />
            <span style={{ color: vars.colors.textSecondary, width: '30px' }}>{value[0]}%</span>
        </div>
    );
}

export const VolumeControl: Story = {
    render: VolumeControlStory
};

export const Disabled: Story = {
    args: { disabled: true, value: [50] }
};
