import React, { FunctionComponent } from 'react';
import SectionTitleButtonElement from './SectionTitleButtonElement';
import SectionTitleLinkElement from './SectionTitleLinkElement';

type IProps = {
    title?: string;
    isBtnVisible?: boolean;
    btnTitle?: string;
    btnId?: string;
    isLinkVisible?: boolean;
    titleLink?: string;
}

const SectionTitleContainer: FunctionComponent<IProps> = ({title, isBtnVisible = false, btnTitle, btnId, isLinkVisible = true, titleLink}: IProps) => {
    return (
        <div className='sectionTitleContainer flex align-items-center'>
            <h2 className='sectionTitle'>
                {title}
            </h2>

            {isBtnVisible && <SectionTitleButtonElement
                id={btnId}
                className='fab submit sectionTitleButton'
                title={btnTitle}
                icon='add'
            />}

            {isLinkVisible && <SectionTitleLinkElement
                className='raised button-alt headerHelpButton'
                title='Help'
                url={titleLink}
            />}

        </div>
    );
};

export default SectionTitleContainer;
