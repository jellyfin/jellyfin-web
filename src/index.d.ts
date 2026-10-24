declare module '*.png' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: any;
    export = value;
}

declare module '*.scss' {
    // style imports are handled by the bundler
    const value: string;
    export default value;
}

declare module 'ua-parser-js/enums' {
    export { BrowserName, BrowserType, CPUArch, DeviceType, DeviceVendor, EngineName, OSName } from 'ua-parser-js/src/enums/ua-parser-enums';
}
