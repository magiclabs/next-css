/*
  The MIT License (MIT)

  Copyright (c) 2021 Vercel, Inc.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
 */

/**
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/build/webpack/config/blocks/css/plugins.ts
 *
 * Modifications:
 *   - Synchronous
 *   - Custom error messages to clarify the error source
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/ban-types */

import type { AcceptedPlugin } from 'postcss';
import chalk from 'chalk';
import browserslist from 'browserslist';
import { findConfig } from './utils/find-config';
import { createMessage, printMessage } from './utils/messages';

type CssPluginCollection_Array = (string | [string, boolean | object])[];

type CssPluginCollection_Object = { [key: string]: object | boolean };

type CssPluginCollection = CssPluginCollection_Array | CssPluginCollection_Object;

type CssPluginShape = [string, object | boolean];

const genericErrorText = 'Malformed PostCSS configuration';

function getError_NullConfig(pluginName: string) {
  return createMessage(
    'error',
    chalk`Your PostCSS configuration for '${pluginName}' cannot have {bold null or undefined} configuration.\nTo disable '${pluginName}', pass {bold false}, otherwise, pass {bold true} or a configuration object.`,
  );
}

function isIgnoredPlugin(pluginPath: string): boolean {
  const ignoredRegex = /(?:^|[\\/])(postcss-modules-values|postcss-modules-scope|postcss-modules-extract-imports|postcss-modules-local-by-default|postcss-modules)(?:[\\/]|$)/i;
  const match = ignoredRegex.exec(pluginPath);
  if (match == null) {
    return false;
  }

  const plugin = match.pop()!;

  printMessage(
    'warning',
    chalk`Please remove the {underline ${plugin}} plugin from your PostCSS configuration. This plugin is automatically configured by {bold @magiclabs/next-css}.`,
    'https://err.sh/next.js/postcss-ignored-plugin',
  );

  return true;
}

function loadPlugin(dir: string, pluginName: string, options: boolean | object): AcceptedPlugin | false {
  if (options === false || isIgnoredPlugin(pluginName)) {
    return false;
  }

  if (options == null) {
    console.error(getError_NullConfig(pluginName));
    throw new Error(genericErrorText);
  }

  const pluginPath = require.resolve(pluginName, { paths: [dir] });
  if (isIgnoredPlugin(pluginPath)) {
    return false;
  }
  if (options === true) {
    return require(pluginPath);
  }
  const keys = Object.keys(options);
  if (keys.length === 0) {
    return require(pluginPath);
  }
  return require(pluginPath)(options);
}

function getDefaultPlugins(baseDirectory: string, isProduction: boolean): CssPluginCollection {
  let browsers: any;
  try {
    browsers = browserslist.loadConfig({
      path: baseDirectory,
      env: isProduction ? 'production' : 'development',
    });
  } catch {}

  return [
    require.resolve('postcss-flexbugs-fixes'),
    [
      require.resolve('postcss-preset-env'),
      {
        browsers: browsers ?? ['defaults'],
        autoprefixer: {
          // Disable legacy flexbox support
          flexbox: 'no-2009',
        },
        // Enable CSS features that have shipped to the
        // web platform, i.e. in 2+ browsers unflagged.
        stage: 3,
        features: {
          'custom-properties': false,
        },
      },
    ],
  ];
}

export function getPostCssPlugins(dir: string, isProduction: boolean): readonly AcceptedPlugin[] {
  let config = findConfig<{ plugins: CssPluginCollection }>(dir, 'postcss');

  if (config == null) {
    config = { plugins: getDefaultPlugins(dir, isProduction) };
  }

  if (typeof config === 'function') {
    printMessage(
      'error',
      'Your custom PostCSS configuration may not export a function. Please export a plain object instead.',
      'https://err.sh/next.js/postcss-function',
    );

    throw new Error(genericErrorText);
  }

  // Warn user about configuration keys which are not respected
  const invalidKey = Object.keys(config).find((key) => key !== 'plugins');
  if (invalidKey) {
    printMessage(
      'warning',
      `Your PostCSS configuration defines a field which is not supported (\`${invalidKey}\`). Please remove this configuration value.`,
    );
  }

  // Enforce the user provided plugins if the configuration file is present
  let { plugins } = config;
  if (plugins == null || typeof plugins !== 'object') {
    printMessage('error', 'Your custom PostCSS configuration must export a `plugins` key.');
    throw new Error(genericErrorText);
  }

  if (!Array.isArray(plugins)) {
    // Capture variable so TypeScript is happy
    const pc = plugins;

    plugins = Object.keys(plugins).reduce((acc, curr) => {
      const p = pc[curr];
      if (typeof p === 'undefined') {
        console.error(getError_NullConfig(curr));
        throw new Error(genericErrorText);
      }

      acc.push([curr, p]);
      return acc;
    }, [] as CssPluginCollection_Array);
  }

  const parsed: CssPluginShape[] = [];
  plugins.forEach((plugin) => {
    if (plugin == null) {
      printMessage(
        'warning',
        chalk`A {bold null or undefined} PostCSS plugin was provided. This entry will be ignored.`,
      );
    } else if (typeof plugin === 'string') {
      parsed.push([plugin, true]);
    } else if (Array.isArray(plugin)) {
      const pluginName = plugin[0];
      const pluginConfig = plugin[1];
      if (typeof pluginName === 'string' && (typeof pluginConfig === 'boolean' || typeof pluginConfig === 'object')) {
        parsed.push([pluginName, pluginConfig]);
      } else {
        if (typeof pluginName !== 'string') {
          printMessage(
            'error',
            chalk`A PostCSS plugin must be provided as a {bold 'string'}. Instead, we got: '${pluginName}'.`,
            'https://err.sh/next.js/postcss-shape',
          );
        } else {
          printMessage(
            'error',
            chalk`A PostCSS Plugin was passed as an array but did not provide its configuration ('${pluginName}').`,
            'https://err.sh/next.js/postcss-shape',
          );
        }
        throw new Error(genericErrorText);
      }
    } else if (typeof plugin === 'function') {
      printMessage(
        'error',
        chalk`A PostCSS Plugin was passed as a function using require(), but it must be provided as a {bold 'string'}.`,
        'https://err.sh/next.js/postcss-shape',
      );
      throw new Error(genericErrorText);
    } else {
      printMessage(
        'error',
        `An unknown PostCSS plugin was provided (${plugin}).`,
        'https://err.sh/next.js/postcss-shape',
      );
      throw new Error(genericErrorText);
    }
  });

  const resolved = parsed.map((p) => loadPlugin(dir, p[0], p[1]));
  const filtered = resolved.filter(Boolean) as AcceptedPlugin[];

  return filtered;
}

// --- Error & warning messages
