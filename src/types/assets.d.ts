declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.scss' {
    // Style imports are handled by the bundler.
    const value: string;
    export default value;
}
