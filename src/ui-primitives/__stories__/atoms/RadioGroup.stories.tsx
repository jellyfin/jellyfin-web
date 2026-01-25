import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback } from 'react';
import { Text } from '../Text';
import { RadioGroup, RadioGroupItem } from '../RadioGroup';

const meta: Meta<typeof RadioGroup> = {
    title: 'UI Primitives/RadioGroup',
    component: RadioGroup,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

function DefaultStory(): ReactElement {
    const [value, setValue] = useState('option1');
    const handleValueChange = useCallback((newValue: string): void => {
        setValue(newValue);
    }, []);

    return (
        <RadioGroup value={value} onValueChange={handleValueChange}>
            <RadioGroupItem value="option1" id="r1" label="Option 1" />
            <RadioGroupItem value="option2" id="r2" label="Option 2" />
            <RadioGroupItem value="option3" id="r3" label="Option 3" />
        </RadioGroup>
    );
}

export const Default: Story = {
    render: DefaultStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '250px' }}>
                <Story />
            </div>
        )
    ]
};

function WithSelectionStory(): ReactElement {
    const [plan, setPlan] = useState('pro');
    const handlePlanChange = useCallback((newPlan: string): void => {
        setPlan(newPlan);
    }, []);

    return (
        <div>
            <RadioGroup value={plan} onValueChange={handlePlanChange}>
                <RadioGroupItem value="free" id="free" label="Free - $0/month" />
                <RadioGroupItem value="pro" id="pro" label="Pro - $10/month" />
                <RadioGroupItem value="enterprise" id="enterprise" label="Enterprise - $50/month" />
            </RadioGroup>
            <p style={{ marginTop: '16px', color: '#b0b0b0' }}>
                Selected: <strong style={{ color: '#fff' }}>{plan}</strong>
            </p>
        </div>
    );
}

export const WithSelection: Story = {
    render: WithSelectionStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '280px' }}>
                <Story />
            </div>
        )
    ]
};

function DisabledStory(): ReactElement {
    const [value, setValue] = useState('enabled');
    const handleValueChange = useCallback((newValue: string): void => {
        setValue(newValue);
    }, []);

    return (
        <RadioGroup value={value} onValueChange={handleValueChange}>
            <RadioGroupItem value="enabled" id="d1" label="Enabled option" />
            <RadioGroupItem value="disabled" id="d2" label="Disabled option" disabled />
        </RadioGroup>
    );
}

export const Disabled: Story = {
    render: DisabledStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '250px' }}>
                <Story />
            </div>
        )
    ]
};

function SurveyStory(): ReactElement {
    const [satisfaction, setSatisfaction] = useState('neutral');
    const [recommend, setRecommend] = useState('maybe');

    const handleSatisfactionChange = useCallback((val: string): void => {
        setSatisfaction(val);
    }, []);

    const handleRecommendChange = useCallback((val: string): void => {
        setRecommend(val);
    }, []);

    return (
        <div style={{ width: '300px' }}>
            <h4 style={{ margin: '0 0 16px', color: '#fff' }}>Feedback Survey</h4>
            <div style={{ marginBottom: '24px' }}>
                <Text size="sm" style={{ marginBottom: '8px' }}>
                    How satisfied are you?
                </Text>
                <RadioGroup value={satisfaction} onValueChange={handleSatisfactionChange}>
                    <RadioGroupItem value="very-satisfied" id="vs" label="Very Satisfied" />
                    <RadioGroupItem value="satisfied" id="s" label="Satisfied" />
                    <RadioGroupItem value="neutral" id="n" label="Neutral" />
                    <RadioGroupItem value="dissatisfied" id="d" label="Dissatisfied" />
                </RadioGroup>
            </div>
            <div>
                <Text size="sm" style={{ marginBottom: '8px' }}>
                    Would you recommend us?
                </Text>
                <RadioGroup value={recommend} onValueChange={handleRecommendChange}>
                    <RadioGroupItem value="yes" id="y" label="Yes" />
                    <RadioGroupItem value="maybe" id="m" label="Maybe" />
                    <RadioGroupItem value="no" id="no" label="No" />
                </RadioGroup>
            </div>
        </div>
    );
}

export const Survey: Story = {
    render: SurveyStory
};

function InlineStory(): ReactElement {
    const [time, setTime] = useState('morning');
    const handleTimeChange = useCallback((newTime: string): void => {
        setTime(newTime);
    }, []);

    return (
        <div>
            <Text size="sm" style={{ marginBottom: '8px' }}>
                Preferred time
            </Text>
            <div style={{ display: 'flex', gap: '8px' }}>
                <RadioGroup value={time} onValueChange={handleTimeChange}>
                    <RadioGroupItem value="morning" id="morn" label="Morning" />
                    <RadioGroupItem value="afternoon" id="aft" label="Afternoon" />
                    <RadioGroupItem value="evening" id="eve" label="Evening" />
                </RadioGroup>
            </div>
        </div>
    );
}

export const Inline: Story = {
    render: InlineStory,
    decorators: [
        (Story): ReactElement => (
            <div style={{ width: '350px' }}>
                <Story />
            </div>
        )
    ]
};
