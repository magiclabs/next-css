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
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/build/webpack/config/blocks/css/index.ts
 *
 * Modifications:
 *   - Remove curried functions
 *   - Add additional loaders for each configured pre-processor
 *   - Use own dependencies (remove `next/dist/compiled/*` dependencies)
 *   - Use own implementation for `getCssModuleLoader`, `getGlobalCssLoader`
 *   - Use own implementation for `getPostCssPlugins`
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import path from 'path';
import type webpack from 'webpack';
import uniq from 'lodash.uniq';
import ExtractCssPlugin from 'mini-css-extract-plugin';
import chalk from 'chalk';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { getCssModuleLoader, getGlobalCssLoader } from './css-loaders';
import { ConfigurationContext } from './types';
import { getPostCssPlugins } from './postcss';
import { createMessage } from './utils/messages';

export interface PreProcessorItem {
  extensions: string[];
  use: webpack.RuleSetUseItem[];
}

interface PreProcessorItemWithRegExps extends PreProcessorItem {
  global: RegExp;
  modules: RegExp;
}

export interface ConfigureCSSOptions {
  preProcessors: PreProcessorItem[];
}

export function configureCSS(config: webpack.Configuration, ctx: ConfigureCSSOptions & ConfigurationContext) {
  const preProcessorConfigs: PreProcessorItemWithRegExps[] = [
    {
      extensions: ['css'],
      use: [],
      global: /(?<!\.module)\.css$/,
      modules: /\.module\.css$/,
    },
  ];

  for (const item of ctx.preProcessors) {
    preProcessorConfigs.push({
      extensions: item.extensions,
      use: item.use,
      global: new RegExp(`(?<!\\.module)\\.(${[...item.extensions].join('|')})$`),
      modules: new RegExp(`\\.module\\.(${[...item.extensions].join('|')})$`),
    });
  }

  const allCssExtensions: string[] = uniq([
    'css',
    ...ctx.preProcessors.reduce((acc, item) => acc.concat(item.extensions), [] as string[]),
  ]);

  const regexpLikeCss = new RegExp(`\\.(${allCssExtensions.join('|')})$`);

  const postCssPlugins = getPostCssPlugins(ctx.rootDirectory, ctx.isProduction);

  // Add a loader from which we can detect `@magiclabs/next-css` usage.
  addLoader(config, {
    // `test` here is required to trigger Next.js
    // to dump its built-in CSS support.
    test: regexpLikeCss,
    oneOf: [
      {
        // Impossible regex expression
        test: /a^/,
        loader: 'noop-loader',
        options: { __is_magiclabs_next_css: true },
      },
    ],
  });

  // CSS cannot be imported in _document. This comes before everything because
  // global CSS nor CSS modules work in said file.
  addLoader(config, {
    oneOf: [
      {
        test: regexpLikeCss,
        issuer: /pages[\\/]_document\./,
        use: {
          loader: 'error-loader',
          options: {
            reason: getCustomDocumentError(ctx.customAppFile && path.relative(ctx.rootDirectory, ctx.customAppFile)),
          },
        },
      },
    ],
  });

  for (const item of preProcessorConfigs) {
    addLoader(config, {
      oneOf: [
        {
          // CSS Modules should never have side effects. This setting will
          // allow unused CSS to be removed from the production build.
          // We ensure this by disallowing `:global()` CSS at the top-level
          // via the `pure` mode in `css-loader`.
          sideEffects: false,
          test: item.modules,
          // CSS Modules are only supported in the user's application. We're
          // not yet allowing CSS imports _within_ `node_modules`.
          issuer: {
            and: [ctx.rootDirectory],
            not: [/node_modules/],
          },
          use: getCssModuleLoader(ctx, postCssPlugins, item.use),
        },
      ],
    });
  }

  // Throw an error for CSS Modules used outside their supported scope
  addLoader(config, {
    oneOf: [
      {
        test: preProcessorConfigs.map((re) => re.modules),
        use: {
          loader: 'error-loader',
          options: {
            reason: getLocalModuleImportError(),
          },
        },
      },
    ],
  });

  if (ctx.isServer) {
    addLoader(config, {
      oneOf: [
        {
          test: preProcessorConfigs.map((re) => re.global),
          use: require.resolve('ignore-loader'),
        },
      ],
    });
  } else {
    addLoader(config, {
      oneOf: [
        {
          // A global CSS import always has side effects. Webpack will tree
          // shake the CSS without this option if the issuer claims to have
          // no side-effects.
          // See https://github.com/webpack/webpack/issues/6571
          sideEffects: true,
          test: preProcessorConfigs[0].global,
          // We only allow Global CSS to be imported anywhere in the
          // application if it comes from node_modules. This is a best-effort
          // heuristic that makes a safety trade-off for better
          // interoperability with npm packages that require CSS. Without
          // this ability, the component's CSS would have to be included for
          // the entire app instead of specific page where it's required.
          include: { and: [/node_modules/] },
          // Global CSS is only supported in the user's application, not in
          // node_modules.
          issuer: {
            and: [ctx.rootDirectory],
            not: [/node_modules/],
          },
          use: getGlobalCssLoader(ctx, postCssPlugins),
        },
      ],
    });

    if (ctx.customAppFile) {
      for (const item of preProcessorConfigs) {
        addLoader(config, {
          oneOf: [
            {
              // A global CSS import always has side effects. Webpack will tree
              // shake the CSS without this option if the issuer claims to have
              // no side-effects.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
              test: item.global,
              issuer: { and: [ctx.customAppFile] },
              use: getGlobalCssLoader(ctx, postCssPlugins, item.use),
            },
          ],
        });
      }
    }
  }

  // Throw an error for Global CSS used inside of `node_modules`
  addLoader(config, {
    oneOf: [
      {
        test: preProcessorConfigs.map((item) => item.global),
        issuer: { and: [/node_modules/] },
        use: {
          loader: 'error-loader',
          options: {
            reason: getGlobalModuleImportError(),
          },
        },
      },
    ],
  });

  // Throw an error for Global CSS used outside of our custom <App> file
  addLoader(config, {
    oneOf: [
      {
        test: preProcessorConfigs.map((item) => item.global),
        use: {
          loader: 'error-loader',
          options: {
            reason: getGlobalImportError(ctx.customAppFile && path.relative(ctx.rootDirectory, ctx.customAppFile)),
          },
        },
      },
    ],
  });

  if (ctx.isClient) {
    // Automatically transform references to files (i.e. url()) into URLs
    // e.g. url(./logo.svg)
    addLoader(config, {
      oneOf: [
        {
          // This should only be applied to CSS files
          issuer: regexpLikeCss,
          // Exclude extensions that webpack handles by default
          exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
          use: {
            // `file-loader` always emits a URL reference, where `url-loader`
            // might inline the asset as a data URI
            loader: require.resolve('file-loader'),
            options: {
              // Hash the file for immutable cacheability
              name: 'static/media/[name].[hash].[ext]',
            },
          },
        },
      ],
    });
  }

  if (ctx.isClient && ctx.isProduction) {
    // Extract CSS as CSS file(s) in the client-side production bundle.
    addPlugin(
      config,
      new ExtractCssPlugin({
        filename: 'static/css/[contenthash].css',
        chunkFilename: 'static/css/[contenthash].css',
        // Next.js guarantees that CSS order "doesn't matter" (and so must we),
        // due to imposed restrictions:
        //
        //   1. Global CSS can only be defined in a single entrypoint (_app)
        //   2. CSS Modules generate scoped class names by default and cannot
        //      include Global CSS (:global() selector).
        //
        // While not a perfect guarantee (e.g. liberal use of `:global()`
        // selector), this assumption is required to code-split CSS.
        //
        // If this warning were to trigger, it'd be unactionable by the user,
        // but likely not valid -- so we disable it.
        ignoreOrder: true,
      }),
    );
  }

  config.optimization?.minimizer?.push(new CssMinimizerPlugin());
}

