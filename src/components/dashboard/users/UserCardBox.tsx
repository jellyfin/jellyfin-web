/**
 * @deprecated This file is being migrated to React + ui-primitives patterns.
 *
 * Migration:
 * - Uses ui-primitives components (already partially migrated)
 * - Replace className strings with vanilla-extract styles
 * - Ensure proper TypeScript typing for all props
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FunctionComponent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleWithSuffix } from '../../../utils/dateFnsLocale';
import globalize from '../../../lib/globalize';
import { Card, CardBody } from 'ui-primitives';
import { Text, Heading } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { Avatar } from 'ui-primitives';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import { Link } from '@tanstack/react-router';
import * as styles from './UserCardBox.css.ts';

type IProps = {
    user?: UserDto;
    onMenuClick?: (e: React.MouseEvent<HTMLElement>) => void;
};

const getLastSeenText = (lastActivityDate?: string | null): string => {
    if (lastActivityDate) {
        try {
            return globalize.translate(
                'LastSeen',
                formatDistanceToNow(new Date(lastActivityDate), getLocaleWithSuffix())
            );
        } catch {
            return '';
        }
    }
    return '';
};

const UserCardBox: FunctionComponent<IProps> = ({ user = {}, onMenuClick }: IProps) => {
    const imgUrl =
        user.PrimaryImageTag && user.Id
            ? window.ApiClient.getUserImageUrl(user.Id, {
                  width: 300,
                  tag: user.PrimaryImageTag,
                  type: 'Primary'
              })
            : undefined;

    const lastSeen = getLastSeenText(user.LastActivityDate);
    const isDisabled = user.Policy?.IsDisabled;

    return (
        <Card className={`${styles.card} ${isDisabled ? styles.cardDisabled : ''}`}>
            <div className={styles.imageContainer}>
                <div className={styles.aspectRatio}>
                    {imgUrl ? (
                        <img src={imgUrl} alt={user.Name || ''} className={styles.userImage} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            <span>👤</span>
                        </div>
                    )}
                </div>
                {isDisabled && (
                    <div className={styles.disabledOverlay}>
                        <Text className={styles.disabledText}>{globalize.translate('LabelDisabled')}</Text>
                    </div>
                )}
            </div>
            <CardBody className={styles.cardContent}>
                <div className={styles.headerRow}>
                    <div className={styles.titleContainer}>
                        <Text weight="bold" className={styles.userName}>
                            {user.Name}
                        </Text>
                        <Text size="xs" color="secondary" className={styles.lastSeen}>
                            {lastSeen || '\u00A0'}
                        </Text>
                    </div>
                    <IconButton variant="plain" color="neutral" size="sm" onClick={onMenuClick}>
                        <DotsVerticalIcon />
                    </IconButton>
                </div>
            </CardBody>
        </Card>
    );
};

export default UserCardBox;
