import type { Meta, StoryObj } from '@storybook/react';
import { type ReactElement, useState } from 'react';
import { EQKnob } from '../EQKnob';
import { Fader } from '../Fader';
import { FXSend } from '../FXSend';

const meta = {
    title: 'DJ Components/Controls',
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
} satisfies Meta;

export default meta;

/**
 * Fader at 0%
 */
export const FaderMinimum: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(0);
        return (
            <Fader
                label="VOLUME"
                value={value}
                onChange={setValue}
                min={0}
                max={100}
                step={1}
                showPeakMeter={true}
                peakLevel={value / 100}
            />
        );
    }
};

/**
 * Fader at 50%
 */
export const FaderMidpoint: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(50);
        return (
            <Fader
                label="VOLUME"
                value={value}
                onChange={setValue}
                min={0}
                max={100}
                step={1}
                showPeakMeter={true}
                peakLevel={value / 100}
            />
        );
    }
};

/**
 * Fader at 100%
 */
export const FaderMaximum: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(100);
        return (
            <Fader
                label="VOLUME"
                value={value}
                onChange={setValue}
                min={0}
                max={100}
                step={1}
                showPeakMeter={true}
                peakLevel={value / 100}
            />
        );
    }
};

/**
 * Fader without peak meter
 */
export const FaderNoPeakMeter: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(75);
        return (
            <Fader
                label="VOLUME"
                value={value}
                onChange={setValue}
                min={0}
                max={100}
                step={1}
                showPeakMeter={false}
            />
        );
    }
};

/**
 * Fader disabled state
 */
export const FaderDisabled: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(50);
        return (
            <Fader
                label="VOLUME"
                value={value}
                onChange={setValue}
                min={0}
                max={100}
                step={1}
                showPeakMeter={true}
                peakLevel={value / 100}
                disabled={true}
            />
        );
    }
};

/**
 * EQ Knob at -6 dB (minimum)
 */
export const EQKnobMinimum: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(-6);
        return <EQKnob label="Low" value={value} onChange={setValue} />;
    }
};

/**
 * EQ Knob at 0 dB (neutral)
 */
export const EQKnobNeutral: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(0);
        return <EQKnob label="Mid" value={value} onChange={setValue} />;
    }
};

/**
 * EQ Knob at +6 dB (maximum)
 */
export const EQKnobMaximum: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(6);
        return <EQKnob label="High" value={value} onChange={setValue} />;
    }
};

/**
 * EQ Knob at +3 dB
 */
export const EQKnobBoost: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(3);
        return <EQKnob label="Low" value={value} onChange={setValue} />;
    }
};

/**
 * EQ Knob at -3 dB
 */
export const EQKnobCut: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(-3);
        return <EQKnob label="High" value={value} onChange={setValue} />;
    }
};

/**
 * EQ Knob disabled state
 */
export const EQKnobDisabled: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(2);
        return <EQKnob label="Mid" value={value} onChange={setValue} disabled={true} />;
    }
};

/**
 * FX Send at 0%
 */
export const FXSendMinimum: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(0);
        return <FXSend number={1} value={value} onChange={setValue} />;
    }
};

/**
 * FX Send at 50%
 */
export const FXSendMidpoint: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(0.5);
        return <FXSend number={1} value={value} onChange={setValue} />;
    }
};

/**
 * FX Send at 100%
 */
export const FXSendMaximum: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(1);
        return <FXSend number={2} value={value} onChange={setValue} />;
    }
};

/**
 * FX Send #1 disabled
 */
export const FXSendDisabled: StoryObj = {
    render: (): ReactElement => {
        const [value, setValue] = useState(0.6);
        return <FXSend number={1} value={value} onChange={setValue} disabled={true} />;
    }
};

/**
 * All three EQ knobs side by side
 */
export const AllEQKnobs: StoryObj = {
    render: (): ReactElement => {
        const [low, setLow] = useState(0);
        const [mid, setMid] = useState(0);
        const [high, setHigh] = useState(0);
        return (
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <EQKnob label="Low" value={low} onChange={setLow} />
                <EQKnob label="Mid" value={mid} onChange={setMid} />
                <EQKnob label="High" value={high} onChange={setHigh} />
            </div>
        );
    }
};

/**
 * Both FX Sends side by side
 */
export const BothFXSends: StoryObj = {
    render: (): ReactElement => {
        const [fx1, setFx1] = useState(0);
        const [fx2, setFx2] = useState(0);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <FXSend number={1} value={fx1} onChange={setFx1} />
                <FXSend number={2} value={fx2} onChange={setFx2} />
            </div>
        );
    }
};
