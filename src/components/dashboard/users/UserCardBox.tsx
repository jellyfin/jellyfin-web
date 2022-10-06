import type { UserDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import React, { FunctionComponent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getLocaleWithSuffix } from '../../../scripts/dfnshelper';
import globalize from '../../../scripts/globalize';
import cardBuilder from '../../cardbuilder/cardBuilder';

const createLinkElement = ({ user, renderImgUrl }: { user: UserDto, renderImgUrl: string }) => ({
    __html: `<a
        is="emby-linkbutton"
        class="cardContent"
        href="#!/useredit.html?userId=${user.Id}"
        >
        ${renderImgUrl}
    </a>`
});

const createButtonElement = () => ({
    __html: `<button
        is="paper-icon-button-light"
        type="button"
        class="btnUserMenu flex-shrink-zero"
        >
        <span class="material-icons more_vert" aria-hidden="true"></span>
    </button>`
});

type IProps = {
    user?: UserDto;
}

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
        `<div class='${imageClass}' style='background-image:url(${imgUrl})'></div>` :
        `<div class='${imageClass} ${cardBuilder.getDefaultBackgroundClass(user.Name)} flex align-items-center justify-content-center'>
            <span class='material-icons cardImageIcon person' aria-hidden='true'></span>
        </div>`;

    return (
        <div data-userid={user.Id} className={cssClass}>
            <div className='cardBox visualCardBox'>
                <div className='cardScalable visualCardBox-cardScalable'>
                    <div className='cardPadder cardPadder-square'></div>
                    <div
                        dangerouslySetInnerHTML={createLinkElement({
                            user: user,
                            renderImgUrl: renderImgUrl
                        })}
                    />
                </div>
                <div className='cardFooter visualCardBox-cardFooter'>
                    <div className='cardText flex align-items-center'>
                        <div className='flex-grow' style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {user.Name}
                        </div>
                        <div
                            dangerouslySetInnerHTML={createButtonElement()}
                        />
                    </div>
                    <div className='cardText cardText-secondary'>
                        {lastSeen != '' ? lastSeen : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserCardBox;
