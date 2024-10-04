import fs from 'node:fs'
import process from 'node:process'

import { vitePlugin as remix, cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig({
  server: {
    https: {
      cert:
        process.env.NODE_ENV === 'development'
          ? fs.readFileSync('cert.pem')
          : undefined,
      key:
        process.env.NODE_ENV === 'development'
          ? fs.readFileSync('key.pem')
          : undefined,
      rejectUnauthorized: false,
      requestCert: false,
    },
  },
  build: {
    sourcemap: true, // Source map generation must be turned on
  },
  base: '/',
  plugins: [envOnlyMacros(), remixCloudflareDevProxy(), remix({
    future: {
      v3_fetcherPersist: true,
      v3_relativeSplatPath: true,
      v3_throwAbortReason: true,
    },
  }), tsconfigPaths()],
});
