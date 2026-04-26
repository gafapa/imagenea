/**
 * Client for the browser proxy-extension bridge.
 *
 * The extension injects a content script into gallego.top that relays
 * window.postMessage requests to the service worker, which executes
 * them without CORS restrictions — allowing the hosted app to reach
 * local AI servers (Ollama, LM Studio) running on localhost.
 *
 * Protocol constants must stay in sync with the extension's
 * shared/bridge-config.js (APP_SOURCE, PROTOCOL_NAME, PROTOCOL_VERSION).
 */

const PROTOCOL_NAME = 'proxy-extension-bridge'
const PROTOCOL_VERSION = 1
const APP_SOURCE = 'imagenea'
const EXTENSION_SOURCE = 'proxy-extension'

const MSG = {
  PING: 'bridge-ping',
  AVAILABLE: 'bridge-available',
  REQUEST: 'bridge-request',
  RESPONSE: 'bridge-response',
}

let _available = null   // null = untested, true/false = cached
let _checkPromise = null // deduplicates concurrent checks

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function post(type, extra = {}) {
  window.postMessage(
    { source: APP_SOURCE, protocol: PROTOCOL_NAME, version: PROTOCOL_VERSION, type, ...extra },
    window.location.origin,
  )
}

function waitFor(type, requestId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler)
      reject(new Error(`Bridge timeout waiting for "${type}"`))
    }, timeoutMs)

    function handler(event) {
      if (event.source !== window) return
      const msg = event.data
      if (!msg || msg.source !== EXTENSION_SOURCE) return
      if (msg.protocol !== PROTOCOL_NAME) return
      if (msg.type !== type) return
      if (requestId !== undefined && msg.requestId !== requestId) return
      clearTimeout(timer)
      window.removeEventListener('message', handler)
      resolve(msg)
    }

    window.addEventListener('message', handler)
  })
}

/** Reset cached availability (useful after the extension is installed/removed). */
export function resetBridge() {
  _available = null
  _checkPromise = null
}

/**
 * Check whether the proxy extension bridge is available.
 * Result is cached — subsequent calls return immediately.
 * @param {number} timeoutMs  How long to wait for the AVAILABLE reply.
 */
export function checkBridge(timeoutMs = 1500) {
  if (_available !== null) return Promise.resolve(_available)
  if (_checkPromise) return _checkPromise

  _checkPromise = (async () => {
    try {
      const p = waitFor(MSG.AVAILABLE, undefined, timeoutMs)
      post(MSG.PING)
      await p
      _available = true
    } catch {
      _available = false
    }
    _checkPromise = null
    return _available
  })()

  return _checkPromise
}

/**
 * Send an HTTP request through the extension bridge.
 * Returns a Response-compatible duck-type object.
 */
export async function bridgeFetch(url, init = {}) {
  const requestId = generateId()
  const method = (init.method ?? 'GET').toUpperCase()

  const headers = {}
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((v, k) => { headers[k] = v })
    } else {
      Object.assign(headers, init.headers)
    }
  }

  let body = null
  if (init.body != null) {
    body = typeof init.body === 'string' ? init.body : JSON.stringify(init.body)
  }

  const responsePromise = waitFor(MSG.RESPONSE, requestId, 20000)
  post(MSG.REQUEST, { requestId, payload: { url, method, headers, body } })

  const msg = await responsePromise

  if (!msg.ok) {
    const err = msg.error ?? {}
    const e = new Error(err.message ?? 'Bridge request failed')
    e.name = 'BridgeError'
    if (err.code) e.code = err.code
    if (err.status) e.status = err.status
    throw e
  }

  const r = msg.result
  return {
    ok: r.ok,
    status: r.status,
    statusText: r.statusText,
    headers: new Headers(r.headers ?? {}),
    url: r.finalUrl,
    json: () => Promise.resolve(JSON.parse(r.bodyText)),
    text: () => Promise.resolve(r.bodyText),
  }
}

/**
 * Smart fetch: routes localhost requests through the extension bridge
 * when available, falls back to native fetch otherwise.
 */
export async function smartFetch(url, init = {}) {
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)
  if (isLocal && (await checkBridge())) {
    return bridgeFetch(url, init)
  }
  return fetch(url, init)
}
