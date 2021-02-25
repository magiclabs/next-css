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
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/lib/find-config.ts
 *
 * Modifications:
 *   - Synchronous
 */

/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */

import findup from 'findup-sync';
import JSON5 from 'json5';
import fs from 'fs';

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export function findConfig<T>(directory: string, key: string): RecursivePartial<T> | null {
  // `package.json` configuration always wins. Let's check that first.
  const packageJsonPath = findup('package.json', { cwd: directory });
  if (packageJsonPath) {
    const packageJson = require(packageJsonPath);
    if (packageJson[key] != null && typeof packageJson[key] === 'object') {
      return packageJson[key];
    }
  }

  // If we didn't find the configuration in `package.json`, we should look for
  // known filenames.
  const filePath = findup([`.${key}rc.json`, `${key}.config.json`, `.${key}rc.js`, `${key}.config.js`], {
    cwd: directory,
  });
  if (filePath) {
    if (filePath.endsWith('.js')) {
      return require(filePath);
    }

    // We load JSON contents with JSON5 to allow users to comment in their
    // configuration file. This pattern was popularized by TypeScript.
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON5.parse(fileContents);
  }

  return null;
}
