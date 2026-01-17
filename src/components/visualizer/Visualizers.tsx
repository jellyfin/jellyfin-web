import { masterAudioOutput } from 'components/audioEngine/master.logic';
import React, { useState, useEffect, useRef } from 'react';
import ButterchurnVisualizer from './Butterchurn';
import FrequencyAnalyzer from './FrequencyAnalyzer';
import { visualizerSettings } from './visualizers.logic';

const Visualizers: React.FC = () => {
    const [isInitialized, setIsInitialized] = useState(!!masterAudioOutput.audioContext);
    const [, forceUpdate] = useState(0);
    const settingsRef = useRef(visualizerSettings);

    useEffect(() => {
        // Poll for audio engine initialization with a 100ms interval
        const checkInterval = setInterval(() => {
            if (masterAudioOutput.audioContext && masterAudioOutput.mixerNode) {
                setIsInitialized(true);
                clearInterval(checkInterval);
            }
        }, 100);

        // Also poll for settings changes
        const settingsInterval = setInterval(() => {
            if (settingsRef.current !== visualizerSettings
                || settingsRef.current.butterchurn?.enabled !== visualizerSettings.butterchurn?.enabled
                || settingsRef.current.frequencyAnalyzer?.enabled !== visualizerSettings.frequencyAnalyzer?.enabled) {
                settingsRef.current = visualizerSettings;
                forceUpdate(prev => prev + 1);
            }
        }, 500);

        // Cleanup intervals on unmount
        return () => {
            clearInterval(checkInterval);
            clearInterval(settingsInterval);
        };
    }, []);

    if (!isInitialized || !masterAudioOutput.audioContext || !masterAudioOutput.mixerNode) {
        return null;
    }

    const { butterchurn, frequencyAnalyzer } = visualizerSettings;

    return (
        <>
            {frequencyAnalyzer.enabled && (<FrequencyAnalyzer />)}
            {butterchurn.enabled && (<ButterchurnVisualizer />)}
        </>
    );
};

export default Visualizers;
