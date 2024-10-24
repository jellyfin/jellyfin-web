export declare global {
    declare module '*.png' {
        const value: never;
        export = value;
    }
    declare module '*.scss' {
        const content: { [className: string]: string };
        export default content;
    }
}
