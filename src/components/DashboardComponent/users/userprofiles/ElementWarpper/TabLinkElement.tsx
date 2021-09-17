import React, { FunctionComponent } from 'react';
import globalize from '../../../../../scripts/globalize';

type IProps = {
    tabTitle: string;
    className?: string;
    navigateto: string
}

const createLinkElement = ({ className, tabTitle, url }) => ({
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

const TabLinkElement: FunctionComponent<IProps> = ({ className, tabTitle, navigateto }: IProps) => {
    return (
        <div
            dangerouslySetInnerHTML={createLinkElement({
                className: className,
                tabTitle: tabTitle,
                url: navigateto
            })}
        />
    );
};

export default TabLinkElement;
