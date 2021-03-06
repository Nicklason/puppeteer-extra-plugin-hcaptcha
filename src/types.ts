// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./puppeteer-mods.d.ts" />

export type PluginPageAdditions = {
    /** Attempt to find all hCaptchas on this page */
    findHcaptchas: () => Promise<CaptchaInfo[]>;

    /**
     * Click on captchas
     */
    clickOnHcaptchas: (captchas: CaptchaInfo[]) => Promise<void>;

    /* Get solutions for captchas */
    getHcaptchaSolutions: (
        captchas: CaptchaInfo[],
        proxyUrl: string,
        proxyType: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5',
        provider?: SolutionProvider
    ) => Promise<CaptchaSolution[]>;

    /* Enter captcha solutions */
    enterHcaptchaSolutions: (
        solutions: CaptchaSolution[]
    ) => Promise<CaptchaSolved[]>;

    /* Find and solve captchas on page */
    solveHcaptchas: (
        proxyUrl: string,
        proxyType: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5'
    ) => Promise<SolveRecaptchasResult>;
};

export interface CaptchaInfo {
    id: string;
    sitekey: string;
    url: string;
}

export interface CaptchaSolution {
    id: string;
    text: string;
    providerId: string;
    providerCaptchaId: string;
    requestAt: Date;
    responseAt: Date;
    duration: number;
}

export interface CaptchaSolved {
    id: string;
}

export interface SolveRecaptchasResult {
    captchas: CaptchaInfo[];
    solutions: CaptchaSolution[];
    solved: CaptchaSolved[];
}

export interface PluginOptions {
    visualFeedback?: boolean;
    provider: SolutionProvider;
}

export interface ContentScriptOpts {
    visualFeedback: boolean;
}

export interface ContentScriptData {
    captchas?: CaptchaInfo[];
    solutions?: CaptchaSolution[];
}

export interface SolutionProvider {
    id: string;
    apiKey?: string;
    fn?: (
        captchas: CaptchaInfo[],
        proxyUrl: string,
        proxyType: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5',
        apiKey?: string
    ) => Promise<CaptchaSolution[]>;
}
