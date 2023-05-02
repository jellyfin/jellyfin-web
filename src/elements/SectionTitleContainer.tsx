import React, { FunctionComponent } from 'react';
import IconButtonElement from './IconButtonElement';
import SectionTitleLinkElement from './SectionTitleLinkElement';

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

            {isLinkVisible && <SectionTitleLinkElement
                className='raised button-alt headerHelpButton'
                title='Help'
                url={url}
            />}

        </div>
    );
};

export default SectionTitleContainer;
