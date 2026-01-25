import React, { useEffect, useState } from 'react';
import { Box, Flex } from 'ui-primitives/Box';
import { Progress } from 'ui-primitives/Progress';
import { vars } from 'styles/tokens.css';
import { SpeakerLoudIcon, SpeakerOffIcon, SunIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferencesStore } from '../../../store';
import * as styles from './OSDOverlay.css';

type OSDType = 'volume' | 'brightness' | null;

export const OSDOverlay: React.FC = () => {
    const volume = usePreferencesStore(state => state.audio.volume);
    const muted = usePreferencesStore(state => state.audio.muted);
    const [brightness, setBrightness] = useState(100); // Managed locally for now or move to store

    const [activeOSD, setActiveOSD] = useState<OSDType>(null);
    const [isVisible, setIsVisible] = useState(false);

    let hideTimeout: ReturnType<typeof setTimeout>;
    const triggerShow = () => {
        setIsVisible(true);
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => setIsVisible(false), 3000);
    };

    useEffect(() => {
        // Show volume OSD on volume change
        const unsubVolume = usePreferencesStore.subscribe(
            state => state.audio.volume,
            () => {
                setActiveOSD('volume');
                triggerShow();
            }
        );

        const unsubMuted = usePreferencesStore.subscribe(
            state => state.audio.muted,
            () => {
                setActiveOSD('volume');
                triggerShow();
            }
        );

        return () => {
            unsubVolume();
            unsubMuted();
        };
    }, [triggerShow]);

    const getVolumeIcon = () => {

    const getVolumeIcon = () => {
        if (muted || volume === 0) return <SpeakerOffIcon style={{ fontSize: 40 }} />;
        return <SpeakerLoudIcon style={{ fontSize: 40 }} />;
    };

    const getBrightnessIcon = () => {
        const opacity = brightness >= 80 ? 1 : brightness >= 30 ? 0.75 : 0.5;
        return <SunIcon style={{ fontSize: 40, opacity }} />;
    };

    return (
        <AnimatePresence>
            {isVisible && activeOSD && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    style={{
                        position: 'fixed',
                        top: '10%',
                        right: '5%',
                        zIndex: 10000,
                        padding: vars.spacing.md,
                        borderRadius: vars.borderRadius.md,
                        minWidth: 120,
                        boxShadow: vars.shadows.lg,
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }}
                >
                    <Flex direction="column" align="center" gap={vars.spacing.md}>
                        {activeOSD === 'volume' ? getVolumeIcon() : getBrightnessIcon()}
                        <Progress
                            value={activeOSD === 'volume' ? volume : brightness}
                            className={activeOSD === 'brightness' ? styles.warningProgress : undefined}
                        style={{ width: '100%' }}
                    />
                </Flex>
                </motion.div>
                </Box>
            )}
        </AnimatePresence>
    );
};
