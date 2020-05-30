// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as mods from './puppeteer-mods';

export type PluginPageAdditions = {
    /** Attempt to find all hCaptchas on this page */
    findHcaptchas: () => Promise<CaptchaInfo[]>;

    /* Get solutions for captchas */
    getHcaptchaSolutions: (
        captchas: CaptchaInfo[],
        provider?: SolutionProvider
    ) => Promise<CaptchaSolution[]>;

    /* Enter captcha solutions */
    enterHcaptchaSolutions: (
        solutions: CaptchaSolution[]
    ) => Promise<CaptchaSolved[]>;

    /* Find and solve captchas on page */
    solveHcaptchas: () => Promise<SolveRecaptchasResult>;
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
    solutions?: CaptchaSolution[];
}

export interface SolutionProvider {
    id: string;
    apiKey?: string;
    fn?: (
        captchas: CaptchaInfo[],
        apiKey?: string
    ) => Promise<CaptchaSolution[]>;
}
