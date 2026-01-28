import type { Meta, StoryObj } from '@storybook/react';
import { AlbumArt } from '../../organisms/AlbumArt';

const meta: Meta<typeof AlbumArt> = {
    title: 'Organisms/AlbumArt',
    component: AlbumArt,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof AlbumArt>;

export const Default: Story = {
    args: {
        src: 'https://demo.jellyfin.org/stable/Items/190de713605cc7f400cf166cd8606603/Images/Primary?fillHeight=333&fillWidth=333&quality=96&tag=6cfac0660660cd00f4c75cc0317ed091',
        size: 300,
    },
};

export const NoImage: Story = {
    args: {
        src: null,
        size: 300,
    },
};
