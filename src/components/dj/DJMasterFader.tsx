import React, { type ReactElement, useCallback, useRef, useState } from 'react';
import { useFXStore } from 'store/fxStore';
import * as DJStyles from './DJ.css.ts';

type CrossfadeCurve = 'linear' | 'logarithmic' | 'scalecut';

interface DJMasterFaderProps {
    disabled?: boolean;
}

/**
 * Master fader and crossfader component for DJ mixer
 * Features:
 * - Horizontal crossfader (Deck A ←→ Deck B)
 * - Crossfade curve selection (Linear, Logarithmic, Scalecut)
 * - Master output fader (0-100%)
 * - Visual curve mode indicator
 */
export const DJMasterFader = React.forwardRef<HTMLDivElement, DJMasterFaderProps>(
    ({ disabled = false }, ref): ReactElement => {
        const fxStore = useFXStore();
        const crossfaderRef = useRef<HTMLDivElement>(null);
        const masterFaderRef = useRef<HTMLDivElement>(null);
        const [isDraggingCrossfader, setIsDraggingCrossfader] = useState(false);
        const [isDraggingMaster, setIsDraggingMaster] = useState(false);

        // Crossfader calculation
        const calculateCrossfaderValue = useCallback(
            (clientX: number) => {
                if (!crossfaderRef.current) return fxStore.crossfaderPosition;

                const rect = crossfaderRef.current.getBoundingClientRect();
                const percentage = (clientX - rect.left) / rect.width;
                const newValue = Math.max(0, Math.min(1, percentage));

                return Math.round(newValue * 100) / 100;
            },
            [fxStore.crossfaderPosition]
        );

        // Master fader calculation (vertical)
        const calculateMasterValue = useCallback(
            (clientY: number) => {
                if (!masterFaderRef.current) return fxStore.masterGain;

                const rect = masterFaderRef.current.getBoundingClientRect();
                const percentage = 1 - (clientY - rect.top) / rect.height;
                const newValue = Math.max(0, Math.min(1, percentage));

                return Math.round(newValue * 100) / 100;
            },
            [fxStore.masterGain]
        );

        // Crossfader mouse handlers
        const handleCrossfaderMouseDown = useCallback(
            (e: React.MouseEvent) => {
                if (disabled) return;
                setIsDraggingCrossfader(true);
                const newValue = calculateCrossfaderValue(e.clientX);
                fxStore.setCrossfaderPosition(newValue);
            },
            [disabled, calculateCrossfaderValue, fxStore]
        );

        // Master fader mouse handlers
        const handleMasterMouseDown = useCallback(
            (e: React.MouseEvent) => {
                if (disabled) return;
                setIsDraggingMaster(true);
                const newValue = calculateMasterValue(e.clientY);
                fxStore.setMasterGain(newValue);
            },
            [disabled, calculateMasterValue, fxStore]
        );

        // Crossfader dragging effect
        React.useEffect(() => {
            if (!isDraggingCrossfader) return;

            const handleMouseMove = (e: MouseEvent) => {
                const newValue = calculateCrossfaderValue(e.clientX);
                fxStore.setCrossfaderPosition(newValue);
            };

            const handleMouseUp = () => {
                setIsDraggingCrossfader(false);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }, [isDraggingCrossfader, calculateCrossfaderValue, fxStore]);

        // Master fader dragging effect
        React.useEffect(() => {
            if (!isDraggingMaster) return;

            const handleMouseMove = (e: MouseEvent) => {
                const newValue = calculateMasterValue(e.clientY);
                fxStore.setMasterGain(newValue);
            };

            const handleMouseUp = () => {
                setIsDraggingMaster(false);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }, [isDraggingMaster, calculateMasterValue, fxStore]);

        const crossfaderPercentage = fxStore.crossfaderPosition * 100;
        const masterPercentage = fxStore.masterGain * 100;

        const curves: CrossfadeCurve[] = ['linear', 'logarithmic', 'scalecut'];

        return (
            <div ref={ref} className={DJStyles.crossfader}>
                {/* Crossfader Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                    >
                        Crossfader
                    </div>

                    {/* Crossfader Track */}
                    <div
                        ref={crossfaderRef}
                        className={DJStyles.crossfaderTrack}
                        onMouseDown={handleCrossfaderMouseDown}
                    >
                        <div
                            className={DJStyles.crossfaderThumb}
                            style={{
                                left: `calc(${crossfaderPercentage}% - 8px)`,
                                pointerEvents: isDraggingCrossfader ? 'none' : 'auto'
                            }}
                        />
                    </div>

                    {/* Crossfader Labels */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.65rem',
                            color: '#888'
                        }}
                    >
                        <span>Deck A</span>
                        <span>Deck B</span>
                    </div>

                    {/* Curve Selection */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '4px',
                            justifyContent: 'center',
                            marginTop: '4px'
                        }}
                    >
                        {curves.map((curve) => (
                            <button
                                key={curve}
                                onClick={() => fxStore.setCrossfaderCurve(curve)}
                                disabled={disabled}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor:
                                        fxStore.crossfaderCurve === curve ? '#7FBBB3' : '#1A1A1A',
                                    border: `1px solid ${fxStore.crossfaderCurve === curve ? '#7FBBB3' : '#424854'}`,
                                    borderRadius: '3px',
                                    color: fxStore.crossfaderCurve === curve ? '#000' : '#888',
                                    fontSize: '0.6rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s ease-out',
                                    opacity: disabled ? 0.5 : 1
                                }}
                                title={`${curve.charAt(0).toUpperCase()}${curve.slice(1)} curve`}
                            >
                                {curve === 'logarithmic'
                                    ? 'Log'
                                    : curve === 'scalecut'
                                      ? 'Cut'
                                      : 'Lin'}
                            </button>
                        ))}
                    </div>

                    {/* Position Readout */}
                    <div
                        style={{
                            textAlign: 'center',
                            fontSize: '0.65rem',
                            color: '#888',
                            fontFamily: 'monospace'
                        }}
                    >
                        {Math.round(crossfaderPercentage)}%
                    </div>
                </div>

                {/* Master Fader Section */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        alignItems: 'center',
                        padding: '0 8px'
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                    >
                        Master
                    </div>

                    {/* Master Fader Track */}
                    <div
                        ref={masterFaderRef}
                        className={DJStyles.faderTrack}
                        onMouseDown={handleMasterMouseDown}
                        style={{ height: '140px' }}
                    >
                        <div
                            className={DJStyles.faderThumb}
                            style={{
                                top: `calc(${100 - masterPercentage}% - 6px)`,
                                pointerEvents: isDraggingMaster ? 'none' : 'auto'
                            }}
                        />
                    </div>

                    {/* Master Readout */}
                    <div className={DJStyles.readout}>{Math.round(masterPercentage)}%</div>
                </div>
            </div>
        );
    }
);

DJMasterFader.displayName = 'DJMasterFader';
