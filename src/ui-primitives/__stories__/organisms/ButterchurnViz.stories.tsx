import type { Meta, StoryObj } from '@storybook/react';
import { ButterchurnViz } from '../../organisms/ButterchurnViz';

const meta: Meta<typeof ButterchurnViz> = {
    title: 'Organisms/ButterchurnViz',
    component: ButterchurnViz,
    parameters: {
        layout: 'fullscreen'
    }
};

export default meta;
type Story = StoryObj<typeof ButterchurnViz>;

export const Default: Story = {
    args: {
        preset: 'default'
    }
};
