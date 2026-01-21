// browser.d.ts
declare module '@/scripts/browser' {
    interface Browser {
        tv: boolean;
        [key: string]: boolean;
    }

    const browser: Browser;
    export default browser;
}
