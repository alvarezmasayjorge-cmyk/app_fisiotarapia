import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Detectar automáticamente la URL en producción de Vercel si no está definida manualmente
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: "Email o Teléfono", type: "text", placeholder: "tu@email.com o +51999999999" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Email/Teléfono y contraseña requeridos');
        }

        const raw = credentials.identifier.trim();
        const emailNorm = raw.toLowerCase();
        const phoneNorm = raw.replace(/[\s\-()]/g, '');

        // Buscar por email (case-insensitive) o teléfono (sin espacios/guiones)
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: emailNorm, mode: 'insensitive' } },
              { phone: phoneNorm }
            ]
          }
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Contraseña incorrecta');
        }

        return {
          id: user.id,
          email: user.email || user.phone,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Ruta personalizada para login
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
