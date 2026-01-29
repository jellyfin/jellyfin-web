import type { Meta, StoryObj } from '@storybook/react';
import { FrequencyAnalyzer } from '../../organisms/FrequencyAnalyzer';

const meta: Meta<typeof FrequencyAnalyzer> = {
    title: 'Organisms/FrequencyAnalyzer',
    component: FrequencyAnalyzer,
    parameters: {
        layout: 'fullscreen'
    }
};

export default meta;
type Story = StoryObj<typeof FrequencyAnalyzer>;

export const Default: Story = {
    args: {
        colorScheme: 'spectrum',
        barCount: 64
    }
};
