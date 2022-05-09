import React, { FunctionComponent } from 'react';
import SectionTitleButtonElement from './SectionTitleButtonElement';
import SectionTitleLinkElement from './SectionTitleLinkElement';

type IProps = {
    title: string;
    isBtnVisible?: boolean;
    titleLink?: string;
}

const SectionTitleContainer: FunctionComponent<IProps> = ({title, isBtnVisible = false, titleLink}: IProps) => {
    return (
        <div className='verticalSection'>
            <div className='sectionTitleContainer flex align-items-center'>
                <h2 className='sectionTitle'>
                    {title}
                </h2>

                {isBtnVisible && <SectionTitleButtonElement
                    className='fab btnAddUser submit sectionTitleButton'
                    title='ButtonAddUser'
                    icon='add'
                />}

                <SectionTitleLinkElement
                    className='raised button-alt headerHelpButton'
                    title='Help'
                    url={titleLink}
                />
            </div>
        </div>
    );
};

export default SectionTitleContainer;
