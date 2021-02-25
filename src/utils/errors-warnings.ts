import chalk from 'chalk';

export function createMessage(type: 'warning' | 'error', message: string, helpLink?: string) {
  const prefix = chalk`{dim [@magiclabs/next-css]}`;
  const label = type === 'error' ? chalk`${prefix} {red.bold Error}` : chalk`${prefix} {yellow.bold Warning}`;
  const separator =
    type === 'error' ? chalk`\n{dim ---------------------------}` : chalk`\n{dim -----------------------------}`;
  const suffix = helpLink ? `\nRead more: ${helpLink}` : '';

  return `\n${label}${separator}\n${wrapWords(message)}${suffix}\n`;
}

export function printMessage(type: 'warning' | 'error', message: string, helpLink?: string) {
  const printableMessage = createMessage(type, message, helpLink);

  if (type === 'error') {
    console.error(printableMessage);
  } else {
    console.warn(printableMessage);
  }
}

/**
 * Wraps the source `str` at `maxWidth`.
 * Based on a very helpful StackOverflow answer by Ross Rogers.
 *
 * @see https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
 */
function wrapWords(str: string, maxWidth = 80) {
  let res = '';
  let foundWhitespace: boolean | undefined;

  while (str.length > maxWidth) {
    foundWhitespace = false;

    // Insert a line break at first whitespace of the line
    for (let i = maxWidth - 1; i >= 0; i--) {
      if (testWhiteSpace(str.charAt(i))) {
        res += [str.slice(0, i), '\n'].join('');
        str = str.slice(i + 1);
        foundWhitespace = true;
        break;
      }
    }

    // Insert a line break at the `maxWidth` position
    // (the word is too long to wrap)
    if (!foundWhitespace) {
      res += [str.slice(0, maxWidth), '\n'].join('');
      str = str.slice(maxWidth);
    }
  }

  return `${res}${str}`.trimEnd();
}

/**
 * @see https://stackoverflow.com/questions/14484787/wrap-text-in-javascript
 */
function testWhiteSpace(x: string) {
  const white = new RegExp(/^\s$/);
  return white.test(x.charAt(0));
}
