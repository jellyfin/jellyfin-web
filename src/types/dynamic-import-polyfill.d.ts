declare module '@uupaa/dynamic-import-polyfill' {
    // Resolves with the module namespace object of the module at `url`.
    export function importModule<T = unknown>(url: string): Promise<T>;
    export default importModule;
}
