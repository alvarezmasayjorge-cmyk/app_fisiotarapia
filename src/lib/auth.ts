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
        identifier: { label: "Teléfono", type: "text", placeholder: "+59171234567" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Teléfono y contraseña requeridos');
        }

        const phoneNorm = credentials.identifier.trim().replace(/[\s\-()]/g, '');

        const user = await prisma.user.findFirst({
          where: { phone: phoneNorm },
          include: { patientProfile: { select: { isActive: true } } }
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Contraseña incorrecta');
        }

        if (user.role === 'PATIENT' && user.patientProfile && !user.patientProfile.isActive) {
          throw new Error('Tu cuenta está inactiva. Contacta a tu doctora.');
        }

        return {
          id: user.id,
          email: user.phone ?? user.id,
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
