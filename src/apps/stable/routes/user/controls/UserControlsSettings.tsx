import { vars } from '../../../../../styles/tokens.css';

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
        <Box className="libraryPage" style={{ padding: vars.spacing['5'], maxWidth: '800px', margin: '0 auto' }}>
            <Heading.H3 style={{ marginBottom: vars.spacing['5'] }}>Control Settings</Heading.H3>

            {message && (
                <Alert variant="success" style={{ marginBottom: vars.spacing['4'] }}>
                    {message}
                </Alert>
            )}

            <Card style={{ marginBottom: vars.spacing['5'] }}>
                <CardBody>
                    <Text weight="bold" style={{ marginBottom: vars.spacing['4'] }}>
                        Input Devices
                    </Text>
                    <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
                        <FormControl>
                            <FormLabel style={{ marginBottom: 0 }}>Enable Gamepad Navigation</FormLabel>
                            <Switch
                                checked={settings.enableGamepad}
                                onChange={e => setSettings(prev => ({ ...prev, enableGamepad: e.target.checked }))}
                            />
                        </FormControl>
                    </Flex>
                    <FormHelperText style={{ marginTop: vars.spacing['2'] }}>
                        Use a game controller to navigate the interface
                    </FormHelperText>
                </CardBody>
            </Card>

            {isTv && (
                <Card style={{ marginBottom: vars.spacing['5'] }}>
                    <CardBody>
                        <Text weight="bold" style={{ marginBottom: vars.spacing['4'] }}>
                            Scrolling
                        </Text>
                        <Flex style={{ alignItems: 'center', gap: vars.spacing['4'] }}>
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
                        <FormHelperText style={{ marginTop: vars.spacing['2'] }}>Enable smooth scrolling animations</FormHelperText>
                    </CardBody>
                </Card>
            )}

            <Flex style={{ gap: vars.spacing['4'] }}>
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
