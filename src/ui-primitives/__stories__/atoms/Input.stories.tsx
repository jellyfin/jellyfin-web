import { vars } from 'styles/tokens.css.ts';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback, type ChangeEvent } from 'react';
import { Input } from '../..';

const meta: Meta<typeof Input> = {
    title: 'UI Primitives/Input',
    component: Input,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
    args: {
        placeholder: 'Enter text...'
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '300px' }}>
                <Story />
            </div>
        )
    ]
};

export const WithLabel: Story = {
    args: {
        label: 'Username',
        placeholder: 'Enter your username'
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '300px' }}>
                <Story />
            </div>
        )
    ]
};

export const WithHelperText: Story = {
    args: {
        label: 'Email',
        placeholder: 'Enter your email',
        helperText: 'We will never share your email'
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '300px' }}>
                <Story />
            </div>
        )
    ]
};

function AllStatesStory(): ReactElement {
    return (
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: vars.spacing['4'] }}>
            <Input label="Default" placeholder="Enter text..." />
            <Input label="With Value" defaultValue="Some text" />
            <Input label="Disabled" placeholder="Disabled" disabled />
            <Input label="Error" placeholder="Error state" style={{ borderColor: '#f44336' }} />
        </div>
    );
}

export const AllStates: Story = {
    render: AllStatesStory
};

export const Textarea: Story = {
    args: {
        label: 'Message',
        placeholder: 'Enter your message...',
        as: 'textarea',
        rows: 4
    },
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '300px' }}>
                <Story />
            </div>
        )
    ]
};

function FormExampleStory(): ReactElement {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setEmail(e.target.value);
    }, []);

    const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setPassword(e.target.value);
    }, []);

    return (
        <div style={{ width: '320px' }}>
            <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                style={{ marginBottom: vars.spacing['4'] }}
            />
            <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                style={{ marginBottom: vars.spacing['4'] }}
            />
            <Input label="Bio" placeholder="Tell us about yourself..." as="textarea" rows={3} />
        </div>
    );
}

export const FormExample: Story = {
    render: FormExampleStory
};

function TypesStory(): ReactElement {
    return (
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: vars.spacing['4'] }}>
            <Input label="Text" type="text" placeholder="Text input" />
            <Input label="Email" type="email" placeholder="Email input" />
            <Input label="Password" type="password" placeholder="Password input" />
            <Input label="Number" type="number" placeholder="Number input" />
            <Input label="Search" type="search" placeholder="Search input" />
            <Input label="Tel" type="tel" placeholder="Telephone input" />
        </div>
    );
}

export const Types: Story = {
    render: TypesStory
};
