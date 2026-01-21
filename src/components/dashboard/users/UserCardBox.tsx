import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FunctionComponent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleWithSuffix } from '../../../utils/dateFnsLocale';
import globalize from '../../../lib/globalize';
import { Card, CardBody } from 'ui-primitives/Card';
import { Text, Heading } from 'ui-primitives/Text';
import { IconButton } from 'ui-primitives/IconButton';
import { Avatar } from 'ui-primitives/Avatar';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Link } from 'react-router-dom';
import * as styles from './UserCardBox.css';

type IProps = {
    user?: UserDto;
    onMenuClick?: (e: React.MouseEvent<HTMLElement>) => void;
};

const getLastSeenText = (lastActivityDate?: string | null) => {
    if (lastActivityDate) {
        try {
            return globalize.translate('LastSeen', formatDistanceToNow(new Date(lastActivityDate), getLocaleWithSuffix()));
        } catch (e) {
            return '';
        }
    }
    return '';
};

const UserCardBox: FunctionComponent<IProps> = ({ user = {}, onMenuClick }: IProps) => {
    let imgUrl;

    if (user.PrimaryImageTag && user.Id) {
        imgUrl = window.ApiClient.getUserImageUrl(user.Id, {
            width: 300,
            tag: user.PrimaryImageTag,
            type: 'Primary'
        });
    }

    const lastSeen = getLastSeenText(user.LastActivityDate);
    const isDisabled = user.Policy?.IsDisabled;

    return (
        <Card
            className={`${styles.card} ${isDisabled ? styles.cardDisabled : ''}`}
        >
            <div className={styles.imageContainer}>
                <Link to={`/dashboard/users/profile?userId=${user.Id}`}>
                    <div className={styles.aspectRatio}>
                        {imgUrl ? (
                            <img src={imgUrl} alt={user.Name || ''} className={styles.userImage} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                <span>👤</span>
                            </div>
                        )}
                    </div>
                </Link>
                {isDisabled && (
                    <div className={styles.disabledOverlay}>
                        <Text className={styles.disabledText}>{globalize.translate('LabelDisabled')}</Text>
                    </div>
                )}
            </div>
            <CardBody className={styles.cardContent}>
                <div className={styles.headerRow}>
                    <div className={styles.titleContainer}>
                        <Text weight="bold" className={styles.userName}>{user.Name}</Text>
                        <Text size="xs" color="secondary" className={styles.lastSeen}>
                            {lastSeen || '\u00A0'}
                        </Text>
                    </div>
                    <IconButton
                        variant="plain"
                        color="neutral"
                        size="sm"
                        onClick={onMenuClick}
                    >
                        <MoreVertIcon />
                    </IconButton>
                </div>
            </CardBody>
        </Card>
    );
};

export default UserCardBox;