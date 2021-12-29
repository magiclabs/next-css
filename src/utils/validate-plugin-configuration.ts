import chalk from 'chalk';
import type webpack from 'webpack';
import type { PluginConfiguration, PreprocessorItem } from '../index';
import type { NextWebpackContext } from '../types';
import { printMessage } from './messages';

function raiseValidationError(message: string, helpLink?: string) {
  printMessage('error', message, helpLink);
  throw new Error('Malformed plugin Configuration');
}

export function validatePluginConfiguration(
  pluginConfig: Partial<PluginConfiguration>,
  webpackConfig: webpack.Configuration,
  webpackContext: NextWebpackContext,
  isFromFactory = false,
): PreprocessorItem[] {
  if (pluginConfig.preProcessors == null) {
    // Print warning message only once!
    if (webpackContext.isServer) {
      printMessage(
        'warning',
        chalk`The value given to {bold preProcessors} is {bold null or undefined}. This may not be intentional. Without configuration, only plain CSS will be parsed by Webpack (in which case, the usage of this plugin is unnecessary).`,
      );
    }
    return [];
  }

  if (!pluginConfig.preProcessors) {
    // Print warning message only once!
    if (webpackContext.isServer) {
      printMessage(
        'warning',
        chalk`The value given to {bold preProcessors} is {bold falsey}. This may not be intentional. Without configuration, only plain CSS will be parsed by Webpack (in which case, the usage of this plugin is unnecessary).`,
      );
    }
    return [];
  }

  if (pluginConfig.preProcessors) {
    if (typeof pluginConfig.preProcessors === 'function') {
      const result = pluginConfig.preProcessors(webpackConfig, webpackContext);
      return validatePluginConfiguration({ preProcessors: result }, webpackConfig, webpackContext, true);
    }

    if (Array.isArray(pluginConfig.preProcessors)) {
      for (const [i, item] of Object.entries(pluginConfig.preProcessors)) {
        const styledI = chalk`{cyan ${i}}`;
        const codeRefs = {
          use: isFromFactory
            ? chalk`{bold preProcessors() => [{cyan ${i}}].use}`
            : chalk`{bold preProcessors[{cyan ${i}}].use}`,
          extensions: isFromFactory
            ? chalk`{bold preProcessors() => [{cyan ${i}}].extensions}`
            : chalk`{bold preProcessors[{cyan ${i}}].extensions}`,
        };

        // Make sure `use` is defined.
        if (item.use == null) {
          raiseValidationError(
            chalk`The value given to ${codeRefs.use} is {bold null or undefined}. Please provide an array of objects to configure your additional loaders.`,
            'https://webpack.js.org/configuration/module/#rule',
          );
        }

        // Make sure `use` is a truthy value.
        if (!item.use) {
          raiseValidationError(
            chalk`The value given to ${codeRefs.use} is {bold falsey}. Please provide an array of objects to configure your additional loaders.`,
            'https://webpack.js.org/configuration/module/#rule',
          );
        }

        // Make sure `use` is an array.
        if (!Array.isArray(item.use)) {
          raiseValidationError(
            chalk`The value given to ${codeRefs.use} is not an array. Please provide an array of objects to configure your additional loaders.`,
            'https://webpack.js.org/configuration/module/#rule',
          );
        }

        // Make sure `use` array has at least one element.
        if (!item.use.length) {
          raiseValidationError(
            chalk`The array given to ${codeRefs.use} contains zero elements. Please provide an array of objects to configure your additional loaders.`,
            'https://webpack.js.org/configuration/module/#rule',
          );
        }

        // Make sure `extensions` is defined.
        if (item.extensions == null) {
          raiseValidationError(
            chalk`The value given to ${codeRefs.extensions} is {bold null or undefined}. Please provide an array of strings to configure additional CSS pre-processor extensions.`,
          );
        }

        // Make sure `extensions` is a truthy value.
        if (!item.extensions) {
          raiseValidationError(
            chalk`The value given to ${codeRefs.extensions} is {bold falsey}. Please provide an array of strings to configure additional CSS pre-processor extensions.`,
          );
        }

        // Make sure `extensions` is an array.
        if (!Array.isArray(item.extensions)) {
          raiseValidationError(
            chalk`The value given to ${codeRefs.extensions} is not an array. Please provide an array of strings to configure additional CSS pre-processor extensions.`,
          );
        }

        // Make sure `extensions` array has at least one element.
        if (!item.extensions.length) {
          raiseValidationError(
            chalk`The array given to ${codeRefs.extensions} contains zero elements. Please provide at least one CSS pre-processor extension.`,
          );
        }

        // Make sure all values in `extensions` array are strings.
        for (const [j, ext] of Object.entries(item.extensions)) {
          if (typeof ext !== 'string') {
            const styledJ = chalk`{cyan ${j}}`;
            const codeRef = isFromFactory
              ? chalk`{bold preProcessors() => [${styledI}].extensions[${styledJ}]}`
              : chalk`{bold preProcessors[${styledI}].extensions[${styledJ}]}`;

            raiseValidationError(
              chalk`The value given to ${codeRef} is not a string. Please provide pre-processor extensions as strings.`,
            );
          }
        }
      }
    }
  }

  return pluginConfig.preProcessors;
}
