import React from 'react';
import type { PackageInfo } from '@jellyfin/sdk/lib/generated-client/models/package-info';
import ExtensionIcon from '@mui/icons-material/Extension';
import BaseCard from 'apps/dashboard/components/BaseCard';
import { useLocation } from 'react-router-dom';

type IProps = {
    pkg: PackageInfo;
};

const PackageCard = ({ pkg }: IProps) => {
    const location = useLocation();

    return (
        <BaseCard
            title={pkg.name}
            image={pkg.imageUrl}
            icon={<ExtensionIcon sx={{ width: 80, height: 80 }} />}
            to={{
                pathname: `/dashboard/plugins/${pkg.guid}`,
                search: `?name=${encodeURIComponent(pkg.name || '')}`,
                hash: location.hash
            }}
        />
    );
};

export default PackageCard;
