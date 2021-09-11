import { formatDistanceToNow } from 'date-fns';
import { localeWithSuffix } from '../../../../scripts/dfnshelper';
import globalize from '../../../../scripts/globalize';
import cardBuilder from '../../../cardbuilder/cardBuilder';

import React, { FunctionComponent } from 'react';

const createLinkElement = ({ user, imgUrl, imageClass }) => ({
    __html: `<a
    is="emby-linkbutton"
    class="cardContent"
    href="#!/useredit.html?userId=${user.Id}"
    >
    ${imgUrl ? (
        `<div class='${imageClass}' style='background-image:url(${imgUrl})'>`
    ) : (
        `<div class='${imageClass} ${cardBuilder.getDefaultBackgroundClass(user.Name)} flex align-items-center justify-content-center'>
            <span class='material-icons cardImageIcon person'></span>
        </div>`
    )}
    </div>
    </a>`
});

const createButtonElement = () => ({
    __html: `<button
        is="paper-icon-button-light"
        type="button"
        class="btnUserMenu flex-shrink-zero"
        >
        <span class="material-icons more_vert"></span>
    </button>`
});

interface UserCardBoxProps {
    user: object;
  }

const getLastSeenText = (lastActivityDate) => {
    if (lastActivityDate) {
        return globalize.translate('LastSeen', formatDistanceToNow(Date.parse(lastActivityDate), localeWithSuffix));
    }

    return '';
};

const UserCardBox: FunctionComponent<UserCardBoxProps> = ({ user }) => {
    let cssClass = 'card squareCard scalableCard squareCard-scalable';

    if (user.Policy.IsDisabled) {
        cssClass += ' grayscale';
    }

    let imgUrl;

    if (user.PrimaryImageTag) {
        imgUrl = window.ApiClient.getUserImageUrl(user.Id, {
            width: 300,
            tag: user.PrimaryImageTag,
            type: 'Primary'
        });
    }

    let imageClass = 'cardImage';

    if (user.Policy.IsDisabled) {
        imageClass += ' disabledUser';
    }

    const lastSeen = getLastSeenText(user.LastActivityDate);

    return (
        <div data-userid={user.Id} className={cssClass}>
            <div className='cardBox visualCardBox'>
                <div className='cardScalable visualCardBox-cardScalable'>
                    <div className='cardPadder cardPadder-square'></div>
                    <div
                        dangerouslySetInnerHTML={createLinkElement({
                            user: user,
                            imgUrl: imgUrl,
                            imageClass: imageClass
                        })}
                    />
                </div>
                <div className='cardFooter visualCardBox-cardFooter'>
                    <div className='cardText flex align-items-center'>
                        <div className='flex-grow' style={{overflow: 'hidden', textoverflow: 'ellipsis'}}>
                            {user.Name}
                        </div>
                        <div
                            dangerouslySetInnerHTML={createButtonElement()}
                        />
                    </div>
                    <div className='cardText cardText-secondary'>
                        {lastSeen != '' ? lastSeen : '&nbsp'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserCardBox;
