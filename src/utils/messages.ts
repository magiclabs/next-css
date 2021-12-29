/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/restrict-template-expressions */

import chalk from 'chalk';
import wrapAnsi from 'wrap-ansi';

type MessageType = 'error' | 'warning' | 'info';

export function createMessage(type: MessageType, message: string, helpLink?: string) {
  const openingBrace =
    type === 'error'
      ? chalk`{red.bold ┏━━━━━━━ error ━━━━━━━}`
      : type === 'warning'
      ? chalk`{yellow.bold ┏━━━━━━ warning ━━━━━━}`
      : chalk`{blue.bold ┏━━━━━━━━ info ━━━━━━━}`;

  const pkg = chalk`\n {dim [@magiclabs/next-css]}`;
  const suffix = helpLink ? `\n\n  Read more: ${helpLink}` : '';

  const closingBrace =
    type === 'error'
      ? chalk`{red.bold ┗━━━━━━━━━━━━━━━━━━━━━}`
      : type === 'warning'
      ? chalk`{yellow.bold ┗━━━━━━━━━━━━━━━━━━━━━}`
      : chalk`{blue.bold ┗━━━━━━━━━━━━━━━━━━━━━}`;

  const maxWidth = process.stdout.columns <= 78 ? process.stdout.columns : 78;
  return `\n\n${openingBrace}${pkg}\n\n  ${wrapAnsi(message, maxWidth)
    .split('\n')
    .join('\n  ')}${suffix}\n${closingBrace}\n\n`;
}

export function printMessage(type: MessageType, message: string, helpLink?: string) {
  const printableMessage = createMessage(type, message, helpLink);

  switch (type) {
    case 'error':
      console.error(printableMessage);
      break;
    case 'warning':
      console.warn(printableMessage);
      break;
    case 'info':
    default:
      console.log(printableMessage);
  }
}
