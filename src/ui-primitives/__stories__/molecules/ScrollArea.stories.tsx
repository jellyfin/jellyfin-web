import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { ScrollArea, Text } from '../..';

const meta: Meta<typeof ScrollArea> = {
    title: 'UI Primitives/ScrollArea',
    component: ScrollArea,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const longContent = Array.from({ length: 30 }, (_, i) => (
    <div key={i} style={{ padding: '12px', borderBottom: '1px solid #333' }}>
        <Text>Item {i + 1}</Text>
    </div>
));

function DefaultStory(): ReactElement {
    return (
        <ScrollArea
            style={{
                width: '250px',
                height: '300px',
                border: '1px solid #333',
                borderRadius: '8px'
            }}
        >
            <div style={{ padding: '8px' }}>{longContent}</div>
        </ScrollArea>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function HorizontalScrollStory(): ReactElement {
    return (
        <ScrollArea
            horizontal
            style={{
                width: '400px',
                height: '150px',
                border: '1px solid #333',
                borderRadius: '8px'
            }}
        >
            <div style={{ padding: '8px', display: 'flex', gap: vars.spacing['2'] }}>
                {Array.from({ length: 15 }, (_, i) => (
                    <div
                        key={i}
                        style={{
                            minWidth: '120px',
                            padding: '16px',
                            backgroundColor: '#252525',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}
                    >
                        <Text>Card {i + 1}</Text>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}

export const HorizontalScroll: Story = {
    render: HorizontalScrollStory
};

function BothDirectionsStory(): ReactElement {
    return (
        <ScrollArea
            style={{
                width: '400px',
                height: '300px',
                border: '1px solid #333',
                borderRadius: '8px'
            }}
        >
            <div style={{ padding: '8px' }}>
                <div
                    style={{
                        width: '600px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: vars.spacing['2']
                    }}
                >
                    {Array.from({ length: 24 }, (_, i) => (
                        <div
                            key={i}
                            style={{
                                padding: vars.spacing['5'],
                                backgroundColor: '#252525',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}
                        >
                            <Text>Item {i + 1}</Text>
                        </div>
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
}

export const BothDirections: Story = {
    render: BothDirectionsStory
};

function ChatInterfaceStory(): ReactElement {
    return (
        <div
            style={{
                width: '350px',
                border: '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    padding: '12px',
                    borderBottom: '1px solid #333',
                    backgroundColor: '#2a2a2a'
                }}
            >
                <Text weight="bold">Chat Messages</Text>
            </div>
            <ScrollArea style={{ height: '300px' }}>
                <div
                    style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: vars.spacing['3']
                    }}
                >
                    {[
                        { from: 'Alice', message: 'Hey, how are you?', time: '10:30 AM' },
                        { from: 'Bob', message: 'Doing great, thanks!', time: '10:32 AM' },
                        { from: 'Alice', message: 'Want to grab lunch?', time: '10:33 AM' },
                        { from: 'Bob', message: 'Sure, what time?', time: '10:35 AM' },
                        { from: 'Alice', message: 'How about 12:30?', time: '10:36 AM' },
                        { from: 'Bob', message: 'Perfect, see you then!', time: '10:37 AM' },
                        { from: 'Alice', message: 'Great!', time: '10:38 AM' },
                        { from: 'Bob', message: '👍', time: '10:38 AM' },
                        { from: 'Alice', message: 'Where should we meet?', time: '10:40 AM' },
                        { from: 'Bob', message: 'The new cafe on Main Street?', time: '10:42 AM' },
                        { from: 'Alice', message: 'Sounds good!', time: '10:43 AM' },
                        { from: 'Bob', message: 'Awesome!', time: '10:44 AM' }
                    ].map((msg, i) => (
                        <div
                            key={i}
                            style={{
                                padding: '8px',
                                backgroundColor: '#252525',
                                borderRadius: '8px'
                            }}
                        >
                            <Text size="sm" weight="bold" color="primary">
                                {msg.from}
                            </Text>
                            <Text size="sm">{msg.message}</Text>
                            <Text size="xs" color="muted" style={{ marginTop: vars.spacing['1'] }}>
                                {msg.time}
                            </Text>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export const ChatInterface: Story = {
    render: ChatInterfaceStory
};

function CodeBlockStory(): ReactElement {
    return (
        <div
            style={{
                width: '500px',
                border: '1px solid #333',
                borderRadius: '8px',
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #333',
                    backgroundColor: '#2a2a2a',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}
            >
                <Text size="sm">Code Preview</Text>
                <Text size="xs" color="muted">
                    TypeScript
                </Text>
            </div>
            <ScrollArea style={{ height: '200px' }}>
                <pre
                    style={{
                        margin: 0,
                        padding: '16px',
                        fontFamily: vars.typography.fontFamilyMono,
                        fontSize: vars.typography['3'].fontSize,
                        lineHeight: vars.typography.lineHeightNormal
                    }}
                >
                    {`function helloWorld() {
    console.log("Hello, World!");
    
    const greeting = "Welcome to Jellyfin";
    return greeting;
}

async function fetchData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
}

class User {
    constructor(name) {
        this.name = name;
    }
    
        greet() {
    
            return \`Hello, \\\${this.name}!\`;
    
        }
    
    }
    
    `}
                </pre>
            </ScrollArea>
        </div>
    );
}

export const CodeBlock: Story = {
    render: CodeBlockStory
};
