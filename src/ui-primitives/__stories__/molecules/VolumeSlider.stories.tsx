import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback, type ComponentProps } from 'react';
import { VolumeSlider } from '../VolumeSlider';

const meta: Meta<typeof VolumeSlider> = {
    title: 'UI Primitives/VolumeSlider',
    component: VolumeSlider,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: { type: 'select' },
            options: ['sm', 'md', 'lg'],
            description: 'Size of the mute button'
        },
        showSlider: {
            control: { type: 'boolean' },
            description: 'Whether to show the volume slider'
        },
        sliderWidth: {
            control: { type: 'text' },
            description: 'Width of the slider in pixels'
        }
    }
};

export default meta;
type Story = StoryObj<typeof VolumeSlider>;

type VolumeSliderProps = ComponentProps<typeof VolumeSlider>;

function VolumeSliderWithHooks(): ReactElement {
    const [volume, setVolume] = useState(75);
    const [muted, setMuted] = useState(false);

    const handleVolumeChange = useCallback((newVolume: number): void => {
        setVolume(newVolume);
    }, []);

    const handleMuteToggle = useCallback((): void => {
        setMuted(prev => !prev);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px' }}>
            <VolumeSlider
                volume={volume}
                muted={muted}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
                size="md"
                showSlider={true}
            />
        </div>
    );
}

function DefaultStory(): ReactElement {
    return <VolumeSliderWithHooks />;
}

export const Default: Story = {
    render: DefaultStory
};

function SmallStory(args: Readonly<VolumeSliderProps>): ReactElement {
    const [volume, setVolume] = useState(75);
    const [muted, setMuted] = useState(false);

    const handleVolumeChange = useCallback((newVolume: number): void => {
        setVolume(newVolume);
    }, []);
    const handleMuteToggle = useCallback((): void => {
        setMuted(prev => !prev);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px' }}>
            <VolumeSlider
                {...args}
                volume={volume}
                muted={muted}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
            />
        </div>
    );
}

export const Small: Story = {
    args: {
        size: 'sm'
    },
    render: SmallStory
};

function LargeStory(args: Readonly<VolumeSliderProps>): ReactElement {
    const [volume, setVolume] = useState(75);
    const [muted, setMuted] = useState(false);

    const handleVolumeChange = useCallback((newVolume: number): void => {
        setVolume(newVolume);
    }, []);
    const handleMuteToggle = useCallback((): void => {
        setMuted(prev => !prev);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px' }}>
            <VolumeSlider
                {...args}
                volume={volume}
                muted={muted}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
            />
        </div>
    );
}

export const Large: Story = {
    args: {
        size: 'lg'
    },
    render: LargeStory
};

function MutedStory(args: Readonly<VolumeSliderProps>): ReactElement {
    const [volume, setVolume] = useState(0);
    const [muted, setMuted] = useState(true);

    const handleVolumeChange = useCallback((newVolume: number): void => {
        setVolume(newVolume);
    }, []);
    const handleMuteToggle = useCallback((): void => {
        setMuted(prev => !prev);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px' }}>
            <VolumeSlider
                {...args}
                volume={volume}
                muted={muted}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
            />
        </div>
    );
}

export const Muted: Story = {
    args: {
        size: 'md'
    },
    render: MutedStory
};

function SliderOnlyStory(args: Readonly<VolumeSliderProps>): ReactElement {
    const [volume, setVolume] = useState(50);
    const [muted, setMuted] = useState(false);

    const handleVolumeChange = useCallback((newVolume: number): void => {
        setVolume(newVolume);
    }, []);
    const handleMuteToggle = useCallback((): void => {
        setMuted(prev => !prev);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px' }}>
            <VolumeSlider
                {...args}
                volume={volume}
                muted={muted}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
                showSlider={true}
            />
        </div>
    );
}

export const SliderOnly: Story = {
    args: {
        size: 'md',
        showSlider: true
    },
    render: SliderOnlyStory
};

function WideSliderStory(args: Readonly<VolumeSliderProps>): ReactElement {
    const [volume, setVolume] = useState(50);
    const [muted, setMuted] = useState(false);

    const handleVolumeChange = useCallback((newVolume: number): void => {
        setVolume(newVolume);
    }, []);
    const handleMuteToggle = useCallback((): void => {
        setMuted(prev => !prev);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px' }}>
            <VolumeSlider
                {...args}
                volume={volume}
                muted={muted}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
                sliderWidth={150}
            />
        </div>
    );
}

export const WideSlider: Story = {
    args: {
        size: 'sm',
        sliderWidth: 150
    },
    render: WideSliderStory
};
