import React, { type FC, type PropsWithChildren } from 'react';
import Box from '@mui/material/Box';

interface ListContentWrapperProps {
    itemOverview: string | null | undefined;
    enableContentWrapper?: boolean;
    enableOverview?: boolean;
}

const ListContentWrapper: FC<PropsWithChildren<ListContentWrapperProps>> = ({
    itemOverview,
    enableContentWrapper,
    enableOverview,
    children
}) => {
    if (enableContentWrapper) {
        return (
            <>
                <Box className='listItem-content'>{children}</Box>

                {enableOverview && itemOverview && (
                    <Box className='listItem-bottomoverview secondary'>
                        <bdi>{itemOverview}</bdi>
                    </Box>
                )}
            </>
        );
    } else {
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <>{children}</>;
    }
};

export default ListContentWrapper;
