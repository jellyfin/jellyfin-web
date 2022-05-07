import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';
import CheckBoxElement from './CheckBoxElement';

type IProps = {
    ContainerClassName?: string;
    HeaderTitle?: string;
    CheckBoxClassName?: string;
    CheckBoxTitle?: string;
    ListContainerClassName?: string;
    AccessClassName?: string;
    ListTitle?: string;
    Description?: string;
    children?: React.ReactNode
}

const AccessContainer: FunctionComponent<IProps> = ({ContainerClassName, HeaderTitle, CheckBoxClassName, CheckBoxTitle, ListContainerClassName, AccessClassName, ListTitle, Description, children }: IProps) => {
    return (
        <div className={ContainerClassName}>
            <h2>{globalize.translate(HeaderTitle)}</h2>
            <CheckBoxElement labelClassName='checkboxContainer' type='checkbox' className={CheckBoxClassName} title={CheckBoxTitle} />
            <div className={ListContainerClassName}>
                <div className={AccessClassName}>
                    <h3 className='checkboxListLabel'>
                        {globalize.translate(ListTitle)}
                    </h3>
                    <div className='checkboxList paperList' style={{
                        padding: '.5em 1em'
                    }}>
                        {children}
                    </div>
                </div>
                <div className='fieldDescription'>
                    {globalize.translate(Description)}
                </div>
            </div>
        </div>
    );
};

export default AccessContainer;
