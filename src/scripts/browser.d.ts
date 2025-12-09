declare function supportsCssAnimation(allowPrefix?: boolean): boolean;
let version: string | undefined;
let versionMajor: number;

/**
 * Browser detection utility.
 */
declare namespace browser {
    export { version };
    export { versionMajor };
    export let edge: boolean;
    export let edgeChromium: boolean;
    export let firefox: boolean;
    export let safari: boolean;
    export let osx: boolean;
    export let ipad: boolean;
    export let ps4: boolean;
    export let tv: boolean;
    export let mobile: boolean;
    export let xboxOne: boolean;
    export let animate: boolean;
    export let hisense: boolean;
    export let tizen: boolean;
    export let vidaa: boolean;
    export let web0s: boolean;
    export let titanos: boolean;
    export let edgeUwp: boolean;
    export let web0sVersion: number | undefined;
    export let tizenVersion: number | undefined;
    export let orsay: boolean;
    export let operaTv: boolean;
    export let slow: boolean;
    export let touch: boolean;
    export let keyboard: boolean;
    export { supportsCssAnimation };
    export let iOS: boolean;
    export let iOSVersion: number | undefined;
}

export function detectBrowser(userAgent?: string): browser;

export default browser;
