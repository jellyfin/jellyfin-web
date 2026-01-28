import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback, type ComponentProps } from 'react';
import { Seeker } from '../../Seeker';

const meta: Meta<typeof Seeker> = {
    title: 'UI Primitives/Seeker',
    component: Seeker,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        height: {
            control: { type: 'number' },
            description: 'Height of the seeker track in pixels'
        },
        showTime: {
            control: { type: 'boolean' },
            description: 'Whether to show time display'
        },
        showThumb: {
            control: { type: 'boolean' },
            description: 'Whether to show the seek thumb'
        },
        spinOnSeek: {
            control: { type: 'boolean' },
            description: 'Whether to show spin animation on seek'
        }
    }
};

export default meta;
type Story = StoryObj<typeof Seeker>;

type SeekerProps = ComponentProps<typeof Seeker>;

function SeekerWithHooks(args: Readonly<Partial<SeekerProps>>): ReactElement {
    const [currentTime, setCurrentTime] = useState(75);
    const duration = 180;

    const handleSeek = useCallback((time: number): void => {
        setCurrentTime(time);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px', width: '300px' }}>
            <Seeker {...args} currentTime={currentTime} duration={duration} onSeek={handleSeek} />
        </div>
    );
}

function DefaultStory(args: Readonly<SeekerProps>): ReactElement {
    return <SeekerWithHooks {...args} />;
}

export const Default: Story = {
    render: DefaultStory
};

function WithBufferedStory(args: Readonly<SeekerProps>): ReactElement {
    const [currentTime, setCurrentTime] = useState(90);
    const duration = 240;
    const buffered = [
        { start: 0, end: 180 },
        { start: 60, end: 120 }
    ];

    const handleSeek = useCallback((time: number): void => {
        setCurrentTime(time);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px', width: '300px' }}>
            <Seeker {...args} currentTime={currentTime} duration={duration} buffered={buffered} onSeek={handleSeek} />
        </div>
    );
}

export const WithBuffered: Story = {
    args: {
        height: 6,
        showTime: true,
        showThumb: true
    },
    render: WithBufferedStory
};

function NoTimeStory(args: Readonly<SeekerProps>): ReactElement {
    const [currentTime, setCurrentTime] = useState(45);
    const duration = 200;

    const handleSeek = useCallback((time: number): void => {
        setCurrentTime(time);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px', width: '300px' }}>
            <Seeker {...args} currentTime={currentTime} duration={duration} onSeek={handleSeek} />
        </div>
    );
}

export const NoTime: Story = {
    args: {
        showTime: false,
        height: 6
    },
    render: NoTimeStory
};

function SpinOnSeekStory(args: Readonly<SeekerProps>): ReactElement {
    const [currentTime, setCurrentTime] = useState(100);
    const duration = 300;

    const handleSeek = useCallback((time: number): void => {
        setCurrentTime(time);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px', width: '300px' }}>
            <Seeker {...args} currentTime={currentTime} duration={duration} onSeek={handleSeek} />
        </div>
    );
}

export const SpinOnSeek: Story = {
    args: {
        showTime: true,
        height: 6,
        spinOnSeek: true
    },
    render: SpinOnSeekStory
};

function WideStory(args: Readonly<SeekerProps>): ReactElement {
    const [currentTime, setCurrentTime] = useState(120);
    const duration = 360;

    const handleSeek = useCallback((time: number): void => {
        setCurrentTime(time);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px', width: '500px' }}>
            <Seeker {...args} currentTime={currentTime} duration={duration} onSeek={handleSeek} />
        </div>
    );
}

export const Wide: Story = {
    args: {
        showTime: true,
        height: 4
    },
    render: WideStory
};

function NearEndStory(args: Readonly<SeekerProps>): ReactElement {
    const [currentTime, setCurrentTime] = useState(295);
    const duration = 300;

    const handleSeek = useCallback((time: number): void => {
        setCurrentTime(time);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px', width: '300px' }}>
            <Seeker {...args} currentTime={currentTime} duration={duration} onSeek={handleSeek} />
        </div>
    );
}

export const NearEnd: Story = {
    args: {
        showTime: true,
        height: 6
    },
    render: NearEndStory
};

function ShortTrackStory(args: Readonly<SeekerProps>): ReactElement {
    const [currentTime, setCurrentTime] = useState(15);
    const duration = 30;

    const handleSeek = useCallback((time: number): void => {
        setCurrentTime(time);
    }, []);

    return (
        <div style={{ padding: '20px', backgroundColor: '#252525', borderRadius: '8px', width: '300px' }}>
            <Seeker {...args} currentTime={currentTime} duration={duration} onSeek={handleSeek} />
        </div>
    );
}

export const ShortTrack: Story = {
    args: {
        showTime: true,
        height: 8
    },
    render: ShortTrackStory
};
