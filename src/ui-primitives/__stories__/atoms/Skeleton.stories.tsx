import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '../Skeleton';

const meta: Meta<typeof Skeleton> = {
    title: 'UI Primitives/Skeleton',
    component: Skeleton,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        variant: { control: 'select', options: ['rectangular', 'circular', 'text'] }
    }
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Rectangular: Story = {
    args: {
        variant: 'rectangular',
        width: 200,
        height: 100
    }
};

export const Circular: Story = {
    args: {
        variant: 'circular',
        width: 60,
        height: 60
    }
};

export const TextVariant: Story = {
    args: {
        variant: 'text',
        width: 250,
        height: 20
    }
};

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
            <Skeleton variant='rectangular' width='100%' height={80} />
            <Skeleton variant='rectangular' width='100%' height={80} />
            <Skeleton variant='circular' width={50} height={50} style={{ alignSelf: 'center' }} />
            <Skeleton variant='text' width='100%' height={16} />
            <Skeleton variant='text' width='80%' height={16} />
            <Skeleton variant='text' width='60%' height={16} />
        </div>
    )
};

export const CardSkeleton: Story = {
    render: () => (
        <div style={{ width: '280px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            <Skeleton variant='rectangular' width='100%' height={120} />
            <div style={{ padding: '16px' }}>
                <Skeleton variant='text' width='80%' height={24} style={{ marginBottom: '8px' }} />
                <Skeleton variant='text' width='60%' height={16} style={{ marginBottom: '16px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Skeleton variant='rectangular' width={80} height={32} />
                    <Skeleton variant='rectangular' width={80} height={32} />
                </div>
            </div>
        </div>
    )
};

export const AvatarList: Story = {
    render: () => (
        <div style={{ width: '250px' }}>
            {Array.from({ length: 4 }, (_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Skeleton variant='circular' width={40} height={40} />
                    <div style={{ flex: 1 }}>
                        <Skeleton variant='text' width='70%' height={16} style={{ marginBottom: '4px' }} />
                        <Skeleton variant='text' width='50%' height={12} />
                    </div>
                </div>
            ))}
        </div>
    )
};

export const TableRow: Story = {
    render: () => (
        <div style={{ width: '400px' }}>
            <div style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #333' }}>
                <Skeleton variant='circular' width={36} height={36} />
                <div style={{ flex: 1 }}>
                    <Skeleton variant='text' width='40%' height={16} style={{ marginBottom: '4px' }} />
                    <Skeleton variant='text' width='60%' height={14} />
                </div>
                <Skeleton variant='text' width={80} height={16} />
            </div>
            <div style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #333' }}>
                <Skeleton variant='circular' width={36} height={36} />
                <div style={{ flex: 1 }}>
                    <Skeleton variant='text' width='50%' height={16} style={{ marginBottom: '4px' }} />
                    <Skeleton variant='text' width='70%' height={14} />
                </div>
                <Skeleton variant='text' width={80} height={16} />
            </div>
            <div style={{ display: 'flex', gap: '12px', padding: '12px 0' }}>
                <Skeleton variant='circular' width={36} height={36} />
                <div style={{ flex: 1 }}>
                    <Skeleton variant='text' width='35%' height={16} style={{ marginBottom: '4px' }} />
                    <Skeleton variant='text' width='55%' height={14} />
                </div>
                <Skeleton variant='text' width={80} height={16} />
            </div>
        </div>
    )
};
