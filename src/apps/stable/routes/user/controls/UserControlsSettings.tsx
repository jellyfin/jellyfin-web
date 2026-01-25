import React, { useState, useEffect } from 'react';

import { Box } from 'ui-primitives/Box';
import { Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Heading } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';
import { Card, CardBody } from 'ui-primitives/Card';
import { Switch, FormControl, FormLabel, FormHelperText } from 'ui-primitives/FormControl';
import { Alert } from 'ui-primitives/Alert';

import { LoadingSpinner } from 'components/LoadingSpinner';

export function UserControlsSettings() {
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isTv, setIsTv] = useState(false);

    const [settings, setSettings] = useState({
        enableGamepad: true,
        enableSmoothScroll: false
    });

    useEffect(() => {
        loadSettings();
        setIsTv((window as any).layoutManager?.tv ?? false);
    }, []);

    const loadSettings = () => {
        setSettings({
            enableGamepad: (window as any).appSettings?.enableGamepad?.() ?? true,
            enableSmoothScroll: (window as any).appSettings?.enableSmoothScroll?.() ?? false
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        setMessage(null);

        try {
            (window as any).appSettings?.enableGamepad?.(settings.enableGamepad);
            (window as any).appSettings?.enableSmoothScroll?.(settings.enableSmoothScroll);
            setMessage('Settings saved');
        } catch (err) {
            setMessage('Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    if (isSaving) {
        return <LoadingSpinner message="Saving..." />;
    }

    return (
        <Box className="libraryPage" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Heading.H3 style={{ marginBottom: '24px' }}>Control Settings</Heading.H3>

            {message && (
                <Alert variant="success" style={{ marginBottom: '16px' }}>
                    {message}
                </Alert>
            )}

            <Card style={{ marginBottom: '24px' }}>
                <CardBody>
                    <Text weight="bold" style={{ marginBottom: '16px' }}>
                        Input Devices
                    </Text>
                    <Flex style={{ alignItems: 'center', gap: '16px' }}>
                        <FormControl>
                            <FormLabel style={{ marginBottom: 0 }}>Enable Gamepad Navigation</FormLabel>
                            <Switch
                                checked={settings.enableGamepad}
                                onChange={e => setSettings(prev => ({ ...prev, enableGamepad: e.target.checked }))}
                            />
                        </FormControl>
                    </Flex>
                    <FormHelperText style={{ marginTop: '8px' }}>
                        Use a game controller to navigate the interface
                    </FormHelperText>
                </CardBody>
            </Card>

            {isTv && (
                <Card style={{ marginBottom: '24px' }}>
                    <CardBody>
                        <Text weight="bold" style={{ marginBottom: '16px' }}>
                            Scrolling
                        </Text>
                        <Flex style={{ alignItems: 'center', gap: '16px' }}>
                            <FormControl>
                                <FormLabel style={{ marginBottom: 0 }}>Smooth Scrolling</FormLabel>
                                <Switch
                                    checked={settings.enableSmoothScroll}
                                    onChange={e =>
                                        setSettings(prev => ({ ...prev, enableSmoothScroll: e.target.checked }))
                                    }
                                />
                            </FormControl>
                        </Flex>
                        <FormHelperText style={{ marginTop: '8px' }}>Enable smooth scrolling animations</FormHelperText>
                    </CardBody>
                </Card>
            )}

            <Flex style={{ gap: '16px' }}>
                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
                <Button variant="ghost" onClick={loadSettings}>
                    Cancel
                </Button>
            </Flex>
        </Box>
    );
}

export default UserControlsSettings;
