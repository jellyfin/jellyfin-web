import { createVar, style } from '@vanilla-extract/css';
import { vars } from 'styles/tokens.css.ts';

// DJ-specific color variables
export const djColorActive = createVar();
export const djColorInactive = createVar();
export const djColorAccent = createVar();
export const djColorWarning = createVar();
export const djColorDanger = createVar();

// Base DJ container with color context
export const djTheme = style({
    vars: {
        [djColorActive]: '#1ED24B', // Everforest green for active
        [djColorInactive]: '#424854', // Everforest gray
        [djColorAccent]: '#7FBBB3', // Everforest blue
        [djColorWarning]: '#DBBC7F', // Everforest orange
        [djColorDanger]: '#E67E80' // Everforest red
    }
});

// DJ mixer base layout
export const djMixer = style({
    display: 'flex',
    backgroundColor: vars.colors.background,
    borderRadius: vars.borderRadius.md,
    padding: vars.spacing['4'],
    gap: vars.spacing['4'],
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
});

// Channel strip container
export const channelStrip = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['3'],
    padding: vars.spacing['3'],
    backgroundColor: '#2D2D2D', // Darker background for channel
    borderRadius: vars.borderRadius.md,
    border: `1px solid ${vars.colors.surfaceVariant}`,
    minWidth: '140px',
    flex: 1
});

// Fader (vertical slider)
export const faderContainer = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['2'],
    alignItems: 'center',
    flex: 1
});

export const faderTrack = style({
    height: '180px',
    width: '24px',
    backgroundColor: '#1A1A1A',
    borderRadius: '4px',
    position: 'relative',
    border: `1px solid ${djColorInactive}`,
    cursor: 'pointer',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
});

export const faderThumb = style({
    position: 'absolute',
    width: '28px',
    height: '12px',
    left: '-2px',
    backgroundColor: djColorActive,
    borderRadius: '2px',
    cursor: 'grab',
    boxShadow: `0 2px 6px rgba(30, 210, 75, 0.4)`,
    transition: 'box-shadow 0.1s ease-out',
    ':active': {
        cursor: 'grabbing',
        boxShadow: `0 4px 12px rgba(30, 210, 75, 0.6)`
    }
});

// Digital readout
export const readout = style({
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    backgroundColor: '#000',
    color: djColorActive,
    padding: `${vars.spacing['1']} ${vars.spacing['2']}`,
    borderRadius: '2px',
    minWidth: '50px',
    textAlign: 'center',
    border: `1px solid ${djColorInactive}`,
    fontWeight: 'bold',
    letterSpacing: '0.05em'
});

// EQ knob container
export const eqKnob = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['1'],
    alignItems: 'center'
});

export const knobLabel = style({
    fontSize: '0.65rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: vars.colors.text
});

export const knobVisual = style({
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#1A1A1A',
    border: `2px solid ${djColorInactive}`,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    ':hover': {
        borderColor: djColorAccent
    }
});

export const knobIndicator = style({
    position: 'absolute',
    width: '2px',
    height: '10px',
    backgroundColor: djColorActive,
    top: '3px',
    borderRadius: '1px',
    transformOrigin: 'center 13px',
    transition: 'transform 0.05s linear'
});

export const knobValue = style({
    fontSize: '0.65rem',
    fontFamily: 'monospace',
    color: djColorActive,
    marginTop: vars.spacing['1'],
    minWidth: '35px',
    textAlign: 'center',
    fontWeight: 'bold'
});

// FX send slider
export const fxSend = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['1'],
    alignItems: 'center'
});

export const fxSendLabel = style({
    fontSize: '0.65rem',
    fontWeight: 'bold',
    color: vars.colors.text,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
});

export const fxSendSlider = style({
    width: '100%',
    height: '4px',
    backgroundColor: '#1A1A1A',
    borderRadius: '2px',
    cursor: 'pointer',
    position: 'relative',
    border: `1px solid ${djColorInactive}`
});

export const fxSendThumb = style({
    position: 'absolute',
    width: '12px',
    height: '16px',
    top: '-6px',
    backgroundColor: djColorAccent,
    borderRadius: '2px',
    cursor: 'grab',
    boxShadow: `0 2px 4px rgba(127, 187, 179, 0.3)`,
    ':active': {
        cursor: 'grabbing',
        boxShadow: `0 2px 6px rgba(127, 187, 179, 0.5)`
    }
});

// Peak meter
export const peakMeter = style({
    display: 'flex',
    gap: vars.spacing['1'],
    alignItems: 'flex-end',
    height: '60px',
    padding: `${vars.spacing['2']} 0`
});

export const meterBar = style({
    width: '3px',
    minHeight: '4px',
    borderRadius: '1px',
    backgroundColor: djColorActive,
    transition: 'background-color 0.1s, height 0.05s ease-out',
    ':hover': {
        backgroundColor: djColorWarning
    }
});

export const meterBar_warning = style({
    backgroundColor: djColorWarning
});

export const meterBar_danger = style({
    backgroundColor: djColorDanger
});

// Status indicators
export const statusLed = style({
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: djColorInactive,
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.5)',
    transition: 'box-shadow 0.1s'
});

export const statusLed_active = style({
    backgroundColor: djColorActive,
    boxShadow: `0 0 6px ${djColorActive}`
});

// Toggle button (for notch, PFL, etc)
export const toggleButton = style({
    padding: `${vars.spacing['1']} ${vars.spacing['2']}`,
    backgroundColor: '#1A1A1A',
    border: `1px solid ${djColorInactive}`,
    borderRadius: '4px',
    color: vars.colors.text,
    fontSize: '0.75rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.15s ease-out',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    ':hover': {
        borderColor: djColorAccent
    },
    ':active': {
        backgroundColor: djColorAccent,
        color: '#000',
        fontWeight: 'bold'
    }
});

// Crossfader
export const crossfader = style({
    display: 'flex',
    flexDirection: 'column',
    gap: vars.spacing['2'],
    alignItems: 'center',
    padding: `${vars.spacing['4']} ${vars.spacing['3']}`,
    flex: 1
});

export const crossfaderTrack = style({
    width: '100%',
    height: '28px',
    maxWidth: '300px',
    backgroundColor: '#1A1A1A',
    borderRadius: '4px',
    position: 'relative',
    border: `1px solid ${djColorInactive}`,
    cursor: 'pointer',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
});

export const crossfaderThumb = style({
    position: 'absolute',
    width: '16px',
    height: '32px',
    top: '-2px',
    backgroundColor: djColorActive,
    borderRadius: '2px',
    cursor: 'grab',
    boxShadow: `0 2px 6px rgba(30, 210, 75, 0.4)`,
    transition: 'box-shadow 0.1s ease-out',
    ':active': {
        cursor: 'grabbing',
        boxShadow: `0 4px 12px rgba(30, 210, 75, 0.6)`
    }
});

// Channel label
export const channelLabel = style({
    fontSize: '0.85rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: djColorAccent,
    textAlign: 'center',
    padding: vars.spacing['2'],
    borderBottom: `1px solid ${djColorInactive}`,
    width: '100%',
    marginBottom: vars.spacing['2']
});

// Info display
export const infoText = style({
    fontSize: '0.65rem',
    color: vars.colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'monospace'
});
