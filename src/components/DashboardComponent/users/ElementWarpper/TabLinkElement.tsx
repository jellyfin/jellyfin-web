import React, { FunctionComponent } from 'react';
import globalize from '../../../../scripts/globalize';

type IProps = {
    tabTitle?: string;
    className?: string;
    url?: string
}

const createLinkElement = ({ className, tabTitle, url }: IProps) => ({
    __html: `<a
    href="#"
    is="emby-linkbutton"
    data-role="button"
    class="${className}"
    onclick="Dashboard.navigate('${url}', true);"
    >
    ${globalize.translate(tabTitle)}
    </a>`
});

const TabLinkElement: FunctionComponent<IProps> = ({ className, tabTitle, url }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createLinkElement({
                className: className,
                tabTitle: tabTitle,
                url: url
            })}
        />
    );
};

export default TabLinkElement;
