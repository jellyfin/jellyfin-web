import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactElement, type ReactNode, useState, useCallback, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { vars } from 'styles/tokens.css.ts';
import { Button } from '../..';

interface AnimatedMenuProps {
    trigger: ReactNode;
    children: ReactNode;
}

function AnimatedMenu({ trigger, children }: Readonly<AnimatedMenuProps>): ReactElement {
    const [open, setOpen] = useState(false);

    return (
        <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
            <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>

            <AnimatePresence>
                {open === true && (
                    <DropdownMenuPrimitive.Portal forceMount>
                        <DropdownMenuPrimitive.Content asChild sideOffset={5}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: 0,
                                    transition: { duration: 0.15 }
                                }}
                                exit={{
                                    opacity: 0,
                                    scale: 0.95,
                                    y: -5,
                                    transition: { duration: 0.1 }
                                }}
                                style={{
                                    minWidth: '180px',
                                    backgroundColor: vars.colors.surface,
                                    borderRadius: vars.borderRadius.md,
                                    boxShadow: vars.shadows.lg,
                                    padding: vars.spacing['2'],
                                    zIndex: 1000
                                }}
                            >
                                {children}
                            </motion.div>
                        </DropdownMenuPrimitive.Content>
                    </DropdownMenuPrimitive.Portal>
                )}
            </AnimatePresence>
        </DropdownMenuPrimitive.Root>
    );
}

interface MenuItemProps {
    children: ReactNode;
    onSelect?: () => void;
}

function MenuItem({ children, onSelect }: Readonly<MenuItemProps>): ReactElement {
    const handleMouseEnter = useCallback((e: MouseEvent<HTMLDivElement>): void => {
        e.currentTarget.style.backgroundColor = vars.colors.surfaceHover;
    }, []);

    const handleMouseLeave = useCallback((e: MouseEvent<HTMLDivElement>): void => {
        e.currentTarget.style.backgroundColor = 'transparent';
    }, []);

    return (
        <DropdownMenuPrimitive.Item
            onSelect={onSelect}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: vars.spacing['4'],
                padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
                borderRadius: vars.borderRadius.sm,
                fontSize: vars.typography['6'].fontSize,
                color: vars.colors.text,
                cursor: 'pointer',
                outline: 'none'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </DropdownMenuPrimitive.Item>
    );
}

function MenuSeparator(): ReactElement {
    return (
        <DropdownMenuPrimitive.Separator
            style={{
                height: 1,
                backgroundColor: vars.colors.divider,
                margin: `${vars.spacing['2']} 0`
            }}
        />
    );
}

const meta: Meta<typeof AnimatedMenu> = {
    title: 'UI Primitives/Menu',
    component: AnimatedMenu,
    parameters: {
        layout: 'centered'
    },
    tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultStory(): ReactElement {
    const handleProfile = useCallback((): void => {
        /* Profile */
    }, []);
    const handleSettings = useCallback((): void => {
        /* Settings */
    }, []);
    const handleLogout = useCallback((): void => {
        /* Logout */
    }, []);

    return (
        <AnimatedMenu trigger={<Button>Open Menu</Button>}>
            <MenuItem onSelect={handleProfile}>Profile</MenuItem>
            <MenuItem onSelect={handleSettings}>Settings</MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={handleLogout}>Logout</MenuItem>
        </AnimatedMenu>
    );
}

export const Default: Story = {
    render: DefaultStory
};

function WithIconsStory(): ReactElement {
    return (
        <AnimatedMenu trigger={<Button variant="secondary">Actions</Button>}>
            <MenuItem>
                <span>📝</span> Edit
            </MenuItem>
            <MenuItem>
                <span>📋</span> Copy
            </MenuItem>
            <MenuItem>
                <span>📤</span> Share
            </MenuItem>
            <MenuSeparator />
            <MenuItem>
                <span>🗑️</span> Delete
            </MenuItem>
        </AnimatedMenu>
    );
}

export const WithIcons: Story = {
    render: WithIconsStory
};
