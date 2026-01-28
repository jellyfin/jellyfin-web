import React, { type ReactElement } from 'react';
import { useFXStore } from 'store/fxStore';
import * as DJStyles from './DJ.css.ts';
import { Fader } from './Fader';
import { EQKnob } from './EQKnob';
import { FXSend } from './FXSend';

interface DJChannelStripProps {
  deck: 'A' | 'B';
  isActive?: boolean;
  disabled?: boolean;
}

/**
 * Professional DJ channel strip with:
 * - Volume fader with peak meter
 * - 3-Band EQ (Low/Mid/High)
 * - FX Sends (FX1 & FX2)
 * - Status indicators
 */
export const DJChannelStrip = React.forwardRef<HTMLDivElement, DJChannelStripProps>(
  ({ deck, isActive = true, disabled = false }, ref): ReactElement => {
    const fxStore = useFXStore();

    // Get deck-specific values
    const gain = deck === 'A' ? fxStore.deckAGain ?? 1 : fxStore.deckBGain ?? 1;
    const fxSend1 = deck === 'A' ? fxStore.deckAFXSend1 ?? 0 : fxStore.deckBFXSend1 ?? 0;
    const fxSend2 = deck === 'A' ? fxStore.deckAFXSend2 ?? 0 : fxStore.deckBFXSend2 ?? 0;

    // Get EQ values (shared across deck for now, could be per-deck)
    const lowEQ = fxStore.eqLow ?? 0;
    const midEQ = fxStore.eqMid ?? 0;
    const highEQ = fxStore.eqHigh ?? 0;

    const settersDeck = deck === 'A' ? {
      gain: fxStore.setDeckAGain,
      fxSend1: fxStore.setDeckAFXSend1,
      fxSend2: fxStore.setDeckAFXSend2,
    } : {
      gain: fxStore.setDeckBGain,
      fxSend1: fxStore.setDeckBFXSend1,
      fxSend2: fxStore.setDeckBFXSend2,
    };

    const handleGainChange = (value: number) => {
      settersDeck.gain(value / 100);
    };

    const handleFXSend1Change = (value: number) => {
      settersDeck.fxSend1(value);
    };

    const handleFXSend2Change = (value: number) => {
      settersDeck.fxSend2(value);
    };

    const handleLowEQChange = (value: number) => {
      fxStore.setEQLow(value);
    };

    const handleMidEQChange = (value: number) => {
      fxStore.setEQMid(value);
    };

    const handleHighEQChange = (value: number) => {
      fxStore.setEQHigh(value);
    };

    return (
      <div ref={ref} className={DJStyles.channelStrip} data-deck={deck}>
        {/* Channel Label */}
        <div className={DJStyles.channelLabel}>Deck {deck}</div>

        {/* Volume Fader Section */}
        <Fader
          label="VOLUME"
          value={gain * 100}
          onChange={handleGainChange}
          min={0}
          max={100}
          step={1}
          disabled={disabled}
          showPeakMeter={true}
          peakLevel={gain}
        />

        {/* EQ Section */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
          <EQKnob label="Low" value={lowEQ} onChange={handleLowEQChange} disabled={disabled} />
          <EQKnob label="Mid" value={midEQ} onChange={handleMidEQChange} disabled={disabled} />
          <EQKnob label="High" value={highEQ} onChange={handleHighEQChange} disabled={disabled} />
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#424854',
            margin: '8px 0'
          }}
        />

        {/* FX Sends */}
        <FXSend
          number={1}
          value={fxSend1}
          onChange={handleFXSend1Change}
          disabled={disabled}
        />
        <FXSend
          number={2}
          value={fxSend2}
          onChange={handleFXSend2Change}
          disabled={disabled}
        />

        {/* Status Indicator */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '8px',
            fontSize: '0.65rem',
            color: '#888'
          }}
        >
          <div
            className={isActive ? `${DJStyles.statusLed} ${DJStyles.statusLed_active}` : DJStyles.statusLed}
            title={isActive ? 'Active' : 'Inactive'}
          />
          <span>{isActive ? 'ACTIVE' : 'MUTE'}</span>
        </div>
      </div>
    );
  }
);

DJChannelStrip.displayName = 'DJChannelStrip';
