'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Barra de progreso superior que aparece al instante cuando el usuario
 * navega a otra página. Soluciona la sensación de "¿toqué bien?" cuando
 * el servidor tarda en responder.
 *
 * Cómo funciona:
 * - Escucha clicks en cualquier <Link> interno
 * - Muestra la barra animándose de 0 → 70% mientras se carga
 * - Cuando el pathname cambia, completa al 100% y desaparece
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  // Cuando el pathname cambia, la navegación terminó
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Si tiene modificadores (cmd, ctrl, etc.) lo ignoramos (abre en nueva pestaña)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;
      // Solo navegación interna
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      // Si es _blank, no es navegación de página actual
      if (link.target === '_blank') return;
      // Si es la misma página, no mostrar
      if (href === pathname) return;

      setIsLoading(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="nav-progress"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.7 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{
            scaleX: { duration: 1.8, ease: [0.1, 0.7, 0.3, 0.95] },
            opacity: { duration: 0.25 },
          }}
          style={{ transformOrigin: 'left' }}
          className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 z-[100] shadow-[0_0_10px_rgba(245,158,11,0.6)]"
        />
      )}
    </AnimatePresence>
  );
}
