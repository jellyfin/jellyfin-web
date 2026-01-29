import type { Meta, StoryObj } from '@storybook/react';
import { AutoDJToggle } from '../../organisms/playback/AutoDJToggle';

const meta: Meta<typeof AutoDJToggle> = {
    title: 'Organisms/Playback/AutoDJToggle',
    component: AutoDJToggle,
    parameters: {
        layout: 'centered'
    }
};

export default meta;
type Story = StoryObj<typeof AutoDJToggle>;

export const Default: Story = {
    args: {}
};
