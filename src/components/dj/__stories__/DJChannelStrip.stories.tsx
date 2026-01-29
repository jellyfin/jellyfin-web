import type { Meta, StoryObj } from '@storybook/react';
import { useFXStore } from 'store/fxStore';
import { DJChannelStrip } from '../DJChannelStrip';

const meta = {
    title: 'DJ Components/DJChannelStrip',
    component: DJChannelStrip,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    args: {
        deck: 'A' as const,
        isActive: true,
        disabled: false
    }
} satisfies Meta<typeof DJChannelStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Deck A at neutral settings
 */
export const DeckADefault: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckAGain(1);
        store.setEQLow(0);
        store.setEQMid(0);
        store.setEQHigh(0);
        store.setDeckAFXSend1(0);
        store.setDeckAFXSend2(0);

        return <DJChannelStrip deck="A" isActive={true} />;
    }
};

/**
 * Deck B at neutral settings
 */
export const DeckBDefault: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckBGain(1);
        store.setEQLow(0);
        store.setEQMid(0);
        store.setEQHigh(0);
        store.setDeckBFXSend1(0);
        store.setDeckBFXSend2(0);

        return <DJChannelStrip deck="B" isActive={true} />;
    }
};

/**
 * Deck A with bass boost
 */
export const DeckABassBoost: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckAGain(0.9);
        store.setEQLow(4);
        store.setEQMid(1);
        store.setEQHigh(-2);
        store.setDeckAFXSend1(0.3);
        store.setDeckAFXSend2(0);

        return <DJChannelStrip deck="A" isActive={true} />;
    }
};

/**
 * Deck B with treble boost
 */
export const DeckBTrebleBoost: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckBGain(0.95);
        store.setEQLow(-3);
        store.setEQMid(0);
        store.setEQHigh(5);
        store.setDeckBFXSend1(0);
        store.setDeckBFXSend2(0.5);

        return <DJChannelStrip deck="B" isActive={true} />;
    }
};

/**
 * Deck A with full EQ cut
 */
export const DeckAEQCut: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckAGain(0.8);
        store.setEQLow(-6);
        store.setEQMid(-4);
        store.setEQHigh(-6);
        store.setDeckAFXSend1(0.2);
        store.setDeckAFXSend2(0.1);

        return <DJChannelStrip deck="A" isActive={false} />;
    }
};

/**
 * Deck B with maximum volume
 */
export const DeckBMaxVolume: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckBGain(1);
        store.setEQLow(0);
        store.setEQMid(0);
        store.setEQHigh(0);
        store.setDeckBFXSend1(0.8);
        store.setDeckBFXSend2(0.9);

        return <DJChannelStrip deck="B" isActive={true} />;
    }
};

/**
 * Deck A with minimum volume
 */
export const DeckAMinVolume: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckAGain(0.2);
        store.setEQLow(0);
        store.setEQMid(0);
        store.setEQHigh(0);
        store.setDeckAFXSend1(0);
        store.setDeckAFXSend2(0);

        return <DJChannelStrip deck="A" isActive={false} />;
    }
};

/**
 * Deck A in inactive state
 */
export const DeckAInactive: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckAGain(0.5);
        store.setEQLow(2);
        store.setEQMid(-1);
        store.setEQHigh(1);
        store.setDeckAFXSend1(0.4);
        store.setDeckAFXSend2(0.2);

        return <DJChannelStrip deck="A" isActive={false} />;
    }
};

/**
 * Deck B in inactive state
 */
export const DeckBInactive: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckBGain(0.5);
        store.setEQLow(-1);
        store.setEQMid(2);
        store.setEQHigh(-2);
        store.setDeckBFXSend1(0.1);
        store.setDeckBFXSend2(0.3);

        return <DJChannelStrip deck="B" isActive={false} />;
    }
};

/**
 * Disabled deck cannot be controlled
 */
export const DeckADisabled: Story = {
    render: () => {
        const store = useFXStore.getState();
        store.setDeckAGain(0.8);
        store.setEQLow(0);
        store.setEQMid(0);
        store.setEQHigh(0);
        store.setDeckAFXSend1(0);
        store.setDeckAFXSend2(0);

        return <DJChannelStrip deck="A" isActive={true} disabled={true} />;
    }
};
