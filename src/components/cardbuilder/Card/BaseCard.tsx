import { DotsVerticalIcon } from '@radix-ui/react-icons';
import type { LinkProps } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import { AspectRatio, Box, Card, Flex, Heading, IconButton, Text } from 'ui-primitives';

interface BaseCardProps {
    title?: string;
    text?: string;
    image?: string | null;
    icon?: React.ReactNode;
    to?: LinkProps['to'];
    onClick?: () => void;
    action?: boolean;
    actionRef?: React.MutableRefObject<HTMLButtonElement | null>;
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
}: BaseCardProps) => {
    const cardContent = (
        <>
            <AspectRatio
                ratio="16/9"
                style={{ borderRadius: vars.borderRadius.sm, overflow: 'hidden' }}
            >
                {image ? (
                    <img src={image} loading="lazy" alt={title} />
                ) : (
                    <Box
                        className={getDefaultBackgroundClass(title)}
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
            <Flex
                style={{
                    paddingTop: vars.spacing['4'],
                    flexDirection: 'column',
                    gap: vars.spacing['4']
                }}
            >
                <Flex
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: vars.spacing['4']
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
                        {text && (
                            <Text
                                size="xs"
                                style={{
                                    wordBreak: 'break-all',
                                    marginTop: vars.spacing['2']
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
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onActionClick?.();
                            }}
                        >
                            <DotsVerticalIcon />
                        </IconButton>
                    )}
                </Flex>
            </Flex>
        </>
    );

    const cardStyle = {
        height: height || 'auto',
        width: width,
        transition: 'transform 0.2s, box-shadow 0.2s',
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

    if (to) {
        return (
            <Link to={to} style={{ textDecoration: 'none' }} onClick={onClick}>
                <Card
                    style={cardStyle}
                    onMouseEnter={(e: React.MouseEvent) => {
                        Object.assign((e.currentTarget as HTMLElement).style, hoverStyle);
                    }}
                    onMouseLeave={(e: React.MouseEvent) => {
                        const elem = e.currentTarget as HTMLElement;
                        elem.style.transform = '';
                        elem.style.boxShadow = '';
                        elem.style.borderColor = vars.colors.divider;
                        elem.style.backgroundColor = '';
                    }}
                >
                    {cardContent}
                </Card>
            </Link>
        );
    }

    return (
        <Card
            style={cardStyle}
            onClick={onClick}
            onMouseEnter={(e: React.MouseEvent) => {
                Object.assign((e.currentTarget as HTMLElement).style, hoverStyle);
            }}
            onMouseLeave={(e: React.MouseEvent) => {
                const elem = e.currentTarget as HTMLElement;
                elem.style.transform = '';
                elem.style.boxShadow = '';
                elem.style.borderColor = vars.colors.divider;
                elem.style.backgroundColor = '';
            }}
        >
            {cardContent}
        </Card>
    );
};

export default BaseCard;
