import type { PackageInfo } from '@jellyfin/sdk/lib/generated-client/models/package-info';

const getPackagesByCategory = (packages: PackageInfo[] | undefined, category: string) => {
    if (!packages) return [];

    return packages
        .filter(pkg => pkg.category === category)
        .sort((a, b) => {
            if (a.name && b.name) {
                return a.name.localeCompare(b.name);
            } else {
                return 0;
            }
        });
};

export default getPackagesByCategory;
