import React, { lazy, Suspense } from 'react';

import { masterAudioOutput } from 'components/audioEngine/master.logic';
import { logger } from 'utils/logger';
import { useAudioStore } from '../../store/audioStore';
import { usePreferencesStore } from '../../store/preferencesStore';

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

const WaveformVisualizer = lazy(() => import('./WaveSurfer').then(m => ({ default: m.WaveSurferVisualizer })));

// Loading fallback component
function VisualizerLoading(): React.ReactElement {
    return (
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
}

export function Visualizers(): React.ReactElement | null {
    const isReady = useAudioStore(state => state.isReady);
    const enabled = usePreferencesStore(state => state.visualizer.enabled);
    const type = usePreferencesStore(state => state.visualizer.type);
    const showVisualizer = usePreferencesStore(state => state.ui.showVisualizer);

    // Only render if audio engine is ready and visualizer is enabled both globally and in UI
    if (!isReady || !enabled || !showVisualizer || !masterAudioOutput.audioContext || !masterAudioOutput.mixerNode) {
        return null;
    }

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
                {type === 'frequency' && <FrequencyAnalyzer />}
                {type === 'butterchurn' && <ButterchurnVisualizer />}
                {type === 'threed' && <ThreeDimensionVisualizer />}
                {type === 'waveform' && <WaveformVisualizer />}
            </Suspense>
        </div>
    );
}

export default Visualizers;
