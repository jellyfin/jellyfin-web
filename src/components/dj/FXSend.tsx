import React, { useRef, useState, useCallback, type ReactElement } from 'react';
import * as DJStyles from './DJ.css';

interface FXSendProps {
  number: 1 | 2;
  value: number; // 0-1
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * FX Send level slider component
 */
export const FXSend = React.forwardRef<HTMLDivElement, FXSendProps>(
  ({ number, value, onChange, disabled = false }, ref): ReactElement => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const calculateValue = useCallback(
      (clientX: number) => {
        if (!sliderRef.current) return value;

        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = (clientX - rect.left) / rect.width;
        const newValue = Math.max(0, Math.min(1, percentage));

        return Math.round(newValue * 100) / 100;
      },
      [value]
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (disabled) return;
        setIsDragging(true);
        const newValue = calculateValue(e.clientX);
        onChange(newValue);
      },
      [disabled, calculateValue, onChange]
    );

    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        const newValue = calculateValue(e.clientX);
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

    const percentage = value * 100;

    return (
      <div ref={ref} className={DJStyles.fxSend}>
        <div className={DJStyles.fxSendLabel}>FX {number}</div>

        <div className={DJStyles.fxSendSlider} ref={sliderRef} onMouseDown={handleMouseDown}>
          <div
            className={DJStyles.fxSendThumb}
            style={{
              left: `calc(${percentage}% - 6px)`,
              pointerEvents: isDragging ? 'none' : 'auto'
            }}
          />
        </div>

        <div style={{ fontSize: '0.65rem', color: '#888', fontFamily: 'monospace' }}>
          {Math.round(percentage)}%
        </div>
      </div>
    );
  }
);

FXSend.displayName = 'FXSend';
