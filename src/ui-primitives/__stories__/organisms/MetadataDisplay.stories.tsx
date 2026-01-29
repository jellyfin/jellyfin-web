import type { Meta, StoryObj } from '@storybook/react';
import { MetadataDisplay } from '../../organisms/MetadataDisplay';

const meta: Meta<typeof MetadataDisplay> = {
    title: 'Organisms/MetadataDisplay',
    component: MetadataDisplay,
    parameters: {
        layout: 'centered'
    }
};

export default meta;
type Story = StoryObj<typeof MetadataDisplay>;

export const Default: Story = {
    args: {
        title: 'Better Now',
        artist: 'Post Malone',
        album: 'beerbongs & bentleys',
        size: 'md'
    }
};

export const Large: Story = {
    args: {
        title: 'Better Now',
        artist: 'Post Malone',
        album: 'beerbongs & bentleys',
        size: 'lg'
    }
};
