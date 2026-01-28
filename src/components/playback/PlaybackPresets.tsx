/**
 * Playback Presets
 *
 * Allows users to save and load queue configurations with playback settings.
 */

import React, { useState, useCallback } from 'react';
import { Box, Flex } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { Text, Heading } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Dialog, DialogContent, DialogTitle } from 'ui-primitives';
import { TrashIcon } from '@radix-ui/react-icons';
import { vars } from 'styles/tokens.css.ts';
import { logger } from 'utils/logger';

export interface PlaybackPreset {
    id: string;
    name: string;
    timestamp: number;
    queueItemCount: number;
    shuffleMode: string;
    repeatMode: string;
    currentItemId?: string;
}

export interface PlaybackPresetsProps {
    presets: PlaybackPreset[];
    isOpen: boolean;
    onClose: () => void;
    onSavePreset: (name: string) => Promise<void>;
    onLoadPreset: (presetId: string) => Promise<void>;
    onDeletePreset: (presetId: string) => Promise<void>;
}

export const PlaybackPresets: React.FC<PlaybackPresetsProps> = ({
    presets,
    isOpen,
    onClose,
    onSavePreset,
    onLoadPreset,
    onDeletePreset
}) => {
    const [presetName, setPresetName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);

    const handleSavePreset = useCallback(async () => {
        if (!presetName.trim()) {
            logger.warn('[PlaybackPresets] Preset name cannot be empty');
            return;
        }

        try {
            setIsSaving(true);
            await onSavePreset(presetName);
            setPresetName('');
        } catch (error) {
            logger.error('[PlaybackPresets] Failed to save preset', { error });
        } finally {
            setIsSaving(false);
        }
    }, [presetName, onSavePreset]);

    const handleLoadPreset = useCallback(
        async (presetId: string) => {
            try {
                setLoadingPresetId(presetId);
                await onLoadPreset(presetId);
            } catch (error) {
                logger.error('[PlaybackPresets] Failed to load preset', { presetId, error });
            } finally {
                setLoadingPresetId(null);
            }
        },
        [onLoadPreset]
    );

    const handleDeletePreset = useCallback(
        async (presetId: string) => {
            try {
                await onDeletePreset(presetId);
            } catch (error) {
                logger.error('[PlaybackPresets] Failed to delete preset', { presetId, error });
            }
        },
        [onDeletePreset]
    );

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent style={{ maxWidth: '500px' }}>
                <Box style={{ paddingBottom: vars.spacing['4'], borderBottom: `1px solid rgba(255, 255, 255, 0.1)` }}>
                    <DialogTitle>Playback Presets</DialogTitle>
                </Box>

                <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['4'] }}>
                    {/* Save New Preset Section */}
                    <Box
                        style={{
                            padding: vars.spacing['4'],
                            backgroundColor: `rgba(255, 255, 255, 0.05)`,
                            borderRadius: vars.spacing['2']
                        }}
                    >
                        <Text size="sm" weight="bold" style={{ marginBottom: vars.spacing['2'] }}>
                            Save Current Queue
                        </Text>
                        <Flex style={{ gap: vars.spacing['2'], alignItems: 'center' }}>
                            <Input
                                placeholder="Preset name"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                disabled={isSaving}
                                style={{ flex: 1 }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isSaving) {
                                        handleSavePreset();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleSavePreset}
                                disabled={isSaving || !presetName.trim()}
                                style={{ display: 'flex', alignItems: 'center', gap: vars.spacing['2'] }}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                        </Flex>
                    </Box>

                    {/* Saved Presets List */}
                    <Box>
                        <Heading.H4 style={{ marginBottom: vars.spacing['3'] }}>
                            Saved Presets ({presets.length})
                        </Heading.H4>
                        {presets.length === 0 ? (
                            <Text size="sm" color="secondary" style={{ textAlign: 'center', padding: vars.spacing['4'] }}>
                                No presets saved yet
                            </Text>
                        ) : (
                            <Box style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['2'] }}>
                                {presets.map((preset) => (
                                    <div
                                        key={preset.id}
                                        style={{
                                            padding: vars.spacing['3'],
                                            backgroundColor: `rgba(255, 255, 255, 0.03)`,
                                            borderRadius: vars.spacing['1'],
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: `1px solid rgba(255, 255, 255, 0.1)`
                                        }}
                                    >
                                        <Box>
                                            <Text weight="medium" size="sm">
                                                {preset.name}
                                            </Text>
                                            <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
                                                {preset.queueItemCount} items • {formatDate(preset.timestamp)}
                                            </Text>
                                            <Text size="xs" color="secondary" style={{ marginTop: 2 }}>
                                                Shuffle: {preset.shuffleMode} | Repeat: {preset.repeatMode}
                                            </Text>
                                        </Box>
                                        <Flex style={{ gap: vars.spacing['2'] }}>
                                            <Button
                                                size="sm"
                                                onClick={() => handleLoadPreset(preset.id)}
                                                disabled={loadingPresetId !== null}
                                                style={{ display: 'flex', alignItems: 'center', gap: vars.spacing['1'] }}
                                            >
                                                {loadingPresetId === preset.id ? 'Loading...' : 'Load'}
                                            </Button>
                                            <IconButton
                                                size="sm"
                                                onClick={() => handleDeletePreset(preset.id)}
                                                color="neutral"
                                                variant="plain"
                                            >
                                                <TrashIcon width={16} height={16} />
                                            </IconButton>
                                        </Flex>
                                    </div>
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default PlaybackPresets;
