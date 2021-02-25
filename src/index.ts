/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-nested-ternary */

import type webpack from 'webpack';
import type { NextWebpackContext } from './types';
import { configureCSS, ConfigureCSSOptions, PreProcessorItem } from './configuration';
import { findCustomAppFile } from './utils/find-custom-app-file';
import { validatePluginConfiguration } from './utils/validate-plugin-configuration';

/**
 * Configuration for `@magiclabs/next-css`.
 */
export interface PluginConfiguration {
  preProcessors:
    | ConfigureCSSOptions['preProcessors']
    | ((config: webpack.Configuration, options: NextWebpackContext) => ConfigureCSSOptions['preProcessors']);
}

/**
 * A NextJS configuration plugin which approximates NextJS's built-in CSS
 * support, but with the added flexibility to support any preprocessor of your
 * choice.
 */
export function withCSS<T extends Record<string, any> = Record<string, any>>(
  nextConfig: T & Partial<PluginConfiguration> = {} as any,
) {
  return {
    ...nextConfig,
    webpack(config: webpack.Configuration, options: NextWebpackContext) {
      const { preProcessors, assetPrefix } = nextConfig;

      configureCSS(config, {
        preProcessors: validatePluginConfiguration({ preProcessors }, config, options),
        rootDirectory: options.dir,
        customAppFile: findCustomAppFile(options.dir, nextConfig.pageExtensions),
        isDevelopment: options.dev,
        isProduction: !options.dev,
        isServer: options.isServer,
        isClient: !options.isServer,
        assetPrefix: assetPrefix ? (assetPrefix.endsWith('/') ? assetPrefix.slice(0, -1) : assetPrefix) : '',
      });

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    },
  };
}

export { PreProcessorItem as PreprocessorItem };
