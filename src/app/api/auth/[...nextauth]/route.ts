import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"

const handler = (req: NextRequest, ctx: any) => {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host")
  const proto = req.headers.get("x-forwarded-proto") || "https"
  if (host) {
    // Avoid overriding if we are on localhost and a specific configuration exists
    if (!host.includes("localhost:3000") || !process.env.NEXTAUTH_URL) {
      process.env.NEXTAUTH_URL = `${proto}://${host}`
    }
  }
  return NextAuth(authOptions)(req, ctx)
}

export { handler as GET, handler as POST }

