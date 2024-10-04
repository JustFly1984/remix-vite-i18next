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
    routes(defineRoutes) {
      const getPageNameWithRoute = (page: string): string => {
        if (!page.includes('.')) {
          return page
        }

        return page.replace('.', '/')
      }

      return defineRoutes((route) => {
        const locales = ['ru', 'te'] as const
        const pages = [
          'index',
          '$',
          'about',
          'blog',
          'contact',
          'customers',
          'dashboard',
          'developers',
          'forgot',
          'log-in',
          'log-in-with-email',
          'maintainers',
          'packages',
          'privacy',
          'profile',
          'roadmap',
          'reset',
          'sign-up',
          'sign-up-success',
          'sign-up-with-email',
          'sign-up-with-github',
          'team',
          'terms',
          'unverified',
          'verify-failure',
          'verify-success',
          'ui-kit',
        ] as const

        pages.forEach((page): void => {
          const routeFormatted = getPageNameWithRoute(page)

          console.info('routeFormatted', routeFormatted)

          locales.forEach((locale): void => {
            if (page === 'index') {
              route(`/${locale}/${routeFormatted}`, `routes/_${page}.tsx`, {
                id: `routes/${locale}/_${page}`,
              })

              return
            }

            if (page === '$') {
              route(`/${locale}/${routeFormatted}`, `routes/$.tsx`, {
                id: `routes/${locale}/$`,
              })

              return
            }

            route(`/${locale}/${routeFormatted}`, `routes/${page}.tsx`, {
              id: `routes/${locale}/${page}`,
            })
          })

          // Default locale (en)
          if (page !== 'index' && page !== '$') {
            route(`/${routeFormatted}`, `routes/${page}.tsx`, {
              id: `routes/${page}`,
            })
          }
        })
      })
    },
  }), tsconfigPaths()],
  ssr: {
    noExternal: ['remix-utils'],
  },
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