// --- Webpack configuration helpers

function addLoader(config: webpack.Configuration, rule: webpack.RuleSetRule) {
  // We assume `config.module.rules` is already initialized to an array because
  // NextJS populates built-in CSS loaders before plugins.

  if (rule.oneOf) {
    const existing = config.module!.rules!.find(
      (arrayRule) =>
        typeof arrayRule !== 'string' &&
        arrayRule.oneOf &&
        (arrayRule.oneOf?.[0]?.options as any)?.__is_magiclabs_next_css,
    );
    if (existing && typeof existing !== 'string') {
      existing.oneOf!.push(...rule.oneOf);
      return config;
    }
  }

  config.module!.rules!.push(rule);
  return config;
}

function addPlugin(config: webpack.Configuration, p: any) {
  if (!config.plugins) {
    config.plugins = [];
  }

  config.plugins.push(p);
  return config;
}

// --- Error messages

function getGlobalImportError(file: string | null) {
  return createMessage(
    'error',
    chalk`Global CSS {bold cannot} be imported from files other than your {bold Custom <App>}. Please move all global CSS imports to {cyan ${
      file || 'pages/_app.js'
    }}. Or, convert the import to Component-level CSS (CSS Modules).`,
    'https://err.sh/next.js/css-global',
  );
}

function getGlobalModuleImportError() {
  return createMessage(
    'error',
    chalk`Global CSS {bold cannot} be imported from within {bold 'node_modules'}.`,
    'https://err.sh/next.js/css-npm',
  );
}

function getLocalModuleImportError() {
  return createMessage(
    'error',
    chalk`CSS Modules {bold cannot} be imported from within {bold 'node_modules'}.`,
    'https://err.sh/next.js/css-modules-npm',
  );
}

function getCustomDocumentError(file: string | null) {
  return createMessage(
    'error',
    chalk`CSS {bold cannot} be imported within {cyan pages/_document.js}. Please move global styles to {cyan ${
      file || 'pages/_app.js'
    }}`,
  );
}
