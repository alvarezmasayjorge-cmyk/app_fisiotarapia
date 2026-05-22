'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullscreen?: boolean;
}

const SIZES = {
  sm: { logo: 40, ring: 56, text: 'text-xs' },
  md: { logo: 64, ring: 88, text: 'text-sm' },
  lg: { logo: 96, ring: 132, text: 'text-base' },
};

export default function BrandedLoader({ size = 'md', label, fullscreen = false }: Props) {
  const s = SIZES[size];

  const loader = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: s.ring, height: s.ring }}>
        {/* Anillo giratorio */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />
        {/* Anillo exterior con pulso suave */}
        <motion.div
          className="absolute inset-0 rounded-full border border-amber-200"
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        />
        {/* Logo con respiración */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="relative z-10"
        >
          <Image
            src="/logo.png"
            alt="Sentirse Única"
            width={s.logo}
            height={s.logo}
            className="object-contain"
            style={{ width: s.logo, height: 'auto' }}
            priority
          />
        </motion.div>
      </div>

      {label && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${s.text} text-slate-500 font-medium`}
        >
          {label}
        </motion.p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {loader}
      </div>
    );
  }

  return loader;
}
