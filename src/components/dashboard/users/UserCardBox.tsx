import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FC } from 'react';
import escapeHTML from 'escape-html';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleWithSuffix } from '../../../utils/dateFnsLocale';
import globalize from '../../../scripts/globalize';
import cardBuilder from '../../cardbuilder/cardBuilder';
import IconButton from '../../../elements/emby-button/IconButton';
import LinkButton from '../../../elements/emby-button/LinkButton';
import classNames from 'classnames';

interface UserCardBoxProps {
    user?: UserDto;
}

const getLastSeenText = (lastActivityDate?: string | null) => {
    if (lastActivityDate) {
        return globalize.translate('LastSeen', formatDistanceToNow(Date.parse(lastActivityDate), getLocaleWithSuffix()));
    }

    return '';
};

const UserCardBox: FC<UserCardBoxProps> = ({ user = {} }) => {
    let cssClass = 'card squareCard scalableCard squareCard-scalable';

    if (user.Policy?.IsDisabled) {
        cssClass += ' grayscale';
    }

    let imgUrl;

    if (user.PrimaryImageTag && user.Id) {
        imgUrl = window.ApiClient.getUserImageUrl(user.Id, {
            width: 300,
            tag: user.PrimaryImageTag,
            type: 'Primary'
        });
    }

    let imageClass = 'cardImage';

    if (user.Policy?.IsDisabled) {
        imageClass += ' disabledUser';
    }

    const lastSeen = getLastSeenText(user.LastActivityDate);

    return (
        <div data-userid={user.Id} className={cssClass}>
            <div className='cardBox visualCardBox'>
                <div className='cardScalable visualCardBox-cardScalable'>
                    <div className='cardPadder cardPadder-square'></div>
                    <LinkButton
                        className='cardContent'
                        href={`#/useredit.html?userId=${user.Id}`}
                    >
                        {
                            imgUrl ? (
                                <div className={imageClass} style={{backgroundImage: `url(${imgUrl})`}}></div>
                            ) :
                                (
                                    <div className={classNames(imageClass, cardBuilder.getDefaultBackgroundClass(user.Name), 'flex align-items-center justify-content-center')}>
                                        <span className='material-icons cardImageIcon person' aria-hidden='true'></span>
                                    </div>
                                )
                        }
                    </LinkButton>
                </div>
                <div className='cardFooter visualCardBox-cardFooter'>
                    <div
                        style={{textAlign: 'right', float: 'right', paddingTop: '5px'}}
                    >
                        <IconButton
                            type='button'
                            className='btnUserMenu flex-shrink-zero'
                            icon='more_vert'
                        />
                    </div>
                    <div className='cardText'>
                        <span>{escapeHTML(user.Name)}</span>
                    </div>
                    <div className='cardText cardText-secondary'>
                        <span>{lastSeen != '' ? lastSeen : ''}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserCardBox;
