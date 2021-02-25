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
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/lib/find-pages-dir.ts
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/server/lib/find-page-file.ts
 *
 * Modifications:
 *   - Synchronous
 *   - Specifically optimized to find `/_app` page file
 */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import fs from 'fs';
import path from 'path';

export function findPagesDir(dir: string) {
  // prioritize ./pages over ./src/pages
  let curDir = path.join(dir, 'pages');
  if (fs.existsSync(curDir)) return curDir;

  curDir = path.join(dir, 'src/pages');
  if (fs.existsSync(curDir)) return curDir;

  return undefined;
}

export function findCustomAppFile(dir: string, pageExtensions: string[]) {
  const pagesDir = findPagesDir(dir);

  if (pagesDir) {
    const page = '/_app';

    for (const extension of pageExtensions) {
      const relativePagePath = `${page}.${extension}`;
      const pagePath = path.join(pagesDir, relativePagePath);

      if (fs.existsSync(pagePath)) {
        return pagePath;
      }
    }
  }

  return null;
}
