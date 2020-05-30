/* eslint-disable @typescript-eslint/no-empty-interface */

// Extend Puppeteer interfaces to the end user.
import {} from 'puppeteer';

import { PluginPageAdditions } from './types';

declare module 'puppeteer' {
    interface Page extends PluginPageAdditions {}
    interface Frame extends PluginPageAdditions {}
}

declare module 'puppeteer-core' {
    interface Page extends PluginPageAdditions {}
    interface Frame extends PluginPageAdditions {}
}
