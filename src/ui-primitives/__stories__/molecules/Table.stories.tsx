import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../Table';
import { vars } from '../styles/tokens.css';

const meta: Meta<typeof Table> = {
    title: 'UI Primitives/Table',
    component: Table,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Table>;

function DefaultStory(): ReactElement {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>John Doe</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Active</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Jane Smith</TableCell>
                    <TableCell>Editor</TableCell>
                    <TableCell>Active</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Bob Johnson</TableCell>
                    <TableCell>Viewer</TableCell>
                    <TableCell>Inactive</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

export const Default: Story = {
    render: DefaultStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '500px' }}>
                <Story />
            </div>
        )
    ]
};

function WithMultipleColumnsStory(): ReactElement {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[
                    { id: 1, name: 'Alice Brown', email: 'alice@example.com', role: 'Admin', status: 'Active' },
                    { id: 2, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Editor', status: 'Active' },
                    { id: 3, name: 'Diana Ross', email: 'diana@example.com', role: 'Viewer', status: 'Inactive' }
                ].map(row => (
                    <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.status}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export const WithMultipleColumns: Story = {
    render: WithMultipleColumnsStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '700px' }}>
                <Story />
            </div>
        )
    ]
};

function WithStyledCellsStory(): ReactElement {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Movie</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Genre</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>Inception</TableCell>
                    <TableCell>2010</TableCell>
                    <TableCell style={{ color: '#4caf50', fontWeight: vars.typography.fontWeightMedium }}>
                        8.8
                    </TableCell>
                    <TableCell>Sci-Fi</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>The Dark Knight</TableCell>
                    <TableCell>2008</TableCell>
                    <TableCell style={{ color: '#4caf50', fontWeight: 500 }}>9.0</TableCell>
                    <TableCell>Action</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Interstellar</TableCell>
                    <TableCell>2014</TableCell>
                    <TableCell style={{ color: '#ff9800', fontWeight: vars.typography.fontWeightMedium }}>
                        8.6
                    </TableCell>
                    <TableCell>Sci-Fi</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

export const WithStyledCells: Story = {
    render: WithStyledCellsStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '500px' }}>
                <Story />
            </div>
        )
    ]
};

function CompactStory(): ReactElement {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>1.0.0</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Ready</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Jan 21, 2026</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
}

export const Compact: Story = {
    render: CompactStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '300px' }}>
                <Story />
            </div>
        )
    ]
};
