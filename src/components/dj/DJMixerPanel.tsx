import React, { type ReactElement } from 'react';
import { useFXStore } from 'store/fxStore';
import { DJChannelStrip } from './DJChannelStrip';
import { DJMasterFader } from './DJMasterFader';
import * as DJStyles from './DJ.css.ts';

interface DJMixerPanelProps {
  disabled?: boolean;
}

/**
 * Complete DJ mixer panel combining:
 * - Deck A channel strip (left)
 * - Master fader with crossfader (center)
 * - Deck B channel strip (right)
 *
 * Professional DJ mixing interface with all controls for:
 * - Volume mixing between two decks
 * - 3-Band EQ on each deck
 * - FX send routing
 * - Master output control
 * - Crossfading between decks
 */
export const DJMixerPanel = React.forwardRef<HTMLDivElement, DJMixerPanelProps>(
  ({ disabled = false }, ref): ReactElement => {
    const fxStore = useFXStore();

    // Determine active deck based on crossfader position
    // 0 = fully on Deck A, 1 = fully on Deck B, 0.5 = center
    const isAActive = fxStore.crossfaderPosition < 0.5;
    const isBActive = fxStore.crossfaderPosition > 0.5;

    return (
      <div ref={ref} className={DJStyles.djTheme}>
        <div className={DJStyles.djMixer}>
          {/* Deck A Channel Strip */}
          <DJChannelStrip
            deck="A"
            isActive={isAActive}
            disabled={disabled}
          />

          {/* Master Control Section (Center) */}
          <DJMasterFader disabled={disabled} />

          {/* Deck B Channel Strip */}
          <DJChannelStrip
            deck="B"
            isActive={isBActive}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }
);

DJMixerPanel.displayName = 'DJMixerPanel';
