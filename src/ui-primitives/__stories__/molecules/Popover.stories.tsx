import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState } from 'react';
import { Button } from '../../Button';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverFooter,
    PopoverClose,
    PopoverArrow
} from '../../Popover';

const meta: Meta<typeof Popover> = {
    title: 'UI Primitives/Popover',
    component: Popover,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'A popover component built on Radix UI with vanilla-extract styling.'
            }
        }
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory(): ReactElement {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button>Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent align='start'>
                <PopoverClose />
                <PopoverHeader>
                    <PopoverTitle>Edit Profile</PopoverTitle>
                    <PopoverDescription>
                        Make changes to your profile here. Click save when you&apos;re done.
                    </PopoverDescription>
                </PopoverHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    <input
                        type='text'
                        placeholder='Enter your name'
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--colors-divider)',
                            background: 'var(--colors-surface)',
                            color: 'var(--colors-text)',
                            boxSizing: 'border-box'
                        }}
                    />
                    <input
                        type='email'
                        placeholder='Enter your email'
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--colors-divider)',
                            background: 'var(--colors-surface)',
                            color: 'var(--colors-text)',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
                <PopoverFooter>
                    <Button variant='primary' size='sm'>
                        Save
                    </Button>
                </PopoverFooter>
                <PopoverArrow />
            </PopoverContent>
        </Popover>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function WithCustomTriggerStory(): ReactElement {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant='ghost' style={{ padding: '8px 12px' }}>
                    <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        aria-hidden='true'
                    >
                        <circle cx='12' cy='12' r='1' />
                        <circle cx='19' cy='12' r='1' />
                        <circle cx='5' cy='12' r='1' />
                    </svg>
                </Button>
            </PopoverTrigger>
            <PopoverContent align='end'>
                <PopoverClose />
                <PopoverHeader>
                    <PopoverTitle>Actions</PopoverTitle>
                </PopoverHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                        type='button'
                        style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: 4,
                            color: 'var(--colors-text)'
                        }}
                    >
                        Share
                    </button>
                    <button
                        type='button'
                        style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: 4,
                            color: 'var(--colors-text)'
                        }}
                    >
                        Copy link
                    </button>
                    <button
                        type='button'
                        style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            borderRadius: 4,
                            color: 'var(--colors-error)'
                        }}
                    >
                        Delete
                    </button>
                </div>
                <PopoverArrow />
            </PopoverContent>
        </Popover>
    );
}

export const WithCustomTrigger: Story = {
    render: WithCustomTriggerStory
};

function AlignVariantsStory(): ReactElement {
    return (
        <div style={{ display: 'flex', gap: '8px' }}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant='secondary' size='sm'>
                        Start
                    </Button>
                </PopoverTrigger>
                <PopoverContent align='start'>
                    <PopoverClose />
                    <PopoverTitle>Start Align</PopoverTitle>
                    <PopoverDescription>Aligned to the start (left).</PopoverDescription>
                    <PopoverArrow />
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant='secondary' size='sm'>
                        Center
                    </Button>
                </PopoverTrigger>
                <PopoverContent align='center'>
                    <PopoverClose />
                    <PopoverTitle>Center Align</PopoverTitle>
                    <PopoverDescription>Aligned to the center.</PopoverDescription>
                    <PopoverArrow />
                </PopoverContent>
            </Popover>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant='secondary' size='sm'>
                        End
                    </Button>
                </PopoverTrigger>
                <PopoverContent align='end'>
                    <PopoverClose />
                    <PopoverTitle>End Align</PopoverTitle>
                    <PopoverDescription>Aligned to the end (right).</PopoverDescription>
                    <PopoverArrow />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export const AlignVariants: Story = {
    render: AlignVariantsStory
};

function SimpleContentStory(): ReactElement {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant='ghost'>Simple Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
                <PopoverClose />
                <PopoverTitle>Simple Title</PopoverTitle>
                <PopoverDescription>This is a simple popover with just a title and description.</PopoverDescription>
            </PopoverContent>
        </Popover>
    );
}

export const SimpleContent: Story = {
    render: SimpleContentStory
};

function WithoutArrowStory(): ReactElement {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant='ghost'>No Arrow</Button>
            </PopoverTrigger>
            <PopoverContent style={{ padding: 20 }}>
                <PopoverClose />
                <PopoverTitle>No Arrow</PopoverTitle>
                <PopoverDescription>This popover has no arrow.</PopoverDescription>
            </PopoverContent>
        </Popover>
    );
}

export const WithoutArrow: Story = {
    render: WithoutArrowStory
};
