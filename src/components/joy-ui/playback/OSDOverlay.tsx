import React, { useEffect, useState } from 'react';
import Sheet from '@mui/joy/Sheet';
import Stack from '@mui/joy/Stack';
import LinearProgress from '@mui/joy/LinearProgress';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import BrightnessHighIcon from '@mui/icons-material/BrightnessHigh';
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium';
import BrightnessLowIcon from '@mui/icons-material/BrightnessLow';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaStore, useSettingsStore } from '../../../store';

type OSDType = 'volume' | 'brightness' | null;

export const OSDOverlay: React.FC = () => {
    const volume = useSettingsStore(state => state.audio.volume);
    const muted = useSettingsStore(state => state.audio.muted);
    const [brightness, setBrightness] = useState(100); // Managed locally for now or move to store
    
    const [activeOSD, setActiveOSD] = useState<OSDType>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show volume OSD on volume change
        const unsubVolume = useSettingsStore.subscribe(
            state => state.audio.volume,
            () => {
                setActiveOSD('volume');
                triggerShow();
            }
        );

        const unsubMuted = useSettingsStore.subscribe(
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
    }, []);

    let hideTimeout: ReturnType<typeof setTimeout>;
    const triggerShow = () => {
        setIsVisible(true);
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => setIsVisible(false), 3000);
    };

    const getVolumeIcon = () => {
        if (muted || volume === 0) return <VolumeOffIcon sx={{ fontSize: 40 }} />;
        return <VolumeUpIcon sx={{ fontSize: 40 }} />;
    };

    const getBrightnessIcon = () => {
        if (brightness >= 80) return <BrightnessHighIcon sx={{ fontSize: 40 }} />;
        if (brightness >= 30) return <BrightnessMediumIcon sx={{ fontSize: 40 }} />;
        return <BrightnessLowIcon sx={{ fontSize: 40 }} />;
    };

    return (
        <AnimatePresence>
            {isVisible && activeOSD && (
                <Sheet
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.9, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    variant="soft"
                    color="neutral"
                    sx={{
                        position: 'fixed',
                        top: '10%',
                        right: '5%',
                        zIndex: 10000,
                        p: 2,
                        borderRadius: 'md',
                        minWidth: 120,
                        boxShadow: 'lg',
                        backdropFilter: 'blur(10px)',
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                    }}
                >
                    <Stack spacing={2} alignItems="center">
                        {activeOSD === 'volume' ? getVolumeIcon() : getBrightnessIcon()}
                        <LinearProgress
                            determinate
                            value={activeOSD === 'volume' ? volume : brightness}
                            color={activeOSD === 'volume' ? 'primary' : 'warning'}
                            sx={{ width: '100%' }}
                        />
                    </Stack>
                </Sheet>
            )}
        </AnimatePresence>
    );
};
