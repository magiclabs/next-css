import type { NextConfig } from 'next/dist/next-server/server/config';

export interface ConfigurationContext {
  rootDirectory: string;
  customAppFile: string | null;
  isDevelopment: boolean;
  isProduction: boolean;
  isServer: boolean;
  isClient: boolean;
  assetPrefix: string;
}

/**
 * @see https://github.com/vercel/next.js/blob/b90b4b503c4444507595be0f9e0edd8a19ea2254/packages/next/build/webpack-config.ts#L1289
 */
export interface NextWebpackContext {
  dir: string;
  dev: boolean;
  isServer: boolean;
  buildID: string;
  config: NextConfig;
  defaultLoaders?: any;
  totalPages: number;
  webpack: any;
}
