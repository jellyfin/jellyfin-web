import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { vars } from '../../../styles/tokens.css';

interface CheckboxProps {
    label?: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
}

function Checkbox({ label, checked, onCheckedChange, disabled }: Readonly<CheckboxProps>): ReactElement {
    return (
        <label
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: vars.spacing['4'],
                cursor: disabled === true ? 'not-allowed' : 'pointer',
                opacity: disabled === true ? 0.5 : 1
            }}
        >
            <CheckboxPrimitive.Root
                checked={checked}
                onCheckedChange={onCheckedChange}
                disabled={disabled}
                style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: vars.borderRadius.sm,
                    border: `2px solid ${checked === true ? vars.colors.primary : vars.colors.textSecondary}`,
                    backgroundColor: checked === true ? vars.colors.primary : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'inherit'
                }}
            >
                <CheckboxPrimitive.Indicator asChild>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{ color: vars.colors.text, fontSize: vars.typography['3'].fontSize }}
                    >
                        ✓
                    </motion.div>
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
            {label !== undefined && label !== '' && (
                <span style={{ color: vars.colors.text, fontSize: vars.typography['6'].fontSize }}>{label}</span>
            )}
        </label>
    );
}

const meta: Meta<typeof Checkbox> = {
    title: 'UI Primitives/Checkbox',
    component: Checkbox,
    parameters: { layout: 'centered' },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory(): ReactElement {
    const [checked, setChecked] = useState(false);
    return <Checkbox label="Accept terms and conditions" checked={checked} onCheckedChange={setChecked} />;
}

export const Default: Story = {
    render: DefaultStory
};

function CheckedStory(): ReactElement {
    const [checked, setChecked] = useState(true);
    return <Checkbox label="Checked by default" checked={checked} onCheckedChange={setChecked} />;
}

export const Checked: Story = {
    render: CheckedStory
};

export const Disabled: Story = {
    args: {
        label: 'Disabled checkbox',
        disabled: true
    }
};

function GroupStory(): ReactElement {
    const [selected, setSelected] = useState<string[]>(['movies']);
    const toggleMovies = useCallback((): void => {
        setSelected(prev => (prev.includes('movies') ? prev.filter(v => v !== 'movies') : [...prev, 'movies']));
    }, []);
    const toggleTVShows = useCallback((): void => {
        setSelected(prev => (prev.includes('tvshows') ? prev.filter(v => v !== 'tvshows') : [...prev, 'tvshows']));
    }, []);
    const toggleMusic = useCallback((): void => {
        setSelected(prev => (prev.includes('music') ? prev.filter(v => v !== 'music') : [...prev, 'music']));
    }, []);
    const togglePhotos = useCallback((): void => {
        setSelected(prev => (prev.includes('photos') ? prev.filter(v => v !== 'photos') : [...prev, 'photos']));
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: vars.spacing['4'] }}>
            <Checkbox label="Movies" checked={selected.includes('movies')} onCheckedChange={toggleMovies} />
            <Checkbox label="TV Shows" checked={selected.includes('tvshows')} onCheckedChange={toggleTVShows} />
            <Checkbox label="Music" checked={selected.includes('music')} onCheckedChange={toggleMusic} />
            <Checkbox label="Photos" checked={selected.includes('photos')} onCheckedChange={togglePhotos} />
        </div>
    );
}

export const Group: Story = {
    render: GroupStory
};
