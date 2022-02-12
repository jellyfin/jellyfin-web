import classNames from 'classnames';
import React, { FunctionComponent, PropsWithChildren } from 'react';

type IProps = PropsWithChildren<{
    className?: string;
}>

const CardText: FunctionComponent<IProps> = (props: IProps) => {
    return (
        <div className={classNames('cardText', props.className)}>
            {props.children}
        </div>
    );
};

export default CardText;
