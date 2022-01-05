import React, { FunctionComponent } from 'react';
import SectionTitleLinkElement from './SectionTitleLinkElement';

type IProps = {
    title: string;
}

const SectionTitleContainer: FunctionComponent<IProps> = ({title}: IProps) => {
    return (
        <div className='verticalSection'>
            <div className='sectionTitleContainer flex align-items-center'>
                <h2 className='sectionTitle'>
                    {title}
                </h2>
                <SectionTitleLinkElement
                    className='raised button-alt headerHelpButton'
                    title='Help'
                    url='https://docs.jellyfin.org/general/server/users/'
                />
            </div>
        </div>
    );
};

export default SectionTitleContainer;
