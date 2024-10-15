import React, { FunctionComponent } from 'react';
import IconButtonElement from './IconButtonElement';
import LinkButton from './emby-button/LinkButton';
import globalize from 'lib/globalize';

type IProps = {
    SectionClassName?: string;
    title?: string;
    isBtnVisible?: boolean;
    btnId?: string;
    btnClassName?: string;
    btnTitle?: string;
    btnIcon?: string;
    isLinkVisible?: boolean;
    url?: string;
};
const SectionTitleContainer: FunctionComponent<IProps> = ({ SectionClassName, title, isBtnVisible = false, btnId, btnClassName, btnTitle, btnIcon, isLinkVisible = true, url }: IProps) => {
    return (
        <div className={`${SectionClassName} sectionTitleContainer flex align-items-center`}>
            <h2 className='sectionTitle'>
                {title}
            </h2>

            {isBtnVisible && <IconButtonElement
                is='emby-button'
                id={btnId}
                className={btnClassName}
                title={btnTitle}
                icon={btnIcon}
            />}

            {isLinkVisible && <LinkButton
                className='raised button-alt headerHelpButton'
                target='_blank'
                rel='noopener noreferrer'
                href={url}>
                {globalize.translate('Help')}
            </LinkButton>}

        </div>
    );
};

export default SectionTitleContainer;
