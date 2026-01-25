import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback, type ChangeEvent } from 'react';
import { FormControl, FormLabel, FormHelperText, Switch, FormControlLabel } from '../FormControl';

const meta: Meta<typeof FormControl> = {
    title: 'UI Primitives/FormControl',
    component: FormControl,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof FormControl>;

function DefaultStory(): ReactElement {
    return (
        <div style={{ width: '300px' }}>
            <FormControl>
                <FormLabel>Email Address</FormLabel>
                <input
                    type="email"
                    placeholder="Enter your email"
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        backgroundColor: '#252525',
                        color: '#fff'
                    }}
                />
                <FormHelperText>We&apos;ll never share your email</FormHelperText>
            </FormControl>
        </div>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function WithSwitchStory(): ReactElement {
    const [checked, setChecked] = useState(false);
    const handleCheckedChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setChecked(e.target.checked);
    }, []);

    return (
        <div style={{ width: '300px' }}>
            <FormControl>
                <FormControlLabel
                    label="Enable notifications"
                    control={<Switch checked={checked} onChange={handleCheckedChange} />}
                />
                <FormHelperText>Receive push notifications for activity</FormHelperText>
            </FormControl>
        </div>
    );
}

export const WithSwitch: Story = {
    render: WithSwitchStory
};

function MultipleFieldsStory(): ReactElement {
    return (
        <div style={{ width: '350px' }}>
            <FormControl style={{ marginBottom: '16px' }}>
                <FormLabel>Username</FormLabel>
                <input
                    type="text"
                    placeholder="Enter username"
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        backgroundColor: '#252525',
                        color: '#fff'
                    }}
                />
            </FormControl>
            <FormControl style={{ marginBottom: '16px' }}>
                <FormLabel>Password</FormLabel>
                <input
                    type="password"
                    placeholder="Enter password"
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        backgroundColor: '#252525',
                        color: '#fff'
                    }}
                />
            </FormControl>
            <FormControl>
                <FormControlLabel label="Remember me" control={<Switch />} />
            </FormControl>
        </div>
    );
}

export const MultipleFields: Story = {
    render: MultipleFieldsStory
};

function WithErrorStory(): ReactElement {
    return (
        <div style={{ width: '300px' }}>
            <FormControl>
                <FormLabel>Email</FormLabel>
                <input
                    type="email"
                    defaultValue="invalid-email"
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #f44336',
                        backgroundColor: '#252525',
                        color: '#fff'
                    }}
                />
                <FormHelperText style={{ color: '#f44336' }}>Please enter a valid email address</FormHelperText>
            </FormControl>
        </div>
    );
}

export const WithError: Story = {
    render: WithErrorStory
};

function FormControlLabelOnlyStory(): ReactElement {
    return (
        <div style={{ width: '300px' }}>
            <FormControlLabel label="Dark Mode" control={<Switch defaultChecked />} />
            <div style={{ marginTop: '16px' }}>
                <FormControlLabel label="Auto-play videos" control={<Switch />} />
            </div>
            <div style={{ marginTop: '16px' }}>
                <FormControlLabel label="Show notifications" control={<Switch defaultChecked />} />
            </div>
        </div>
    );
}

export const FormControlLabelOnly: Story = {
    render: FormControlLabelOnlyStory
};
