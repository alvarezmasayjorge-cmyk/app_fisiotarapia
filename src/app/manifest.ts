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
        src: '/favicon.ico',
        sizes: '256x256',
        type: 'image/x-icon',
      },
    ],
  };
}
