import React, { FC, useEffect, useState } from 'react';

import { useApi } from 'hooks/useApi';
import { useUserSettings } from 'hooks/useUserSettings';

const CustomCss: FC = () => {
    const { api } = useApi();
    const { customCss: userCustomCss, disableCustomCss } = useUserSettings();
    const [ brandingCssUrl, setBrandingCssUrl ] = useState<string>();

    useEffect(() => {
        if (!api) return;

        setBrandingCssUrl(api.getUri('/Branding/Css.css'));
    }, [ api ]);

    if (!api) return null;

    return (
        <>
            {!disableCustomCss && brandingCssUrl && (
                <link
                    rel='stylesheet'
                    type='text/css'
                    href={brandingCssUrl}
                />
            )}
            {userCustomCss && (
                <style>
                    {userCustomCss}
                </style>
            )}
        </>
    );
};

export default CustomCss;
