import { useBrandingOptions } from 'apps/dashboard/features/branding/api/useBrandingOptions';

import { useUserSettings } from 'hooks/useUserSettings';
import React, { type FC } from 'react';

const CustomCss: FC = () => {
    const { data: brandingOptions } = useBrandingOptions();
    const { customCss: userCustomCss, disableCustomCss } = useUserSettings();

    return (
        <>
            {!disableCustomCss && brandingOptions?.CustomCss && (
                <style>{brandingOptions.CustomCss}</style>
            )}
            {userCustomCss && <style>{userCustomCss}</style>}
        </>
    );
};

export default CustomCss;
