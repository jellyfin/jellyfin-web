import { masterAudioOutput } from 'components/audioEngine/master.logic';
import React, { useState, useEffect } from 'react';
import ButterchurnVisualizer from './Butterchurn';
import FrequencyAnalyzer from './FrequencyAnalyzer';
import { visualizerSettings } from './visualizers.logic';

const Visualizers: React.FC = () => {
    const [isInitialized, setIsInitialized] = useState(!!masterAudioOutput.audioContext);

    useEffect(() => {
        // Poll for audio engine initialization with a 100ms interval
        const checkInterval = setInterval(() => {
            if (masterAudioOutput.audioContext && masterAudioOutput.mixerNode) {
                setIsInitialized(true);
                clearInterval(checkInterval);
            }
        }, 100);

        // Cleanup interval on unmount
        return () => clearInterval(checkInterval);
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
