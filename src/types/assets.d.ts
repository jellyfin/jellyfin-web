export declare global {
    declare module '*.png' {
        const value: any;
        export = value;
    }
    declare module '*.scss' {
        const content: { [className: string]: string };
        export default content;
    }
}
