/* eslint-disable react/jsx-no-bind */
import React from 'react';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { Link, type LinkProps } from '@tanstack/react-router';

import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import { AspectRatio } from 'ui-primitives/AspectRatio';
import { Box, Flex } from 'ui-primitives/Box';
import { Card } from 'ui-primitives/Card';
import { IconButton } from 'ui-primitives/IconButton';
import { Heading, Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

interface BaseCardProps {
    title?: string;
    text?: string;
    image?: string | null;
    icon?: React.ReactNode;
    to?: LinkProps['to'];
    onClick?: () => void;
    action?: boolean;
    actionRef?: React.RefObject<HTMLButtonElement | null>;
    onActionClick?: () => void;
    height?: number | string;
    width?: number | string;
}

const BaseCard = ({
    title,
    text,
    image,
    icon,
    to,
    onClick,
    action,
    actionRef,
    onActionClick,
    height,
    width
}: BaseCardProps): React.ReactElement => {
    const cardContent = (
        <>
            <AspectRatio ratio="16/9" style={{ borderRadius: vars.borderRadius.sm, overflow: 'hidden' }}>
                {image != null ? (
                    <img src={image} loading="lazy" alt={title ?? ''} />
                ) : (
                    <Box
                        className={getDefaultBackgroundClass(title ?? '')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: vars.colors.surfaceLight
                        }}
                    >
                        {icon}
                    </Box>
                )}
            </AspectRatio>
            <Flex style={{ paddingTop: vars.spacing.sm, flexDirection: 'column', gap: vars.spacing.sm }}>
                <Flex
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: vars.spacing.sm
                    }}
                >
                    <Box style={{ flexGrow: 1, minWidth: 0 }}>
                        <Heading.H5
                            style={{
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {title}
                        </Heading.H5>
                        {text != null && text !== '' && (
                            <Text
                                size="xs"
                                style={{
                                    wordBreak: 'break-all',
                                    marginTop: vars.spacing.xs
                                }}
                            >
                                {text}
                            </Text>
                        )}
                    </Box>
                    {action && (
                        <IconButton
                            variant="plain"
                            color="neutral"
                            size="sm"
                            ref={actionRef}
                            onClick={handleActionClick}
                        >
                            <DotsVerticalIcon />
                        </IconButton>
                    )}
                </Flex>
            </Flex>
        </>
    );

    const cardStyle = {
        height: height ?? 'auto',
        width: width,
        transition: vars.transitions.fast,
        border: `1px solid ${vars.colors.divider}`,
        borderRadius: vars.borderRadius.md,
        textDecoration: 'none',
        cursor: 'pointer'
    };

    const hoverStyle = {
        transform: 'translateY(-4px)',
        boxShadow: vars.shadows.md,
        borderColor: vars.colors.primary,
        backgroundColor: vars.colors.surface
    };

    function handleMouseEnter(e: React.MouseEvent): void {
        Object.assign((e.currentTarget as HTMLElement).style, hoverStyle);
    }

    function handleMouseLeave(e: React.MouseEvent): void {
        (e.currentTarget as HTMLElement).style.transform = '';
        (e.currentTarget as HTMLElement).style.boxShadow = '';
        (e.currentTarget as HTMLElement).style.borderColor = vars.colors.divider;
        (e.currentTarget as HTMLElement).style.backgroundColor = '';
    }

    function handleActionClick(e: React.MouseEvent): void {
        e.preventDefault();
        e.stopPropagation();
        onActionClick?.();
    }

    if (to != null) {
        return (
            <Link to={to} style={{ textDecoration: 'none' }} onClick={onClick}>
                <Card style={cardStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                    {cardContent}
                </Card>
            </Link>
        );
    }

    return (
        <Card style={cardStyle} onClick={onClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {cardContent}
        </Card>
    );
};

export default BaseCard;

/* eslint-enable react/jsx-no-bind */
