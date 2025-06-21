import type { PackageInfo } from '@jellyfin/sdk/lib/generated-client/models/package-info';

const getPackageCategories = (packages?: PackageInfo[]) => {
    if (!packages) return [];

    const categories: string[] = [];

    for (const pkg of packages) {
        if (pkg.category && !categories.includes(pkg.category)) {
            categories.push(pkg.category);
        }
    }

    return categories.sort((a, b) => a.localeCompare(b));
};

export default getPackageCategories;
