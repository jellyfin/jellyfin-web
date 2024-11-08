import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import classNames from 'classnames';
import { formatDistanceToNow } from 'date-fns';
import React, { type FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { imageHooks } from 'hooks/api';
import globalize from 'lib/globalize';
import { getLocaleWithSuffix } from 'utils/dateFnsLocale';
import { getDefaultBackgroundClass } from 'components/cardbuilder/cardBuilderUtils';
import ShowUserMenuButton from './ShowUserMenuButton';
import Media from 'components/common/Media';

interface UserCardBoxProps {
    user: UserDto;
}

const UserCardBox: FC<UserCardBoxProps> = ({ user }) => {
    const { data: imgUrl } = imageHooks.useGetUserImageUrl(user, {
        tag: user?.PrimaryImageTag || ''
    });

    const cardClass = classNames(
        'card squareCard scalableCard squareCard-scalable',
        { grayscale: user.Policy?.IsDisabled }
    );

    const cardImageClass = classNames(
        'cardImage',
        { disabledUser: user.Policy?.IsDisabled },
        { [getDefaultBackgroundClass(user.Name)]: !imgUrl },
        { 'flex align-items-center justify-content-center': !imgUrl }
    );

    return (
        <Box className={cardClass}>
            <Box className='cardBox visualCardBox'>
                <Box className='cardScalable visualCardBox-cardScalable'>
                    <Box className='cardPadder cardPadder-square'></Box>
                    <Link
                        component={RouterLink}
                        to={`/dashboard/users/settings/profile?userId=${user.Id}`}
                        className='cardContent'
                        sx={{
                            color: 'inherit'
                        }}
                    >
                        <Box className={cardImageClass}>
                            <Media
                                item={user}
                                imgUrl={imgUrl}
                                defaultCardImageIcon='person'
                            />
                        </Box>
                    </Link>
                </Box>
                <Box className='cardFooter visualCardBox-cardFooter'>
                    <Box
                        sx={{
                            textAlign: 'right',
                            float: 'right',
                            paddingTop: '5px'
                        }}
                    >
                        <ShowUserMenuButton user={user} />
                    </Box>

                    <Box className='cardText'>{user.Name}</Box>

                    <Box className='cardText cardText-secondary'>
                        {user.LastActivityDate ? (
                            globalize.translate(
                                'LastSeen',
                                formatDistanceToNow(
                                    Date.parse(user.LastActivityDate),
                                    getLocaleWithSuffix()
                                )
                            )
                        ) : (
                            <>&nbsp;</>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default UserCardBox;
