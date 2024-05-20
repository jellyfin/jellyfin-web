import { masterAudioOutput } from 'components/audioEngine/master.logic';
import React from 'react';
import ButterchurnVisualizer from './Butterchurn';
import FrequencyAnalyzer from './FrequencyAnalyzer';
import { visualizerSettings } from './visualizers.logic';

const Visualizers: React.FC = () => {
    const audioContext = masterAudioOutput.audioContext;
    const mixerNode = masterAudioOutput.mixerNode;

    if (!audioContext || !mixerNode) return;
    const { butterchurn, frequencyAnalyzer } = visualizerSettings;

    return (
        <>
            {frequencyAnalyzer.enabled && (<FrequencyAnalyzer />)}
            {butterchurn.enabled && (<ButterchurnVisualizer />)}
        </>
    );
};

export default Visualizers;
