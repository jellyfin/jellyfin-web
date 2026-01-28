import React, { useRef, useState, useCallback, type ReactElement } from 'react';
import * as DJStyles from './DJ.css';

interface FaderProps {
  label: string;
  value: number; // 0-1
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showPeakMeter?: boolean;
  peakLevel?: number; // 0-1 for visual feedback
}

/**
 * Professional vertical fader component for DJ mixer
 */
export const Fader = React.forwardRef<HTMLDivElement, FaderProps>(
  (
    {
      label,
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      showPeakMeter = true,
      peakLevel = 0
    },
    ref
  ): ReactElement => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const calculateValue = useCallback(
      (clientY: number) => {
        if (!trackRef.current) return value;

        const rect = trackRef.current.getBoundingClientRect();
        const percentage = 1 - (clientY - rect.top) / rect.height;
        const newValue = Math.max(min, Math.min(max, percentage * (max - min) + min));

        return Math.round(newValue / step) * step;
      },
      [min, max, step, value]
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (disabled) return;
        setIsDragging(true);
        const newValue = calculateValue(e.clientY);
        onChange(newValue);
      },
      [disabled, calculateValue, onChange]
    );

    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        const newValue = calculateValue(e.clientY);
        onChange(newValue);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, calculateValue, onChange]);

    const percentage = ((value - min) / (max - min)) * 100;
    const thumbPosition = 100 - percentage; // Inverted for vertical slider

    // Generate peak meter bars
    const meterBars = Array.from({ length: 12 }).map((_, i) => {
      const barThreshold = (i / 12) * 100;
      const isActive = barThreshold < (peakLevel * 100);
      const isDanger = barThreshold > 85;
      const isWarning = barThreshold > 70 && barThreshold <= 85;

      return (
        <div
          key={i}
          className={`${DJStyles.meterBar} ${isWarning ? DJStyles.meterBar_warning : ''} ${isDanger ? DJStyles.meterBar_danger : ''}`}
          style={{
            height: isActive ? `${4 + (i * 2)}px` : '4px',
            opacity: isActive ? 1 : 0.2
          }}
        />
      );
    });

    return (
      <div ref={ref} className={DJStyles.faderContainer}>
        <div className={DJStyles.infoText}>{label}</div>

        <div className={DJStyles.faderTrack} ref={trackRef} onMouseDown={handleMouseDown}>
          <div
            className={DJStyles.faderThumb}
            style={{
              top: `calc(${thumbPosition}% - 6px)`,
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
          />
        </div>

        {showPeakMeter && <div className={DJStyles.peakMeter}>{meterBars}</div>}

        <div className={DJStyles.readout}>{Math.round(value)}%</div>
      </div>
    );
  }
);

Fader.displayName = 'Fader';
