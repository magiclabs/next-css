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
