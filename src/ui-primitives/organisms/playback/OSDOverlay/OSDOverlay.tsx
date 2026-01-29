import { SpeakerLoudIcon, SpeakerOffIcon, SunIcon } from '@radix-ui/react-icons';
import { AnimatePresence, motion } from 'motion/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { usePreferencesStore } from 'store/preferencesStore';
import { vars } from 'styles/tokens.css.ts';
import { Flex, Progress } from 'ui-primitives';

import * as styles from './OSDOverlay.css.ts';

type OSDType = 'volume' | 'brightness' | null;

export function OSDOverlay(): React.ReactElement {
    const volume = usePreferencesStore((state) => state.audio.volume);
    const muted = usePreferencesStore((state) => state.audio.muted);
    const brightness = usePreferencesStore((state) => state.ui.brightness);
    const [activeOSD, setActiveOSD] = useState<OSDType>(null);
    const [isVisible, setIsVisible] = useState(false);

    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerShow = useCallback((type: OSDType = 'volume') => {
        if (type !== null) setActiveOSD(type);
        setIsVisible(true);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 3000);
    }, []);

    const getVolumeIcon = (): React.ReactElement => {
        if (muted || volume === 0) return <SpeakerOffIcon style={{ fontSize: 40 }} />;
        return <SpeakerLoudIcon style={{ fontSize: 40 }} />;
    };

    const getBrightnessIcon = (): React.ReactElement => {
        let opacity = 0.5;
        if (brightness >= 80) {
            opacity = 1;
        } else if (brightness >= 30) {
            opacity = 0.75;
        }
        return <SunIcon style={{ fontSize: 40, opacity }} />;
    };

    useEffect(() => {
        // Show volume OSD on volume change
        const unsubVolume = usePreferencesStore.subscribe(
            (state) => state.audio.volume,
            () => {
                triggerShow('volume');
            },
            { fireImmediately: false }
        );

        // Show muted OSD on mute change
        const unsubMuted = usePreferencesStore.subscribe(
            (state) => state.audio.muted,
            () => {
                triggerShow('volume');
            },
            { fireImmediately: false }
        );

        return () => {
            unsubVolume();
            unsubMuted();
        };
    }, [triggerShow]);

    useEffect(() => {
        // Handle brightness control
        const unsub = usePreferencesStore.subscribe(
            (state) => state.ui.brightness,
            () => {
                triggerShow('brightness');
            },
            { fireImmediately: false }
        );

        return unsub;
    }, [triggerShow]);

    return (
        <AnimatePresence>
            {isVisible && activeOSD !== null && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    style={{
                        position: 'fixed',
                        top: '10%',
                        right: '5%',
                        zIndex: 10000,
                        padding: vars.spacing['5'],
                        borderRadius: vars.borderRadius.md,
                        boxShadow: vars.shadows.lg,
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }}
                >
                    <Flex direction="column" align="center" gap={vars.spacing['5']}>
                        {activeOSD === 'volume' ? getVolumeIcon() : getBrightnessIcon()}
                        <Progress
                            value={activeOSD === 'volume' ? volume : brightness}
                            className={
                                activeOSD === 'brightness' ? styles.warningProgress : undefined
                            }
                            style={{ width: '100%' }}
                        />
                    </Flex>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
