import React, { useState, type ReactElement, useCallback } from 'react';
import { Flex } from './Box';
import { IconButton } from './IconButton';
import { accordionRoot, accordionHeader, accordionExpanded, accordionContent } from './Accordion.css';

interface AccordionProps {
    readonly children: React.ReactNode;
    readonly expanded?: boolean;
    readonly onChange?: (expanded: boolean) => void;
    readonly className?: string;
}

interface AccordionSummaryProps {
    readonly children: React.ReactNode;
    readonly onClick?: () => void;
    readonly className?: string;
}

interface AccordionDetailsProps {
    readonly children: React.ReactNode;
    readonly className?: string;
}

export function Accordion({ children, expanded, onChange, className }: AccordionProps): ReactElement {
    const [internalExpanded, setInternalExpanded] = useState(expanded ?? false);
    const isExpanded = expanded ?? internalExpanded;

    const handleToggle = useCallback((): void => {
        if (onChange) {
            onChange(!isExpanded);
        } else {
            setInternalExpanded(!isExpanded);
        }
    }, [isExpanded, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') {
            handleToggle();
        }
    }, [handleToggle]);

    let header: React.ReactNode = null;
    let content: React.ReactNode = null;

    React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
            const typedChild = child as unknown as { type: React.ElementType; props: { children?: React.ReactNode } };
            if (typedChild.type === AccordionSummary) {
                header = typedChild.props.children;
            } else if (typedChild.type === AccordionDetails) {
                content = typedChild.props.children;
            }
        }
    });

    return (
        <div className={`${accordionRoot} ${className ?? ''}`}>
            <div
                className={`${accordionHeader} ${isExpanded ? accordionExpanded : ''}`}
                onClick={handleToggle}
                role='button'
                tabIndex={0}
                onKeyDown={handleKeyDown}
            >
                {header}
            </div>
            {isExpanded && (
                <div className={accordionContent}>
                    {content}
                </div>
            )}
        </div>
    );
}

export function AccordionSummary({ children, className }: AccordionSummaryProps): ReactElement {
    return (
        <Flex style={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }} className={className}>
            {children}
        </Flex>
    );
}

export function AccordionDetails({ children, className }: AccordionDetailsProps): ReactElement {
    return <div className={className}>{children}</div>;
}

function ExpandMoreIcon(): ReactElement {
    return (
        <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z' />
        </svg>
    );
}

interface ExpandableAccordionProps {
    readonly title: React.ReactNode;
    readonly icon?: React.ReactNode;
    readonly children: React.ReactNode;
    readonly defaultExpanded?: boolean;
    readonly onExpandedChange?: (expanded: boolean) => void;
    readonly className?: string;
}

export function ExpandableAccordion({
    title,
    icon,
    children,
    defaultExpanded = false,
    onExpandedChange,
    className
}: ExpandableAccordionProps): ReactElement {
    const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
    const isExpanded = onExpandedChange !== undefined ? defaultExpanded : internalExpanded;

    const handleExpandToggle = useCallback((): void => {
        const nextExpanded = !isExpanded;
        if (onExpandedChange) {
            onExpandedChange(nextExpanded);
        } else {
            setInternalExpanded(nextExpanded);
        }
    }, [isExpanded, onExpandedChange]);

    const handleExpandKeyDown = useCallback((e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') {
            handleExpandToggle();
        }
    }, [handleExpandToggle]);

    return (
        <div className={`${accordionRoot} ${className ?? ''}`}>
            <div
                className={`${accordionHeader} ${isExpanded ? accordionExpanded : ''}`}
                onClick={handleExpandToggle}
                role='button'
                tabIndex={0}
                onKeyDown={handleExpandKeyDown}
                style={{ cursor: 'pointer' }}
            >
                <Flex style={{ alignItems: 'center', gap: 8, flex: 1 }}>
                    {icon !== undefined && <span style={{ display: 'flex' }}>{icon}</span>}
                    {title}
                </Flex>
                <IconButton
                    variant='ghost'
                    size='sm'
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                    <ExpandMoreIcon />
                </IconButton>
            </div>
            {isExpanded && (
                <div className={accordionContent}>
                    {children}
                </div>
            )}
        </div>
    );
}
