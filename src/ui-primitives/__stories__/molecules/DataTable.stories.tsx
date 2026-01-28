import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useCallback } from 'react';
import { DataTable } from '../../DataTable';
import { type ColumnDef } from '@tanstack/react-table';
import { vars } from '../../../styles/tokens.css';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
}

const meta: Meta<typeof DataTable> = {
    title: 'UI Primitives/DataTable',
    component: DataTable,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof DataTable<User>>;

const columns: ColumnDef<User>[] = [
    {
        accessorKey: 'id',
        header: 'ID'
    },
    {
        accessorKey: 'name',
        header: 'Name'
    },
    {
        accessorKey: 'email',
        header: 'Email'
    },
    {
        accessorKey: 'role',
        header: 'Role'
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
            const status = getValue() as string;
            const color = status === 'active' ? '#4caf50' : '#f44336';
            return <span style={{ color, fontWeight: vars.typography.fontWeightMedium }}>{status}</span>;
        }
    }
];

const mockData: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'inactive' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'Admin', status: 'active' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Editor', status: 'active' }
];

export const Default: Story = {
    args: {
        data: mockData,
        columns,
        pageSize: 5
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '800px', height: '400px' }}>
                <Story />
            </div>
        )
    ]
};

export const Empty: Story = {
    args: {
        data: [],
        columns,
        isEmpty: true
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '800px', height: '300px' }}>
                <Story />
            </div>
        )
    ]
};

export const Loading: Story = {
    args: {
        data: [],
        columns,
        isLoading: true
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '800px', height: '300px' }}>
                <Story />
            </div>
        )
    ]
};

function RowClickStory(): ReactElement {
    const handleRowClick = useCallback((_row: User): void => {
        // Handle row click
    }, []);

    return <DataTable data={mockData} columns={columns} onRowClick={handleRowClick} pageSize={5} />;
}

export const WithRowClick: Story = {
    render: RowClickStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '800px', height: '400px' }}>
                <Story />
            </div>
        )
    ]
};

export const CustomPageSize: Story = {
    args: {
        data: mockData,
        columns,
        pageSize: 2
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '800px', height: '300px' }}>
                <Story />
            </div>
        )
    ]
};

function LargerDatasetStory(): ReactElement {
    const data = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: ['Admin', 'Editor', 'Viewer', 'Moderator'][i % 4],
        status: (['active', 'inactive'] as const)[i % 2]
    }));
    return <DataTable data={data} columns={columns} pageSize={10} />;
}

export const LargerDataset: Story = {
    render: LargerDatasetStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '800px', height: '500px' }}>
                <Story />
            </div>
        )
    ]
};
