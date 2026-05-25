import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"

const handler = (req: NextRequest, ctx: any) => {
  // Only auto-detect URL from headers when NEXTAUTH_URL is not explicitly set
  // (e.g. Vercel preview deployments). If NEXTAUTH_URL is set in env vars, always respect it.
  if (!process.env.NEXTAUTH_URL) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
    const proto = req.headers.get("x-forwarded-proto") || "https"
    if (host) {
      process.env.NEXTAUTH_URL = `${proto}://${host}`
    }
  }
  return NextAuth(authOptions)(req, ctx)
}

export { handler as GET, handler as POST }

