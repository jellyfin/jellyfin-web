import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';
import CheckBoxElement from '../../../elements/CheckBoxElement';

type IProps = {
    containerClassName?: string;
    headerTitle?: string;
    checkBoxClassName?: string;
    checkBoxTitle?: string;
    listContainerClassName?: string;
    accessClassName?: string;
    listTitle?: string;
    description?: string;
    children?: React.ReactNode
};

const AccessContainer: FunctionComponent<IProps> = ({ containerClassName, headerTitle, checkBoxClassName, checkBoxTitle, listContainerClassName, accessClassName, listTitle, description, children }: IProps) => {
    return (
        <div className={containerClassName}>
            <h2>{globalize.translate(headerTitle)}</h2>
            <CheckBoxElement
                labelClassName='checkboxContainer'
                className={checkBoxClassName}
                title={checkBoxTitle}
            />
            <div className={listContainerClassName}>
                <div className={accessClassName}>
                    <h3 className='checkboxListLabel'>
                        {globalize.translate(listTitle)}
                    </h3>
                    <div className='checkboxList paperList' style={{
                        padding: '.5em 1em'
                    }}>
                        {children}
                    </div>
                </div>
                <div className='fieldDescription'>
                    {globalize.translate(description)}
                </div>
            </div>
        </div>
    );
};

export default AccessContainer;
