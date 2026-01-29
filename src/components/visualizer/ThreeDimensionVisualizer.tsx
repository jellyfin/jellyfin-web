import { OrbitControls, Sphere, Stars } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { masterAudioOutput } from 'components/audioEngine/master.logic';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface AudioReactiveSceneProps {
    analyser: AnalyserNode;
}

const AudioReactiveSphere: React.FC<AudioReactiveSceneProps> = ({ analyser }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const dataArray = useMemo(() => new Uint8Array(analyser.frequencyBinCount), [analyser]);

    // Smooth out the scaling
    const targetScale = useRef(1);
    const currentScale = useRef(1);

    // Throttle audio sampling to every 3 frames (~20 FPS audio sampling vs 60 FPS rendering)
    const frameCountRef = useRef(0);
    const audioSampleInterval = 3; // Sample every 3 frames (60 FPS / 3 = 20 FPS sampling)

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Only update audio data every N frames for performance
        if (frameCountRef.current % audioSampleInterval === 0) {
            analyser.getByteFrequencyData(dataArray);
        }
        frameCountRef.current++;

        // Calculate average bass (low frequencies)
        // Bin count is usually 1024 or 2048. 44.1kHz / 2 = 22kHz.
        // Bass is ~20-200Hz.
        // If fftSize is 2048, bin width is ~21Hz.
        // So bins 0-10 are bass.
        let bassSum = 0;
        const bassBinCount = 10;
        for (let i = 0; i < bassBinCount; i++) {
            bassSum += dataArray[i];
        }
        const bassAvg = bassSum / bassBinCount;

        // Calculate target scale (1.0 to 2.5)
        targetScale.current = 1 + (bassAvg / 255) * 1.5;

        // Linear interpolation for smoothness - slower interpolation compensates for less frequent samples
        const smoothing = 7 * delta; // Slightly reduced to compensate for less frequent updates
        currentScale.current += (targetScale.current - currentScale.current) * smoothing;

        meshRef.current.scale.set(currentScale.current, currentScale.current, currentScale.current);

        // Rotate slowly
        meshRef.current.rotation.x += delta * 0.2;
        meshRef.current.rotation.y += delta * 0.3;

        // Change color based on bass
        const hue = (bassAvg / 255) * 0.2 + 0.5; // Blue to purple range
        if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
            meshRef.current.material.color.setHSL(hue, 0.8, 0.5);
            meshRef.current.material.emissive.setHSL(hue, 0.8, 0.2);
        }
    });

    return (
        <Sphere ref={meshRef} args={[1.5, 128, 128]} position={[0, 0, 0]}>
            <meshStandardMaterial
                color="#8800ff"
                roughness={0.1}
                metalness={0.8}
                wireframe={true}
            />
        </Sphere>
    );
};

const ThreeDimensionVisualizer: React.FC = () => {
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

    useEffect(() => {
        const { audioContext, mixerNode } = masterAudioOutput;

        if (!audioContext || !mixerNode) {
            console.warn('AudioContext or MixerNode not available for 3D Visualizer');
            return;
        }

        const newAnalyser = audioContext.createAnalyser();
        newAnalyser.fftSize = 2048;
        newAnalyser.smoothingTimeConstant = 0.8;

        try {
            mixerNode.connect(newAnalyser);
            setAnalyser(newAnalyser);
        } catch (error) {
            console.error('Failed to connect analyser:', error);
        }

        return () => {
            newAnalyser.disconnect();
        };
    }, []);

    if (!analyser) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0
            }}
        >
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Stars
                    radius={100}
                    depth={50}
                    count={5000}
                    factor={4}
                    saturation={0}
                    fade
                    speed={1}
                />
                <AudioReactiveSphere analyser={analyser} />
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
};

export default ThreeDimensionVisualizer;
