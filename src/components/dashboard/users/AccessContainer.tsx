import { type FC, type PropsWithChildren } from 'react';
import globalize from '../../../lib/globalize';
import CheckBoxElement from '../../../elements/CheckBoxElement';

interface AccessContainerProps {
    containerClassName?: string;
    headerTitle?: string;
    checkBoxClassName?: string;
    checkBoxTitle?: string;
    listContainerClassName?: string;
    accessClassName?: string;
    listTitle?: string;
    description?: string;
}

const AccessContainer: FC<PropsWithChildren<AccessContainerProps>> = ({
    containerClassName,
    headerTitle,
    checkBoxClassName,
    checkBoxTitle,
    listContainerClassName,
    accessClassName,
    listTitle,
    description,
    children
}) => {
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
                    <div
                        className='checkboxList paperList'
                        style={{
                            padding: '.5em 1em'
                        }}
                    >
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
