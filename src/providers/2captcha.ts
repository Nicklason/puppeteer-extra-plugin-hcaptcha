import * as types from '../types';

export const PROVIDER_ID = '2captcha';

import TwoCaptcha from '@nicklason/2captcha';

const solver = new TwoCaptcha();

async function getSolution(
    captcha: types.CaptchaInfo,
    proxyUrl: string,
    proxyType: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5',
    apiKey?: string
): Promise<types.CaptchaSolution> {
    if (apiKey) {
        // Set API key
        solver.setApiKey(apiKey);
    }

    const start = new Date();

    // Request captcha to be solved
    const id = await solver.solveHcaptcha(
        captcha.sitekey,
        captcha.url,
        proxyUrl,
        proxyType
    );

    // Get solution for captcha
    const solution = await solver.pollSolution(id, 5000, 15000);

    const end = new Date();

    const duration = end.getTime() - start.getTime();

    // Return solution
    return {
        id: captcha.id,
        text: solution,
        providerId: PROVIDER_ID,
        providerCaptchaId: id.toString(),
        requestAt: start,
        responseAt: end,
        duration: duration
    };
}

export async function getSolutions(
    captchas: types.CaptchaInfo[],
    proxyUrl: string,
    proxyType: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5',
    apiKey?: string
): Promise<types.CaptchaSolution[]> {
    // Get solution for all captchas
    const solutions = await Promise.all(
        captchas.map((captcha) =>
            getSolution(captcha, proxyUrl, proxyType, apiKey)
        )
    );

    return solutions;
}
