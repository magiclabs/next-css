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
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/build/webpack/config/blocks/css/loaders/client.ts
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/build/webpack/config/blocks/css/loaders/file-resolve.ts
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/build/webpack/config/blocks/css/loaders/modules.ts
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/build/webpack/config/blocks/css/loaders/global.ts
 *
 * Modifications:
 *   - Combines several original source files
 *   - Simplify `cssFileResolve` logic
 *   - Use own dependencies (remove `next/dist/compiled/*` dependencies)
 *   - Simplify CSS Modules `localIdent` logic
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { AcceptedPlugin } from 'postcss';
import type webpack from 'webpack';
import ExtractCssPlugin from 'mini-css-extract-plugin';
import { ConfigurationContext } from './types';

export function getCssModuleLoader(
  ctx: ConfigurationContext,
  postCssPlugins: readonly AcceptedPlugin[],
  preProcessors: readonly webpack.RuleSetUseItem[] = [],
): webpack.RuleSetUseItem[] {
  const loaders: webpack.RuleSetUseItem[] = [];

  if (ctx.isClient) {
    // Add appropriate development more or production mode style
    // loader
    loaders.push(getClientStyleLoader(ctx));
  }

  // Resolve CSS `@import`s and `url()`s
  loaders.push({
    loader: require.resolve('css-loader'),
    options: {
      importLoaders: 1 + preProcessors.length,
      sourceMap: true,
      // Use CJS mode for backwards compatibility:
      esModule: false,
      url: cssFileResolve,
      import: cssFileResolve,
      modules: {
        // Do not transform class names (CJS mode backwards compatibility):
        exportLocalsConvention: 'asIs',
        // Server-side (Node.js) rendering support:
        exportOnlyLocals: ctx.isServer,
        // Disallow global style exports so we can code-split CSS and
        // not worry about loading order.
        mode: 'pure',
        localIdentName: '[local]___[hash:base64:5]',
      },
    },
  });

  // Compile CSS
  loaders.push({
    loader: require.resolve('postcss-loader'),
    options: {
      postcssOptions: { plugins: postCssPlugins, config: false },
      sourceMap: true,
    },
  });

  loaders.push(...preProcessors.slice());

  return loaders;
}

export function getGlobalCssLoader(
  ctx: ConfigurationContext,
  postCssPlugins: readonly AcceptedPlugin[],
  preProcessors: readonly webpack.RuleSetUseItem[] = [],
): webpack.RuleSetUseItem[] {
  const loaders: webpack.RuleSetUseItem[] = [];

  if (ctx.isClient) {
    // Add appropriate development more or production mode style
    // loader
    loaders.push(getClientStyleLoader(ctx));
  }

  // Resolve CSS `@import`s and `url()`s
  loaders.push({
    loader: require.resolve('css-loader'),
    options: {
      importLoaders: 1 + preProcessors.length,
      sourceMap: true,
      modules: false,
      url: cssFileResolve,
      import: cssFileResolve,
    },
  });

  // Compile CSS
  loaders.push({
    loader: require.resolve('postcss-loader'),
    options: {
      postcssOptions: { plugins: postCssPlugins, config: false },
      sourceMap: true,
    },
  });

  loaders.push(...preProcessors.slice());

  return loaders;
}

function cssFileResolve(url: string, _resourcePath: string) {
  return !url.startsWith('/');
}

function getClientStyleLoader(ctx: ConfigurationContext): webpack.RuleSetUseItem {
  return ctx.isDevelopment
    ? {
        loader: 'next-style-loader',
        options: {
          // By default, CSS is injected into the bottom
          // of <head>. This causes ordering problems between dev
          // and prod. To fix this, we Next.js renders a
          // <noscript id="__next_css__DO_NOT_USE__"> tag as
          // an anchor for the styles to be placed before. These
          // styles will be applied _before_ <style jsx global>.
          //
          // This function is serialized and injected into the
          // Webpack runtime, so it must remain ES5 compatible.
          /* eslint-disable-next-line func-names, object-shorthand */
          insert: function (element: Node) {
            /* eslint-disable */
            // These elements should always exist. If they do not,
            // this code should fail.
            var anchorElement = document.querySelector('#__next_css__DO_NOT_USE__')!;
            var parentNode = anchorElement.parentNode!; // Normally <head>

            // Each style tag should be placed right before our
            // anchor. By inserting before and not after, we do not
            // need to track the last inserted element.
            parentNode.insertBefore(element, anchorElement);
            /* eslint-enable */
          },
        },
      }
    : {
        loader: ExtractCssPlugin.loader,
        options: {
          publicPath: `${ctx.assetPrefix}/_next/`,
        },
      };
}
