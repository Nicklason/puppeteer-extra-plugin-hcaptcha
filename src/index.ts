import { PuppeteerExtraPlugin } from 'puppeteer-extra-plugin';

import { Browser, Page, Frame } from 'puppeteer';

import * as types from './types';

import { HcaptchaContentScript } from './content';

import * as TwoCaptcha from './providers/2captcha';

export const BuiltinSolutionProviders: types.SolutionProvider[] = [
    {
        id: TwoCaptcha.PROVIDER_ID,
        fn: TwoCaptcha.getSolutions
    }
];

class PuppeteerExtraPluginHcaptcha extends PuppeteerExtraPlugin {
    private provider: types.SolutionProvider;

    constructor(opts: types.PluginOptions) {
        super(opts);

        this.provider = opts.provider;
    }

    get name(): string {
        return 'hcaptcha';
    }

    get contentScriptOpts(): types.ContentScriptOpts {
        const { visualFeedback } = this.opts;
        return {
            visualFeedback
        };
    }

    onPageCreated(page: Page): Promise<void> {
        return new Promise(() => {
            page.setBypassCSP(true);

            this._addCustomMethods(page);

            page.on('frameattached', (frame) => {
                if (!frame) {
                    return;
                }
                this._addCustomMethods(frame);
            });
        });
    }

    async onBrowser(browser: Browser): Promise<void> {
        const pages = await browser.pages();
        for (const page of pages) {
            this._addCustomMethods(page);
        }
    }

    private _addCustomMethods(page: Page | Frame): void {
        page.findHcaptchas = async (): Promise<types.CaptchaInfo[]> =>
            this.findHcaptchas(page);

        page.getHcaptchaSolutions = async (
            captchas: types.CaptchaInfo[],
            provider?: types.SolutionProvider
        ): Promise<types.CaptchaSolution[]> => {
            return this.getHcaptchaSolutions(captchas, provider);
        };

        page.enterHcaptchaSolutions = async (
            solutions: types.CaptchaSolution[]
        ): Promise<types.CaptchaSolved[]> => {
            return this.enterHcaptchaSolutions(page, solutions);
        };

        page.solveHcaptchas = async (): Promise<types.SolveRecaptchasResult> =>
            this.solveHcaptchas(page);
    }

    private async findHcaptchas(
        page: Page | Frame
    ): Promise<types.CaptchaInfo[]> {
        const hasScriptTag = !!(await page.$(
            'script[src^="https://hcaptcha.com/1/api.js"]'
        ));

        if (hasScriptTag) {
            // Wait for captcha script to be loaded
            await page.waitForFunction(
                `
                (function() {
                    return window.hcaptcha
                })()
                `,
                { polling: 200, timeout: 10000 }
            );
        }

        const evaluateReturn = await page.evaluate(
            this.generateContentScript('findCaptchas')
        );

        const response = evaluateReturn as types.CaptchaInfo[];

        return response;
    }

    private async solveHcaptchas(
        page: Page | Frame
    ): Promise<types.SolveRecaptchasResult> {
        const captchas = await this.findHcaptchas(page);

        let solutions: types.CaptchaSolution[] = [];
        let solved: types.CaptchaSolved[] = [];

        if (captchas.length !== 0) {
            solutions = await this.getHcaptchaSolutions(captchas);

            solved = await this.enterHcaptchaSolutions(page, solutions);
        }

        return {
            captchas,
            solutions,
            solved
        };
    }

    private async enterHcaptchaSolutions(
        page: Page | Frame,
        solutions: types.CaptchaSolution[]
    ): Promise<types.CaptchaSolved[]> {
        const evaluateReturn = await page.evaluate(
            this.generateContentScript('enterCaptchaSolutions', { solutions })
        );

        const response = evaluateReturn as types.CaptchaSolved[];

        return response;
    }

    private async getHcaptchaSolutions(
        captchas: types.CaptchaInfo[],
        provider?: types.SolutionProvider
    ): Promise<types.CaptchaSolution[]> {
        if (provider === undefined) {
            provider = this.provider;
        }

        if (!provider) {
            throw new Error(
                'Please provide a solution provider to the plugin.'
            );
        }

        let fn = provider.fn;
        if (fn === undefined) {
            const builtinProvider = BuiltinSolutionProviders.find(
                (p) => p.id === (provider || {}).id
            );

            if (
                builtinProvider === undefined ||
                builtinProvider.fn === undefined
            ) {
                throw new Error(
                    `Can't find built in provider with the id ${provider.id}`
                );
            }

            fn = builtinProvider.fn;
        }

        const response = await fn.call(this, captchas, provider.apiKey);

        return response;
    }

    private generateContentScript(
        fn: 'findCaptchas' | 'enterCaptchaSolutions',
        data?: types.ContentScriptData
    ): string {
        return `(async() => {
          const data = ${JSON.stringify(data || null)}
          const opts = ${JSON.stringify(this.contentScriptOpts)}
          ${HcaptchaContentScript.toString()}
          const script = new HcaptchaContentScript(opts, data)
          return script.${fn}()
        })()`;
    }
}

const defaultExport = (
    options: types.PluginOptions
): PuppeteerExtraPluginHcaptcha => {
    return new PuppeteerExtraPluginHcaptcha(options);
};

export default defaultExport;
