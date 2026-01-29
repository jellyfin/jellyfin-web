import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import { BellIcon } from '@radix-ui/react-icons';
import ListItemLink from 'components/ListItemLink';
import { formatRelative } from 'date-fns';
import React, { useMemo } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Avatar,
    Box,
    Flex,
    List,
    ListItem,
    ListItemContent,
    ListItemDecorator,
    Text
} from 'ui-primitives';
import { getLocale } from 'utils/dateFnsLocale';

interface ActivityListItemProps {
    item: ActivityLogEntry;
    displayShortOverview: boolean;
    to: string;
}

const ActivityListItem = ({ item, displayShortOverview, to }: ActivityListItemProps) => {
    const relativeDate = useMemo(() => {
        if (item.Date) {
            try {
                return formatRelative(new Date(item.Date), Date.now(), { locale: getLocale() });
            } catch (e) {
                return 'N/A';
            }
        } else {
            return 'N/A';
        }
    }, [item.Date]);

    const severity = item.Severity || LogLevel.Information;
    const color =
        severity === LogLevel.Error
            ? 'danger'
            : severity === LogLevel.Warning
              ? 'warning'
              : 'primary';

    return (
        <ListItem style={{ padding: 0 }}>
            <ListItemLink
                to={to}
                style={{
                    width: '100%',
                    paddingTop: vars.spacing['4'],
                    paddingBottom: vars.spacing['4'],
                    paddingLeft: vars.spacing['5'],
                    paddingRight: vars.spacing['5']
                }}
            >
                <ListItemDecorator>
                    <Avatar variant="soft" color={color}>
                        <BellIcon />
                    </Avatar>
                </ListItemDecorator>

                <ListItemContent>
                    <Text
                        size="sm"
                        style={{
                            whiteSpace: 'pre-wrap',
                            fontWeight: vars.typography.fontWeightBold,
                            color: vars.colors.text
                        }}
                    >
                        {item.Name}
                    </Text>
                    <Flex style={{ gap: vars.spacing['2'] }}>
                        <Text size="xs" color="secondary">
                            {relativeDate}
                        </Text>
                        {displayShortOverview && item.ShortOverview && (
                            <Text
                                size="xs"
                                color="secondary"
                                style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {item.ShortOverview}
                            </Text>
                        )}
                    </Flex>
                </ListItemContent>
            </ListItemLink>
        </ListItem>
    );
};

export default ActivityListItem;
