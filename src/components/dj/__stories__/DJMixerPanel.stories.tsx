import type { Meta, StoryObj } from '@storybook/react';
import { DJMixerPanel } from '../DJMixerPanel';
import { useFXStore } from 'store/fxStore';

const meta = {
  title: 'DJ Components/DJMixerPanel',
  component: DJMixerPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    disabled: false,
  },
} satisfies Meta<typeof DJMixerPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default mixer state with both decks at neutral
 */
export const Default: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(1);
    store.setEQLow(0);
    store.setEQMid(0);
    store.setEQHigh(0);
    store.setCrossfaderPosition(0.5);
    store.setMasterGain(0.8);

    return <DJMixerPanel />;
  },
};

/**
 * Deck A active with low EQ boost
 */
export const DeckAActive: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(0.5);
    store.setEQLow(3);
    store.setEQMid(0);
    store.setEQHigh(-1);
    store.setCrossfaderPosition(0.1);
    store.setMasterGain(0.9);

    return <DJMixerPanel />;
  },
};

/**
 * Deck B active with high EQ cut
 */
export const DeckBActive: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(0.6);
    store.setDeckBGain(1);
    store.setEQLow(-2);
    store.setEQMid(-1);
    store.setEQHigh(4);
    store.setCrossfaderPosition(0.9);
    store.setMasterGain(0.85);

    return <DJMixerPanel />;
  },
};

/**
 * Crossfader in center position
 */
export const CrossfaderCenter: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(1);
    store.setEQLow(0);
    store.setEQMid(0);
    store.setEQHigh(0);
    store.setCrossfaderPosition(0.5);
    store.setMasterGain(0.75);
    store.setCrossfaderCurve('linear');

    return <DJMixerPanel />;
  },
};

/**
 * Logarithmic crossfader curve
 */
export const LogarithmicCurve: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(1);
    store.setEQLow(0);
    store.setEQMid(0);
    store.setEQHigh(0);
    store.setCrossfaderPosition(0.5);
    store.setMasterGain(0.8);
    store.setCrossfaderCurve('logarithmic');

    return <DJMixerPanel />;
  },
};

/**
 * Scalecut crossfader curve
 */
export const ScalecutCurve: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(1);
    store.setEQLow(0);
    store.setEQMid(0);
    store.setEQHigh(0);
    store.setCrossfaderPosition(0.5);
    store.setMasterGain(0.8);
    store.setCrossfaderCurve('scalecut');

    return <DJMixerPanel />;
  },
};

/**
 * Master volume at maximum
 */
export const MasterMaxVolume: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(1);
    store.setEQLow(0);
    store.setEQMid(0);
    store.setEQHigh(0);
    store.setCrossfaderPosition(0.5);
    store.setMasterGain(1);

    return <DJMixerPanel />;
  },
};

/**
 * Master volume at minimum
 */
export const MasterMinVolume: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(1);
    store.setEQLow(0);
    store.setEQMid(0);
    store.setEQHigh(0);
    store.setCrossfaderPosition(0.5);
    store.setMasterGain(0.2);

    return <DJMixerPanel />;
  },
};

/**
 * FX sends active on both decks
 */
export const FXSendsActive: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(1);
    store.setDeckAFXSend1(0.7);
    store.setDeckAFXSend2(0.4);
    store.setDeckBFXSend1(0.5);
    store.setDeckBFXSend2(0.8);
    store.setEQLow(0);
    store.setEQMid(0);
    store.setEQHigh(0);
    store.setCrossfaderPosition(0.5);
    store.setMasterGain(0.8);

    return <DJMixerPanel />;
  },
};

/**
 * Full EQ sweep on Deck A
 */
export const DeckAEQSweep: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(0.7);
    store.setEQLow(6);
    store.setEQMid(0);
    store.setEQHigh(-6);
    store.setCrossfaderPosition(0.2);
    store.setMasterGain(0.8);

    return <DJMixerPanel />;
  },
};

/**
 * Full EQ sweep on Deck B
 */
export const DeckBEQSweep: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(0.7);
    store.setDeckBGain(1);
    store.setEQLow(-6);
    store.setEQMid(0);
    store.setEQHigh(6);
    store.setCrossfaderPosition(0.8);
    store.setMasterGain(0.8);

    return <DJMixerPanel />;
  },
};

/**
 * Disabled state - mixer controls cannot be interacted with
 */
export const Disabled: Story = {
  render: () => {
    const store = useFXStore.getState();
    store.setDeckAGain(1);
    store.setDeckBGain(1);
    store.setEQLow(0);
    store.setEQMid(0);
    store.setEQHigh(0);
    store.setCrossfaderPosition(0.5);
    store.setMasterGain(0.8);

    return <DJMixerPanel disabled />;
  },
};
