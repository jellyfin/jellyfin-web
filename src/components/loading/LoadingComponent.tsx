import { type FC, useEffect } from 'react';

import loading from './loading';

const Loading: FC = () => {
    useEffect(() => {
        loading.show();

        return () => {
            loading.hide();
        };
    }, []);

    return null;
};

export default Loading;
