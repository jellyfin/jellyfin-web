import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { FunctionComponent } from 'react';
import { formatDistanceToNow } from 'date-fns';;
import { getLocaleWithSuffix } from '../../../utils/dateFnsLocale';
import globalize from '../../../lib/globalize';
import IconButtonElement from '../../../elements/IconButtonElement';
import LinkButton from '../../../elements/emby-button/LinkButton';
import { getDefaultBackgroundClass } from '../../cardbuilder/cardBuilderUtils';

type IProps = {
    user?: UserDto;
};

const getLastSeenText = (lastActivityDate?: string | null) => {
    if (lastActivityDate) {
        return globalize.translate('LastSeen', formatDistanceToNow(Date.parse(lastActivityDate), getLocaleWithSuffix()));
    }

    return '';
};

const UserCardBox: FunctionComponent<IProps> = ({ user = {} }: IProps) => {
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

    const renderImgUrl = imgUrl ?
        <div className={imageClass} style={{ backgroundImage: `url(${imgUrl})` }} /> :
        <div className={`${imageClass} ${getDefaultBackgroundClass(user.Name)} flex align-items-center justify-content-center`}>
            <span className='material-icons cardImageIcon person' aria-hidden='true'></span>
        </div>;

    return (
        <div data-userid={user.Id} data-username={user.Name} className={cssClass}>
            <div className='cardBox visualCardBox'>
                <div className='cardScalable visualCardBox-cardScalable'>
                    <div className='cardPadder cardPadder-square'></div>
                    <LinkButton
                        className='cardContent'
                        href={`#/dashboard/users/profile?userId=${user.Id}`}>
                        {renderImgUrl}
                    </LinkButton>
                </div>
                <div className='cardFooter visualCardBox-cardFooter'>
                    <div
                        style={{ textAlign: 'right', float: 'right', paddingTop: '5px' }}
                    >
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnUserMenu flex-shrink-zero'
                            icon='more_vert'
                        />
                    </div>
                    <div className='cardText'>
                        <span>{user.Name}</span>
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
