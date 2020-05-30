import * as types from './types';

const ContentScriptDefaultOpts: types.ContentScriptOpts = {
    visualFeedback: true
};

const ContentScriptDefaultData: types.ContentScriptData = {
    solutions: []
};

export class HcaptchaContentScript {
    private opts: types.ContentScriptOpts;
    private data: types.ContentScriptData;

    constructor(
        opts = ContentScriptDefaultOpts,
        data = ContentScriptDefaultData
    ) {
        this.opts = opts;
        this.data = data;
    }

    public async findCaptchas(): Promise<types.CaptchaInfo[]> {
        await this.waitUntilDocumentReady();

        const captchas = this.getIframesIds()
            .map((id) => this.extractInfoFromIframe(id))
            .map((info) => {
                if (info === undefined) {
                    return;
                }

                info.url = document.URL;

                return info as types.CaptchaInfo;
            })
            .filter((info) => info !== undefined) as types.CaptchaInfo[];

        return captchas;
    }

    public async enterCaptchaSolutions(): Promise<types.CaptchaSolved[]> {
        await this.waitUntilDocumentReady();

        const solutions = this.data.solutions;
        if (solutions === undefined) {
            throw new Error('No solutions provided');
        }

        const solved = this.getIframesIds()
            .map((id) => {
                const solution = solutions.find((s) => s.id === id);

                if (solution !== undefined) {
                    this.enterSolutionById(solution.id, solution.text);

                    const frame = this.findIframeNodeById(id);

                    if (frame) {
                        this.paintCaptchaSolved(frame);

                        return { id };
                    }
                }
            })
            .filter((solved) => solved !== undefined) as types.CaptchaSolved[];

        return solved;
    }

    private getIframesIds(): string[] {
        // Should always return an array of strings
        return this.findIframeNodes().map((frame) => {
            this.paintCaptchaBusy(frame);
            return frame.getAttribute('data-hcaptcha-widget-id');
        }) as string[];
    }

    private findIframeNodes(): HTMLIFrameElement[] {
        return Array.from(
            document.querySelectorAll<HTMLIFrameElement>(
                `iframe[src^='https://assets.hcaptcha.com/captcha/v1'][data-hcaptcha-widget-id]`
            )
        );
    }

    private findIframeNodeById(id: string): HTMLIFrameElement | null {
        return document.querySelector(
            `iframe[src^='https://assets.hcaptcha.com/captcha/v1'][data-hcaptcha-widget-id='${id}']`
        );
    }

    private extractInfoFromIframe(
        id: string
    ): Partial<types.CaptchaInfo> | undefined {
        // This should always return an iframe
        const frame = this.findIframeNodeById(id);

        if (frame === null) {
            return;
        }

        // Need to get sitekey from the iframe src because that always contains the site key
        const urlParams = new URLSearchParams(frame.src);

        const sitekey = urlParams.get('sitekey');

        if (sitekey === null) {
            return;
        }

        // TODO: Get callback function

        return {
            id: id,
            sitekey: sitekey
        };
    }

    private enterSolutionById(id: string, solution: string): void {
        const hResponse = document.querySelector(
            `[id=h-captcha-response-${id}]`
        );

        if (hResponse) {
            hResponse.innerHTML = solution;
        }

        const gResponse = document.querySelector(
            `[id=g-recaptcha-response-${id}]`
        );

        if (gResponse) {
            gResponse.innerHTML = solution;
        }
    }

    private paintCaptchaBusy(frame: HTMLIFrameElement): void {
        try {
            if (this.opts.visualFeedback) {
                frame.style.filter = `opacity(60%) hue-rotate(400deg)`; // violet
            }
        } catch (error) {
            // noop
        }
    }

    private paintCaptchaSolved(frame: HTMLIFrameElement): void {
        try {
            if (this.opts.visualFeedback) {
                frame.style.filter = `opacity(60%) hue-rotate(230deg)`; // green
            }
        } catch (error) {
            // noop
        }
    }

    private async waitUntilDocumentReady(): Promise<void> {
        return new Promise(function (resolve) {
            if (!document || !window) {
                return resolve();
            }

            const loadedAlready = /^loaded|^i|^c/.test(document.readyState);
            if (loadedAlready) {
                return resolve();
            }

            function onReady(): void {
                resolve();
                document.removeEventListener('DOMContentLoaded', onReady);
                window.removeEventListener('load', onReady);
            }

            document.addEventListener('DOMContentLoaded', onReady);
            window.addEventListener('load', onReady);
        });
    }
}
