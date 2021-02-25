/* eslint-disable @typescript-eslint/restrict-template-expressions */

import chalk from 'chalk';
import wrapAnsi from 'wrap-ansi';

export function createMessage(type: 'warning' | 'error', message: string, helpLink?: string) {
  const label = type === 'error' ? chalk`{red.bold ------- error -------}` : chalk`{yellow.bold ------ warning ------}`;
  const pkg = chalk`\n{dim [@magiclabs/next-css]}`;
  const suffix = helpLink ? `\nRead more: ${helpLink}` : '';

  const maxWidth = process.stdout.columns <= 80 ? process.stdout.columns : 80;
  return `${label}${pkg}\n${wrapAnsi(message, maxWidth)}${suffix}\n`;
}

export function printMessage(type: 'warning' | 'error', message: string, helpLink?: string) {
  const printableMessage = createMessage(type, message, helpLink);

  if (type === 'error') {
    console.error(printableMessage);
  } else {
    console.warn(printableMessage);
  }
}
