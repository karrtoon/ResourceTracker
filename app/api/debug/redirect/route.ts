import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const inferredOrigin = url.origin

    const nextAuthUrl = process.env.NEXTAUTH_URL || null
    const clientId = process.env.DISCORD_CLIENT_ID || null
    const clientSecretPresent = Boolean(process.env.DISCORD_CLIENT_SECRET)

    const redirectFromEnv = nextAuthUrl ? `${nextAuthUrl.replace(/\/$/, '')}/api/auth/callback/discord` : null
    const redirectInferred = `${inferredOrigin.replace(/\/$/, '')}/api/auth/callback/discord`

    const rawCookieHeader = req.headers.get('cookie') || ''

    // Parse cookies into a map
    const cookieMap: Record<string, string> = {}
    rawCookieHeader.split(';').map(c => c.trim()).filter(Boolean).forEach(pair => {
      const idx = pair.indexOf('=')
      if (idx > -1) {
        const k = pair.slice(0, idx).trim()
        const v = pair.slice(idx + 1).trim()
        cookieMap[k] = v
      }
    })

    // Candidate cookie names NextAuth may use for callback URL
    const callbackCookieNames = [
      process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ]

    function tryBase64Decode(value: string) {
      try {
        // Try Node Buffer if available
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(value, 'base64').toString('utf8')
        }
        // Fallback to atob in web runtimes
        if (typeof atob !== 'undefined') {
          return atob(value)
        }
      } catch (e) {
        return null
      }
      return null
    }

    const callbackCookieDebug: Record<string, any> = {}
    for (const name of callbackCookieNames) {
      if (cookieMap[name]) {
        const raw = cookieMap[name]
        // Some values may be URL encoded
        let decoded = null
        try {
          decoded = decodeURIComponent(raw)
        } catch (e) {
          decoded = raw
        }

        // Try base64 decode and JSON parse
        let base64Decoded = null
        let jsonParsed = null
        try {
          base64Decoded = tryBase64Decode(decoded)
          if (base64Decoded) {
            try {
              jsonParsed = JSON.parse(base64Decoded)
            } catch (e) {
              // not JSON
            }
          }
        } catch (e) {
          // ignore decode errors
        }

        callbackCookieDebug[name] = { raw, decoded, base64Decoded, jsonParsed }
      }
    }

    const payload = {
      nextAuthUrl,
      discordClientId: clientId,
      discordClientSecretPresent: clientSecretPresent,
      redirectFromEnv,
      redirectInferred,
      cookiesRaw: rawCookieHeader || null,
      cookies: cookieMap,
      callbackCookieDebug,
      // Common proxy headers that affect origin detection
      forwardedHost: req.headers.get('x-forwarded-host') || null,
      forwardedProto: req.headers.get('x-forwarded-proto') || null,
      forwardedFor: req.headers.get('x-forwarded-for') || null,
      note: 'Add the exact redirect (one of the redirect_* values) to your Discord app OAuth2 Redirects. Trailing slashes, scheme, host and port must match exactly.'
    }

    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
