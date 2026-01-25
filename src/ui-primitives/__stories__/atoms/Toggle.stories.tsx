import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback } from 'react';
import { Text } from '../Text';
import { Toggle, ToggleGroup, ToggleGroupItem } from '../Toggle';

const meta: Meta<typeof Toggle> = {
    title: 'UI Primitives/Toggle',
    component: Toggle,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs'],
    argTypes: {
        variant: { control: 'select', options: ['primary', 'secondary', 'outline'] },
        size: { control: 'select', options: ['sm', 'md', 'lg'] }
    }
};

export default meta;
type Story = StoryObj<typeof Toggle>;

function DefaultStory(): ReactElement {
    const [pressed, setPressed] = useState(false);
    return <Toggle pressed={pressed} onPressedChange={setPressed}>Toggle</Toggle>;
}

export const Default: Story = {
    render: DefaultStory
};

function AllVariantsStory(): ReactElement {
    const [primary, setPrimary] = useState(false);
    const [secondary, setSecondary] = useState(false);
    const [outline, setOutline] = useState(false);
    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <Toggle variant='primary' pressed={primary} onPressedChange={setPrimary}>Primary</Toggle>
            <Toggle variant='secondary' pressed={secondary} onPressedChange={setSecondary}>Secondary</Toggle>
            <Toggle variant='outline' pressed={outline} onPressedChange={setOutline}>Outline</Toggle>
        </div>
    );
}

export const AllVariants: Story = {
    render: AllVariantsStory
};

function AllSizesStory(): ReactElement {
    const [sm, setSm] = useState(false);
    const [md, setMd] = useState(false);
    const [lg, setLg] = useState(false);
    return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Toggle size='sm' pressed={sm} onPressedChange={setSm}>Small</Toggle>
            <Toggle size='md' pressed={md} onPressedChange={setMd}>Medium</Toggle>
            <Toggle size='lg' pressed={lg} onPressedChange={setLg}>Large</Toggle>
        </div>
    );
}

export const AllSizes: Story = {
    render: AllSizesStory
};

function DisabledStory(): ReactElement {
    const [enabled, setEnabled] = useState(false);
    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <Toggle pressed={false} disabled>Disabled Off</Toggle>
            <Toggle pressed={true} disabled>Disabled On</Toggle>
            <Toggle pressed={enabled} onPressedChange={setEnabled} disabled>Can't Toggle</Toggle>
        </div>
    );
}

export const Disabled: Story = {
    render: DisabledStory
};

function ToggleGroupExampleStory(): ReactElement {
    const [value, setValue] = useState('center');
    return (
        <ToggleGroup value={value} onValueChange={setValue}>
            <ToggleGroupItem value='left'>Left</ToggleGroupItem>
            <ToggleGroupItem value='center'>Center</ToggleGroupItem>
            <ToggleGroupItem value='right'>Right</ToggleGroupItem>
        </ToggleGroup>
    );
}

export const ToggleGroupExample: Story = {
    render: ToggleGroupExampleStory
};

function JustifyContentStory(): ReactElement {
    const [value, setValue] = useState('center');
    const handleValueChange = useCallback((newValue: string): void => {
        setValue(newValue);
    }, []);

    return (
        <div>
            <p style={{ color: '#b0b0b0', marginBottom: '12px' }}>Text alignment:</p>
            <ToggleGroup value={value} onValueChange={handleValueChange}>
                <ToggleGroupItem value='left'>Left</ToggleGroupItem>
                <ToggleGroupItem value='center'>Center</ToggleGroupItem>
                <ToggleGroupItem value='right'>Right</ToggleGroupItem>
            </ToggleGroup>
            <div style={{ marginTop: '16px', padding: '16px', border: '1px solid #333', borderRadius: '8px', textAlign: value as any }}>
                <Text>Sample text content</Text>
            </div>
        </div>
    );
}

export const JustifyContent: Story = {
    render: JustifyContentStory
};

function IconToggleStory(): ReactElement {
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUnderline] = useState(false);
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            <Toggle variant='outline' pressed={bold} onPressedChange={setBold}>
                <strong>B</strong>
            </Toggle>
            <Toggle variant='outline' pressed={italic} onPressedChange={setItalic}>
                <em>I</em>
            </Toggle>
            <Toggle variant='outline' pressed={underline} onPressedChange={setUnderline}>
                <span style={{ textDecoration: 'underline' }}>U</span>
            </Toggle>
        </div>
    );
}

export const IconToggle: Story = {
    render: IconToggleStory
};

function ViewModesStory(): ReactElement {
    const [view, setView] = useState('grid');
    return (
        <div>
            <p style={{ color: '#b0b0b0', marginBottom: '12px' }}>View mode:</p>
            <ToggleGroup value={view} onValueChange={setView}>
                <ToggleGroupItem value='list'>List</ToggleGroupItem>
                <ToggleGroupItem value='grid'>Grid</ToggleGroupItem>
                <ToggleGroupItem value='compact'>Compact</ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}

export const ViewModes: Story = {
    render: ViewModesStory
};

function FontSizeToggleStory(): ReactElement {
    const [size, setSize] = useState('md');
    const handleSizeChange = useCallback((newSize: string): void => {
        setSize(newSize);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ToggleGroup value={size} onValueChange={handleSizeChange}>
                <ToggleGroupItem value='sm'>Small</ToggleGroupItem>
                <ToggleGroupItem value='md'>Medium</ToggleGroupItem>
                <ToggleGroupItem value='lg'>Large</ToggleGroupItem>
            </ToggleGroup>
            <div style={{ padding: '16px', border: '1px solid #333', borderRadius: '8px' }}>
                <Text size={size as any}>Sample text at {size} size</Text>
            </div>
        </div>
    );
}

export const FontSizeToggle: Story = {
    render: FontSizeToggleStory
};
