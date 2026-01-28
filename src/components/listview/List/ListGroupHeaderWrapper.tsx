import React, { type FC, type PropsWithChildren } from 'react';
import { Text } from 'ui-primitives';

interface ListGroupHeaderWrapperProps {
    index?: number;
}

const ListGroupHeaderWrapper: FC<PropsWithChildren<ListGroupHeaderWrapperProps>> = ({ index, children }) => {
    if (index === 0) {
        return (
            <Text as="h2" size="xxl" weight="bold" className="listGroupHeader listGroupHeader-first">
                {children}
            </Text>
        );
    } else {
        return (
            <Text as="h2" size="xxl" weight="bold" className="listGroupHeader">
                {children}
            </Text>
        );
    }
};

export default ListGroupHeaderWrapper;
