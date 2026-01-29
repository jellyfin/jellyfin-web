import type { Meta, StoryObj } from '@storybook/react';
import { OSDOverlay } from '../../organisms/playback/OSDOverlay';

const meta: Meta<typeof OSDOverlay> = {
    title: 'Organisms/Playback/OSDOverlay',
    component: OSDOverlay,
    parameters: {
        layout: 'fullscreen'
    }
};

export default meta;
type Story = StoryObj<typeof OSDOverlay>;

export const Default: Story = {
    args: {}
};
