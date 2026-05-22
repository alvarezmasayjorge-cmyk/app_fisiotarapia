import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sentirse Única - Plataforma de Rehabilitación',
    short_name: 'Sentirse Única',
    description: 'Tu plataforma para sentirte única en tu proceso de recuperación.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fffbeb',
    theme_color: '#f59e0b',
    orientation: 'portrait',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
