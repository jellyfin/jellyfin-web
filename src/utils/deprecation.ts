import { logger } from './logger';

export function deprecate(componentName: string, replacement: string, filePath?: string): void {
    const location = filePath ? ` in ${filePath}` : '';
    logger.warn(`${componentName} is deprecated${location}. Please use ${replacement} instead.`, {
        component: 'Deprecation',
        type: 'component-deprecation',
        deprecatedComponent: componentName,
        replacement,
        filePath
    });
}

export function getDeprecationMessage(
    componentName: string,
    replacement: string,
    filePath?: string
): string {
    const location = filePath ? ` in ${filePath}` : '';
    return `[DEPRECATION] ${componentName} is deprecated${location}. Please use ${replacement} instead. The emby-* components will be removed in a future version.`;
}
