import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { vars } from '../../../styles/tokens.css';

interface AvatarProps {
    src?: string;
    alt?: string;
    fallback: string;
    size?: number;
}

function Avatar({ src, alt, fallback, size = 40 }: Readonly<AvatarProps>): ReactElement {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: vars.colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: vars.colors.text,
                fontWeight: 600,
                fontSize: size * 0.4
            }}
        >
            {src !== undefined && src !== '' ? (
                <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                fallback
            )}
        </div>
    );
}

const meta: Meta<typeof Avatar> = {
    title: 'UI Primitives/Avatar',
    component: Avatar,
    parameters: { layout: 'centered' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
    args: {
        src: 'https://i.pravatar.cc/150?img=1',
        alt: 'User avatar',
        fallback: 'JD'
    }
};

export const WithFallback: Story = {
    args: {
        fallback: 'JD'
    }
};

function SizesStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: vars.spacing['5'], alignItems: 'center' }}>
            <Avatar fallback="S" size={24} />
            <Avatar fallback="M" size={40} />
            <Avatar fallback="L" size={56} />
            <Avatar fallback="XL" size={80} />
        </div>
    );
}

export const Sizes: Story = {
    render: SizesStory
};

function GroupStory(): ReactElement {
    return (
        <div style={{ display: 'flex' }}>
            {['JD', 'AB', 'CD', 'EF'].map((initials, i) => (
                <div key={initials} style={{ marginLeft: i > 0 ? '-12px' : 0 }}>
                    <Avatar fallback={initials} size={40} />
                </div>
            ))}
        </div>
    );
}

export const Group: Story = {
    render: GroupStory
};
