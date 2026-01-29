import type { Meta, StoryObj } from '@storybook/react';
import { DiscImage } from '../../organisms/DiscImage';

const meta: Meta<typeof DiscImage> = {
    title: 'Organisms/DiscImage',
    component: DiscImage,
    parameters: {
        layout: 'centered'
    }
};

export default meta;
type Story = StoryObj<typeof DiscImage>;

export const Playing: Story = {
    args: {
        src: 'https://demo.jellyfin.org/stable/Items/190de713605cc7f400cf166cd8606603/Images/Primary?fillHeight=333&fillWidth=333&quality=96&tag=6cfac0660660cd00f4c75cc0317ed091',
        size: 300,
        isPlaying: true
    }
};

export const Paused: Story = {
    args: {
        src: 'https://demo.jellyfin.org/stable/Items/190de713605cc7f400cf166cd8606603/Images/Primary?fillHeight=333&fillWidth=333&quality=96&tag=6cfac0660660cd00f4c75cc0317ed091',
        size: 300,
        isPlaying: false
    }
};
