import type { Meta, StoryObj } from '@storybook/react';
import { Backdrop } from '../../organisms/Backdrop';

const meta: Meta<typeof Backdrop> = {
    title: 'Organisms/Backdrop',
    component: Backdrop
};

export default meta;
type Story = StoryObj<typeof Backdrop>;

export const Default: Story = {
    args: {
        src: 'https://demo.jellyfin.org/stable/Items/190de713605cc7f400cf166cd8606603/Images/Primary?fillHeight=333&fillWidth=333&quality=96&tag=6cfac0660660cd00f4c75cc0317ed091'
    }
};
