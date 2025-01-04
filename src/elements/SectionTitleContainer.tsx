import React, { FunctionComponent } from 'react';
import IconButtonElement from './IconButtonElement';

type IProps = {
    SectionClassName?: string;
    title?: string;
    isBtnVisible?: boolean;
    btnId?: string;
    btnClassName?: string;
    btnTitle?: string;
    btnIcon?: string;
    onClick?: () => void;
};
const SectionTitleContainer: FunctionComponent<IProps> = ({ SectionClassName, title, isBtnVisible = false, btnId, btnClassName, btnTitle, btnIcon, onClick }: IProps) => {
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
                onClick={onClick}
            />}

        </div>
    );
};

export default SectionTitleContainer;
