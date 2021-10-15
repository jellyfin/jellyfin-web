// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

type IProps = {
    tabTitle?: string;
    activeTab?: boolean;
    onClick()
}

const createLinkElement = ({ className, tabTitle }) => ({
    __html: `<a
        href="#"
        is="emby-linkbutton"
        data-role="button"
        class="${className}"
        >
        ${tabTitle}
    </a>`
});

const TabLinkElement: FunctionComponent<IProps> = ({ tabTitle, onClick, ...restactiveTab }: IProps) => {
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div
            onClick={onClick}
            dangerouslySetInnerHTML={createLinkElement({
                className: restactiveTab.activeTab ? 'ui-btn-active' : '',
                tabTitle: globalize.translate(tabTitle)
            })}
        />
    );
};

export default TabLinkElement;
