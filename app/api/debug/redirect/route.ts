import { NextResponse } from 'next/server'

export async function GET() {
  const nextAuthUrl = process.env.NEXTAUTH_URL || null
  const discordClientIdPresent = Boolean(process.env.DISCORD_CLIENT_ID)
  const discordClientSecretPresent = Boolean(process.env.DISCORD_CLIENT_SECRET)
  const redirect = nextAuthUrl ? `${nextAuthUrl.replace(/\/$/, '')}/api/auth/callback/discord` : null

  // Return only non-sensitive diagnostics
  return NextResponse.json({
    nextAuthUrl,
    redirect,
    discordClientIdPresent,
    discordClientSecretPresent,
  })
}
