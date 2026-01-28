import React, { useRef, useState, useCallback, type ReactElement } from 'react';
import * as DJStyles from './DJ.css.ts';

interface EQKnobProps {
  label: 'Low' | 'Mid' | 'High';
  value: number; // -6 to +6 dB
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * 3-Band EQ knob component
 * Range: -6 to +6 dB
 */
export const EQKnob = React.forwardRef<HTMLDivElement, EQKnobProps>(
  ({ label, value, onChange, disabled = false }, ref): ReactElement => {
    const knobRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const calculateValue = useCallback(
      (clientY: number, clientX: number) => {
        if (!knobRef.current) return value;

        const rect = knobRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = clientX - centerX;
        const deltaY = centerY - clientY;
        const angle = Math.atan2(deltaY, deltaX);

        // Map angle to value (-6 to +6)
        const normalizedAngle = angle / Math.PI;
        const newValue = Math.max(-6, Math.min(6, normalizedAngle * 6));

        return Math.round(newValue * 2) / 2; // 0.5 dB steps
      },
      [value]
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (disabled) return;
        setIsDragging(true);
        const newValue = calculateValue(e.clientY, e.clientX);
        onChange(newValue);
      },
      [disabled, calculateValue, onChange]
    );

    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        const newValue = calculateValue(e.clientY, e.clientX);
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

    // Calculate rotation: -6dB = -135°, 0dB = 0°, +6dB = +135°
    const rotation = (value / 6) * 135;

    return (
      <div ref={ref} className={DJStyles.eqKnob}>
        <div className={DJStyles.knobLabel}>{label}</div>

        <div ref={knobRef} className={DJStyles.knobVisual} onMouseDown={handleMouseDown}>
          <div
            className={DJStyles.knobIndicator}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.05s linear'
            }}
          />
        </div>

        <div className={DJStyles.knobValue}>{value > 0 ? '+' : ''}{value.toFixed(1)} dB</div>
      </div>
    );
  }
);

EQKnob.displayName = 'EQKnob';
