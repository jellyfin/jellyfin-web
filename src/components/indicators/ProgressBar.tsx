import React, { FunctionComponent } from 'react';
import indicators from './indicators';

type IProps = {
    className?: string;
    progress: number;
}

const ProgressBar: FunctionComponent<IProps> = ({ className, progress }: IProps) => {
    return (
        <div className={className}
            // TODO: Remove dangerouslySetInnerHTML
            dangerouslySetInnerHTML={{__html: indicators.getProgressHtml(progress)}}
        />
    );
};

export default ProgressBar;
