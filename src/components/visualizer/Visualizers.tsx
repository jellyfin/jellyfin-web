import { masterAudioOutput } from 'components/audioEngine/master.logic';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { visualizerSettings } from './visualizers.logic';
import { logger } from 'utils/logger';

// Lazy load visualizer components to reduce initial bundle size
const ButterchurnVisualizer = lazy(() =>
    import('./Butterchurn').catch(error => {
        logger.error('[Visualizers] Failed to load Butterchurn visualizer', { component: 'Visualizers' }, error);
        return { default: () => <div>Visualizer unavailable</div> };
    })
);

const FrequencyAnalyzer = lazy(() =>
    import('./FrequencyAnalyzer').catch(error => {
        logger.error('[Visualizers] Failed to load Frequency Analyzer', { component: 'Visualizers' }, error);
        return { default: () => <div>Frequency analyzer unavailable</div> };
    })
);

const ThreeDimensionVisualizer = lazy(() =>
    import('./ThreeDimensionVisualizer').catch(error => {
        logger.error('[Visualizers] Failed to load 3D Visualizer', { component: 'Visualizers' }, error);
        return { default: () => <div>3D Visualizer unavailable</div> };
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
    const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Poll for audio engine initialization with a 100ms interval
        // Add a 10 second timeout to prevent infinite polling
        const checkInterval = setInterval(() => {
            if (masterAudioOutput.audioContext && masterAudioOutput.mixerNode) {
                setIsInitialized(true);
                clearInterval(checkInterval);
                if (checkTimeoutRef.current) {
                    clearTimeout(checkTimeoutRef.current);
                }
            }
        }, 100);

        // Timeout to stop checking after 10 seconds
        checkTimeoutRef.current = setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);

        // Also poll for settings changes
        const settingsInterval = setInterval(() => {
            if (settingsRef.current !== visualizerSettings
                || settingsRef.current.butterchurn?.enabled !== visualizerSettings.butterchurn?.enabled
                || settingsRef.current.threeJs?.enabled !== visualizerSettings.threeJs?.enabled
                || settingsRef.current.frequencyAnalyzer?.enabled !== visualizerSettings.frequencyAnalyzer?.enabled) {
                settingsRef.current = visualizerSettings;
                forceUpdate(prev => prev + 1);
            }
        }, 500);

        // Cleanup intervals on unmount
        return () => {
            clearInterval(checkInterval);
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
            }
            clearInterval(settingsInterval);
        };
    }, []);

    if (!isInitialized || !masterAudioOutput.audioContext || !masterAudioOutput.mixerNode) {
        return null;
    }

    const { butterchurn, frequencyAnalyzer, threeJs } = visualizerSettings;

    return (
        <div 
            id="visualizerContainer"
            style={{
                pointerEvents: 'none',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1
            }}
        >
            <Suspense fallback={<VisualizerLoading />}>
                {frequencyAnalyzer.enabled && (<FrequencyAnalyzer />)}
                {butterchurn.enabled && (<ButterchurnVisualizer />)}
                {threeJs?.enabled && (<ThreeDimensionVisualizer />)}
            </Suspense>
        </div>
    );
};

export default Visualizers;
