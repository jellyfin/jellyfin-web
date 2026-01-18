import { masterAudioOutput } from 'components/audioEngine/master.logic';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { visualizerSettings } from './visualizers.logic';

// Lazy load visualizer components to reduce initial bundle size
const ButterchurnVisualizer = lazy(() =>
    import('./Butterchurn').catch(error => {
        console.error('[Visualizers] Failed to load Butterchurn visualizer:', error);
        // Return a fallback component
        return { default: () => <div>Visualizer unavailable</div> };
    })
);

const FrequencyAnalyzer = lazy(() =>
    import('./FrequencyAnalyzer').catch(error => {
        console.error('[Visualizers] Failed to load Frequency Analyzer:', error);
        // Return a fallback component
        return { default: () => <div>Frequency analyzer unavailable</div> };
    })
);

// Loading fallback component
const VisualizerLoading = () => (
    <div
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            zIndex: 9999
        }}
    >
        Loading visualizer...
    </div>
);

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
        <Suspense fallback={<VisualizerLoading />}>
            {frequencyAnalyzer.enabled && (<FrequencyAnalyzer />)}
            {butterchurn.enabled && (<ButterchurnVisualizer />)}
        </Suspense>
    );
};

export default Visualizers;
