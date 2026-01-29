import { Command } from 'cmdk';
import React, {
    type ReactElement,
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import {
    commandContent,
    commandDialogOverlay,
    commandEmpty,
    commandGroup,
    commandGroupLabel,
    commandInline,
    commandInput,
    commandInputContainer,
    commandItem,
    commandItemIndicator,
    commandKbd,
    commandList,
    commandLoading,
    commandSearchIcon,
    commandSeparator,
    commandShortcut
} from './Command.css.ts';

export {
    commandContent,
    commandDialogOverlay,
    commandEmpty,
    commandGroup,
    commandGroupLabel,
    commandInline,
    commandInput,
    commandInputContainer,
    commandItem,
    commandItemIndicator,
    commandKbd,
    commandList,
    commandLoading,
    commandSearchIcon,
    commandSeparator,
    commandShortcut
};

export type CommandPosition = 'dialog' | 'inline';

interface BaseCommandProps {
    readonly children: ReactNode;
    readonly className?: string;
    readonly value?: string;
    readonly onValueChange?: (value: string) => void;
}

interface CommandDialogProps extends BaseCommandProps {
    readonly open?: boolean;
    readonly onOpenChange?: (open: boolean) => void;
    readonly position?: 'dialog';
    readonly label?: string;
}

interface CommandInlineProps extends BaseCommandProps {
    readonly open: undefined;
    readonly onOpenChange: undefined;
    readonly position: 'inline';
    readonly label?: string;
}

export type CommandProps = CommandDialogProps | CommandInlineProps;

export function CommandPalette({
    children,
    open,
    onOpenChange,
    position = 'dialog',
    onValueChange,
    className,
    label = 'Command menu'
}: CommandProps): ReactElement {
    const [searchValue, setSearchValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect((): (() => void) => {
        const handleGlobalKeyDown = (e: globalThis.KeyboardEvent): void => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (position === 'dialog' && onOpenChange !== undefined) {
                    onOpenChange(true);
                }
            }
            if (e.key === 'Escape' && position === 'dialog' && onOpenChange !== undefined) {
                onOpenChange(false);
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return (): void => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [position, onOpenChange]);

    useEffect((): void => {
        if (open === true && inputRef.current !== null) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>): void => {
            setSearchValue(e.target.value);
            onValueChange?.(e.target.value);
        },
        [onValueChange]
    );

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
        const items = containerRef.current?.querySelectorAll('[data-cmdk-item]');
        if (items === undefined || items.length === 0) return;

        const selected = containerRef.current?.querySelector(
            '[data-selected="true"]'
        ) as HTMLElement | null;
        const selectedIndex = selected !== null ? Array.from(items).indexOf(selected) : 0;
        let newIndex = selectedIndex;

        if (e.key === 'ArrowDown' || e.key === 'j') {
            e.preventDefault();
            newIndex = Math.min(selectedIndex + 1, items.length - 1);
        } else if (e.key === 'ArrowUp' || e.key === 'k') {
            e.preventDefault();
            newIndex = Math.max(selectedIndex - 1, 0);
        } else if (e.key === 'Enter' && selected !== null) {
            e.preventDefault();
            selected.click();
        }

        if (newIndex !== selectedIndex) {
            const nextItem = items.item(newIndex) as HTMLElement | null;
            if (nextItem !== null) {
                nextItem.setAttribute('data-selected', 'true');
                selected?.setAttribute('data-selected', 'false');
                nextItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, []);

    const content = (
        <>
            <div className={commandInputContainer}>
                <span className={commandSearchIcon}>
                    <SearchIcon />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a command or search..."
                    className={commandInput}
                    value={searchValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    aria-label={label}
                />
                <kbd className={commandKbd}>ESC</kbd>
            </div>
            <div ref={containerRef} className={commandList}>
                {children}
            </div>
        </>
    );

    const onOverlayClick = useCallback((): void => {
        onOpenChange?.(false);
    }, [onOpenChange]);

    const onOverlayKeyDown = useCallback(
        (e: React.KeyboardEvent): void => {
            if (e.key === 'Enter') {
                onOpenChange?.(false);
            }
        },
        [onOpenChange]
    );

    if (position === 'dialog') {
        return (
            <Command>
                {open === true && (
                    <>
                        <button
                            className={commandDialogOverlay}
                            onClick={onOverlayClick}
                            type="button"
                            aria-label="Close command menu"
                            onKeyDown={onOverlayKeyDown}
                        />
                        <Command.Dialog
                            open={open}
                            onOpenChange={onOpenChange}
                            className={commandContent}
                            label={label}
                        >
                            {content}
                        </Command.Dialog>
                    </>
                )}
            </Command>
        );
    }

    return <div className={`${commandInline} ${className ?? ''}`}>{content}</div>;
}

export function CommandGroup({
    children,
    heading
}: {
    readonly children: ReactNode;
    readonly heading?: string;
}): ReactElement {
    return (
        <div className={commandGroup}>
            {heading !== undefined && heading !== '' && (
                <div className={commandGroupLabel}>{heading}</div>
            )}
            {children}
        </div>
    );
}

export function CommandItem({
    children,
    value,
    onSelect,
    disabled = false,
    shortcut
}: {
    readonly children: ReactNode;
    readonly value: string;
    readonly onSelect?: () => void;
    readonly disabled?: boolean;
    readonly shortcut?: string;
}): ReactElement {
    const handleItemSelect = useCallback((): void => {
        onSelect?.();
    }, [onSelect]);

    return (
        <Command.Item
            value={value}
            onSelect={handleItemSelect}
            disabled={disabled}
            className={commandItem}
        >
            <span className={commandItemIndicator} />
            {children}
            {shortcut !== undefined && shortcut !== '' && (
                <span className={commandShortcut}>{shortcut}</span>
            )}
        </Command.Item>
    );
}

export function CommandSeparator(): ReactElement {
    return <Command.Separator className={commandSeparator} />;
}

export function CommandEmpty(): ReactElement {
    return <Command.Empty className={commandEmpty}>No results found.</Command.Empty>;
}

export function CommandLoading(): ReactElement {
    return (
        <div className={commandLoading}>
            <LoadingSpinner />
        </div>
    );
}

function SearchIcon(): ReactElement {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

function LoadingSpinner(): ReactElement {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ animation: 'spin 1s linear infinite' }}
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
    );
}
