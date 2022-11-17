import React, { FC } from 'react';
import globalize from '../scripts/globalize';
import IconButton from './emby-button/IconButton';
import LinkButton from './emby-button/LinkButton';

interface SectionTitleContainerProps {
    SectionClassName?: string;
    title?: string | null;
    isBtnVisible?: boolean;
    btnId?: string;
    btnClassName?: string;
    btnTitle?: string;
    btnIcon?: string;
    isLinkVisible?: boolean;
    url?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const SectionTitleContainer: FC<SectionTitleContainerProps> = ({
    SectionClassName,
    title,
    isBtnVisible = false,
    btnId,
    btnClassName,
    btnTitle,
    btnIcon,
    isLinkVisible = true,
    url,
    onClick
}) => {
    return (
        <div className={`${SectionClassName} sectionTitleContainer flex align-items-center`}>
            <h2 className='sectionTitle'>
                {title}
            </h2>

            {isBtnVisible && <IconButton
                type='button'
                id={btnId}
                className={btnClassName}
                title={btnTitle}
                icon={btnIcon}
                onClick={onClick}
            />}

            {isLinkVisible && <LinkButton
                className='raised button-alt headerHelpButton'
                rel='noopener noreferrer'
                target='_blank'
                href={url}
            >
                {globalize.translate('Help')}
            </LinkButton>
            }

        </div>
    );
};

export default SectionTitleContainer;
