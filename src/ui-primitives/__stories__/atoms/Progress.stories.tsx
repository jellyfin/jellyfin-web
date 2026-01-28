import { vars } from 'styles/tokens.css.ts';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Progress } from '../..';
import { Text } from '../..';

const meta: Meta<typeof Progress> = {
    title: 'UI Primitives/Progress',
    component: Progress,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
    args: {
        value: 50
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '300px' }}>
                <Story />
            </div>
        )
    ]
};

function AllValuesStory(): ReactElement {
    return (
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: vars.spacing['4'] }}>
            <Progress value={0} />
            <Text size="sm" color="secondary">
                0%
            </Text>
            <Progress value={25} />
            <Text size="sm" color="secondary">
                25%
            </Text>
            <Progress value={50} />
            <Text size="sm" color="secondary">
                50%
            </Text>
            <Progress value={75} />
            <Text size="sm" color="secondary">
                75%
            </Text>
            <Progress value={100} />
            <Text size="sm" color="secondary">
                100%
            </Text>
        </div>
    );
}

export const AllValues: Story = {
    render: AllValuesStory
};

function WithLabelsStory(): ReactElement {
    return (
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <Text size="sm" style={{ marginBottom: vars.spacing['2'] }}>
                    Download Progress
                </Text>
                <Progress value={68} />
                <Text size="sm" color="secondary" style={{ marginTop: vars.spacing['1'] }}>
                    68% complete
                </Text>
            </div>
            <div>
                <Text size="sm" style={{ marginBottom: vars.spacing['2'] }}>
                    Upload Progress
                </Text>
                <Progress value={42} />
                <Text size="sm" color="secondary" style={{ marginTop: vars.spacing['1'] }}>
                    42% complete
                </Text>
            </div>
        </div>
    );
}

export const WithLabels: Story = {
    render: WithLabelsStory
};

function MultipleProgressStory(): ReactElement {
    return (
        <div style={{ width: '300px' }}>
            <div style={{ marginBottom: vars.spacing['4'] }}>
                <Text size="sm">Task 1</Text>
                <Progress value={100} />
            </div>
            <div style={{ marginBottom: vars.spacing['4'] }}>
                <Text size="sm">Task 2</Text>
                <Progress value={75} />
            </div>
            <div style={{ marginBottom: vars.spacing['4'] }}>
                <Text size="sm">Task 3</Text>
                <Progress value={45} />
            </div>
            <div>
                <Text size="sm">Task 4</Text>
                <Progress value={10} />
            </div>
        </div>
    );
}

export const MultipleProgress: Story = {
    render: MultipleProgressStory
};

function LoadingStory(): ReactElement {
    return (
        <div style={{ width: '300px' }}>
            <Text size="sm" style={{ marginBottom: vars.spacing['2'] }}>
                Loading data...
            </Text>
            <Progress value={35} />
            <Text size="sm" color="secondary" style={{ marginTop: vars.spacing['1'] }}>
                Please wait...
            </Text>
        </div>
    );
}

export const Loading: Story = {
    render: LoadingStory
};

export const CustomWidth: Story = {
    args: {
        value: 60
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '150px' }}>
                <Text size="sm" style={{ marginBottom: vars.spacing['2'] }}>
                    Narrow
                </Text>
                <Story />
            </div>
        )
    ]
};
