import type { Meta, StoryObj } from '@storybook/react';
import { NowPlayingPage } from '../../organisms/playback/NowPlayingPage';

const meta: Meta<typeof NowPlayingPage> = {
    title: 'Organisms/Playback/NowPlayingPage',
    component: NowPlayingPage,
    parameters: {
        layout: 'fullscreen'
    }
};

export default meta;
type Story = StoryObj<typeof NowPlayingPage>;

export const Desktop: Story = {
    args: {
        isMobile: false
    }
};

export const Mobile: Story = {
    args: {
        isMobile: true
    }
};
