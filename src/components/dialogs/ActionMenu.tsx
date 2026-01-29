import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, menuStyles, Text } from 'ui-primitives';
import * as styles from './ActionMenu.css.ts';

export interface ActionMenuItem {
    id?: string;
    name?: string;
    textContent?: string;
    innerText?: string;
    icon?: string;
    asideText?: string;
    secondaryText?: string;
    selected?: boolean;
    divider?: boolean;
    value?: string;
}

export interface ActionMenuProps {
    items: ActionMenuItem[];
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onSelect: (id: string) => void;
    title?: string;
    text?: string;
    showCancel?: boolean;
    onCancel?: () => void;
    dialogClass?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
    items,
    anchorEl,
    open,
    onClose,
    onSelect,
    title,
    text,
    showCancel = false,
    onCancel,
    dialogClass
}) => {
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!open || !anchorEl) {
            setAnchorRect(null);
            return;
        }

        const updateRect = () => {
            setAnchorRect(anchorEl.getBoundingClientRect());
        };

        updateRect();
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);

        return () => {
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
        };
    }, [anchorEl, open]);

    const handleItemClick = useCallback(
        (item: ActionMenuItem) => {
            const itemId = item.id == null || item.id === '' ? item.value : item.id;
            if (itemId) {
                onSelect(itemId);
            }
            onClose();
        },
        [onSelect, onClose]
    );

    const handleCancel = useCallback(() => {
        if (onCancel) {
            onCancel();
        }
        onClose();
    }, [onCancel, onClose]);

    const renderIcon = (icon: string | undefined, isSelected: boolean) => {
        if (!icon) {
            if (isSelected) {
                return (
                    <span className="material-icons" aria-hidden="true">
                        check
                    </span>
                );
            }
            return null;
        }
        return (
            <span className={`material-icons ${icon}`} aria-hidden="true">
                {icon}
            </span>
        );
    };

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (!nextOpen) {
                onClose();
            }
        },
        [onClose]
    );

    if (!anchorEl) {
        return null;
    }

    return (
        <DropdownMenuPrimitive.Root open={open} onOpenChange={handleOpenChange} modal={false}>
            {anchorRect &&
                typeof document !== 'undefined' &&
                createPortal(
                    <DropdownMenuPrimitive.Trigger asChild>
                        <button
                            type="button"
                            aria-hidden="true"
                            tabIndex={-1}
                            className={styles.anchorTrigger}
                            style={{
                                left: anchorRect.left,
                                top: anchorRect.top,
                                width: anchorRect.width,
                                height: anchorRect.height
                            }}
                        />
                    </DropdownMenuPrimitive.Trigger>,
                    document.body
                )}
            <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                    className={classNames(menuStyles.content, styles.menuContent, dialogClass)}
                    align="start"
                    sideOffset={4}
                >
                    {title && (
                        <Box className={styles.header}>
                            <Text size="sm" weight="bold">
                                {title}
                            </Text>
                        </Box>
                    )}

                    {text && (
                        <Box className={styles.description}>
                            <Text size="sm" color="secondary">
                                {text}
                            </Text>
                        </Box>
                    )}

                    {(title || text) && (
                        <DropdownMenuPrimitive.Separator className={menuStyles.separator} />
                    )}

                    {items.map((item, index) => {
                        if (item.divider) {
                            return (
                                <DropdownMenuPrimitive.Separator
                                    key={`divider-${index}`}
                                    className={menuStyles.separator}
                                />
                            );
                        }

                        const itemKey = item.id || item.value || `item-${index}`;
                        const itemText = item.name || item.textContent || item.innerText;
                        const itemClassName = classNames(
                            menuStyles.item,
                            menuStyles.itemVariant.default,
                            item.selected && styles.selectedItem
                        );

                        return (
                            <DropdownMenuPrimitive.Item
                                key={itemKey}
                                className={itemClassName}
                                data-selected={item.selected ? 'true' : undefined}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    handleItemClick(item);
                                }}
                            >
                                {(item.icon || item.selected) && (
                                    <span className={styles.iconSlot}>
                                        {renderIcon(item.icon, !!item.selected)}
                                    </span>
                                )}
                                <div className={styles.itemContent}>
                                    <Text size="md">{itemText}</Text>
                                    {item.secondaryText && (
                                        <Text size="xs" color="secondary">
                                            {item.secondaryText}
                                        </Text>
                                    )}
                                </div>
                                {item.asideText && (
                                    <Text size="xs" color="secondary" className={styles.asideText}>
                                        {item.asideText}
                                    </Text>
                                )}
                            </DropdownMenuPrimitive.Item>
                        );
                    })}

                    {showCancel && (
                        <>
                            <DropdownMenuPrimitive.Separator className={menuStyles.separator} />
                            <DropdownMenuPrimitive.Item
                                className={classNames(
                                    menuStyles.item,
                                    menuStyles.itemVariant.danger
                                )}
                                onSelect={(event) => {
                                    event.preventDefault();
                                    handleCancel();
                                }}
                            >
                                <span className={styles.iconSlot}>
                                    <span className="material-icons" aria-hidden="true">
                                        close
                                    </span>
                                </span>
                                <Text size="md">Cancel</Text>
                            </DropdownMenuPrimitive.Item>
                        </>
                    )}
                </DropdownMenuPrimitive.Content>
            </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
    );
};

export default ActionMenu;
