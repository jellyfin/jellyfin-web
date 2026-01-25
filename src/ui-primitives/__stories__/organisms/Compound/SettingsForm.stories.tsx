import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback, type ChangeEvent } from 'react';
import { vars } from '../../../styles/tokens.css.ts';
import { Box, Flex } from '../../Box';
import { Heading } from '../../Text';
import { Card, CardBody, CardFooter, CardHeader } from '../../Card';
import { Button } from '../../Button';
import { Input } from '../../Input';
import { Switch, FormControl, FormLabel, FormHelperText } from '../../FormControl';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../Select';
import { Alert } from '../../Alert';

const meta: Meta = {
    title: 'UI Primitives/Compound/Settings Form',
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj;

interface SettingsFormData {
    displayName: string;
    email: string;
    theme: 'dark' | 'light' | 'system';
    enableNotifications: boolean;
    enableAutoPlay: boolean;
    quality: 'low' | 'medium' | 'high';
}

const defaultValues: SettingsFormData = {
    displayName: '',
    email: '',
    theme: 'dark',
    enableNotifications: true,
    enableAutoPlay: false,
    quality: 'high'
};

function SettingsFormStory(): ReactElement {
    const [formData, setFormData] = useState<SettingsFormData>(defaultValues);
    const [saved, setSaved] = useState(false);

    const handleSave = useCallback((): void => {
        setSaved(true);
        setTimeout(() => { setSaved(false); }, 3000);
    }, []);

    const handleReset = useCallback((): void => {
        setFormData(defaultValues);
    }, []);

    const handleDisplayNameChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setFormData(prev => ({ ...prev, displayName: e.target.value }));
    }, []);

    const handleEmailChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setFormData(prev => ({ ...prev, email: e.target.value }));
    }, []);

    const handleThemeChange = useCallback((value: string): void => {
        setFormData(prev => ({ ...prev, theme: value as SettingsFormData['theme'] }));
    }, []);

    const handleQualityChange = useCallback((value: string): void => {
        setFormData(prev => ({ ...prev, quality: value as SettingsFormData['quality'] }));
    }, []);

    const handleNotificationsChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setFormData(prev => ({ ...prev, enableNotifications: e.target.checked }));
    }, []);

    const handleAutoPlayChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        setFormData(prev => ({ ...prev, enableAutoPlay: e.target.checked }));
    }, []);

    return (
        <Box style={{ width: '500px' }}>
            <Card>
                <CardHeader>
                    <Heading level={3}>Settings</Heading>
                </CardHeader>
                <CardBody>
                    <Flex direction='column' gap={vars.spacing.lg}>
                        <FormControl>
                            <FormLabel>Display Name</FormLabel>
                            <Input
                                value={formData.displayName}
                                onChange={handleDisplayNameChange}
                                placeholder='Enter your name'
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Input
                                type='email'
                                value={formData.email}
                                onChange={handleEmailChange}
                                placeholder='your@email.com'
                            />
                            <FormHelperText>We&apos;ll never share your email</FormHelperText>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Theme</FormLabel>
                            <Select value={formData.theme} onValueChange={handleThemeChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='dark'>Dark</SelectItem>
                                    <SelectItem value='light'>Light</SelectItem>
                                    <SelectItem value='system'>System</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormControl>

                        <FormControl>
                            <FormLabel>Quality</FormLabel>
                            <Select value={formData.quality} onValueChange={handleQualityChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='low'>Low (480p)</SelectItem>
                                    <SelectItem value='medium'>Medium (720p)</SelectItem>
                                    <SelectItem value='high'>High (1080p+)</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormControl>

                        <Flex align='center' justify='space-between' style={{ padding: `${vars.spacing.sm} 0` }}>
                            <Box>
                                <FormLabel style={{ marginBottom: vars.spacing.xs }}>Enable Notifications</FormLabel>
                                <FormHelperText style={{ margin: 0 }}>Receive push notifications</FormHelperText>
                            </Box>
                            <Switch
                                checked={formData.enableNotifications}
                                onChange={handleNotificationsChange}
                            />
                        </Flex>

                        <Flex align='center' justify='space-between' style={{ padding: `${vars.spacing.sm} 0` }}>
                            <Box>
                                <FormLabel style={{ marginBottom: vars.spacing.xs }}>Auto-play Media</FormLabel>
                                <FormHelperText style={{ margin: 0 }}>Automatically play next episode</FormHelperText>
                            </Box>
                            <Switch
                                checked={formData.enableAutoPlay}
                                onChange={handleAutoPlayChange}
                            />
                        </Flex>

                        {saved && (
                            <Alert variant='success' title='Settings saved'>
                                Your preferences have been updated successfully.
                            </Alert>
                        )}
                    </Flex>
                </CardBody>
                <CardFooter>
                    <Flex gap={vars.spacing.sm} justify='flex-end'>
                        <Button variant='ghost' onClick={handleReset}>
                            Reset
                        </Button>
                        <Button variant='primary' onClick={handleSave}>
                            Save Changes
                        </Button>
                    </Flex>
                </CardFooter>
            </Card>
        </Box>
    );
}

export const SettingsForm: Story = {
    render: SettingsFormStory
};

function SettingsFormWithErrorsStory(): ReactElement {
    const errors = {
        displayName: 'Display name is required',
        email: 'Please enter a valid email'
    };

    return (
        <Box style={{ width: '500px' }}>
            <Card>
                <CardHeader>
                    <Heading level={3}>Settings</Heading>
                </CardHeader>
                <CardBody>
                    <Flex direction='column' gap={vars.spacing.lg}>
                        <FormControl error>
                            <FormLabel>Display Name</FormLabel>
                            <Input value='' onChange={(): void => {}} placeholder='Enter your name' />
                            <FormHelperText>{errors.displayName}</FormHelperText>
                        </FormControl>

                        <FormControl error>
                            <FormLabel>Email</FormLabel>
                            <Input type='email' value='invalid' onChange={(): void => {}} placeholder='your@email.com' />
                            <FormHelperText>{errors.email}</FormHelperText>
                        </FormControl>
                    </Flex>
                </CardBody>
                <CardFooter>
                    <Button variant='primary' disabled>
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </Box>
    );
}

export const SettingsFormWithErrors: Story = {
    render: SettingsFormWithErrorsStory
};

function SettingsFormLoadingStory(): ReactElement {
    return (
        <Box style={{ width: '500px' }}>
            <Card>
                <CardHeader>
                    <Heading level={3}>Settings</Heading>
                </CardHeader>
                <CardBody>
                    <Flex direction='column' gap={vars.spacing.lg}>
                        <FormControl>
                            <FormLabel>Display Name</FormLabel>
                            <Input value='Loading...' disabled />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Input value='loading@example.com' disabled />
                        </FormControl>
                    </Flex>
                </CardBody>
                <CardFooter>
                    <Flex gap={vars.spacing.sm} justify='flex-end'>
                        <Button variant='ghost' disabled>Reset</Button>
                        <Button variant='primary' disabled>Save Changes</Button>
                    </Flex>
                </CardFooter>
            </Card>
        </Box>
    );
}

export const SettingsFormLoading: Story = {
    render: SettingsFormLoadingStory
};
