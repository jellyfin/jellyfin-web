interface TextAction {
    url: string;
    title: string;
    cssClass?: string;
}
export interface MiscInfo {
    text?: string | number;
    textAction?: TextAction;
    cssClass?: string;
}
