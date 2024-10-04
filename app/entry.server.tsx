import { RemixServer } from '@remix-run/react'
import { createInstance, type i18n } from 'i18next'
import { type AppLoadContext, type EntryContext } from '@remix-run/node'
import { isbot } from 'isbot'
import ReactDOMServer from 'react-dom/server'
import { I18nextProvider, initReactI18next } from 'react-i18next'

import i18next from 'app/modules/i18n.server'
import * as i18nConfig from 'app/config/i18n' // your i18n configuration file

// import { Providers } from 'app/providers.tsx'

const { renderToReadableStream } = ReactDOMServer

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext
): Promise<unknown> {
  const instance = createInstance()
  const lng = await i18next.getLocale(request)
  const ns = i18next.getRouteNamespaces(remixContext)

  await instance.use(initReactI18next).init({ ...i18nConfig, lng, ns })

  return isbot(request.headers.get('user-agent'))
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext,
        instance
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext,
        instance
      )
}

async function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  i18next: i18n
): Promise<unknown> {
  return handleRequestInternal(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext,
    i18next
  )
}

async function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  i18next: i18n
): Promise<unknown> {
  return handleRequestInternal(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext,
    i18next
  )
}

async function handleRequestInternal(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  i18next: i18n
): Promise<unknown> {
  try {
    const stream = await renderToReadableStream(
        <I18nextProvider i18n={i18next}>
          <RemixServer context={remixContext} url={request.url} />
        </I18nextProvider>
    )

    responseHeaders.set('Content-Type', 'text/html')

    return new Response(stream, {
      headers: responseHeaders,
      status: responseStatusCode,
    })
  } catch (error) {
    if (error instanceof Error) {
      console.error(error)
    } else if (typeof error === 'string') {
      console.error(new Error(error))
    } else {
      console.error(new Error(JSON.stringify(error)))
    }

    return new Response('Internal Server Error', { status: 500 })
  }
}
