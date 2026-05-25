'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 80;
const MAX_PULL = 120;

export default function PullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const isPulling = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Solo activar si estamos al tope de la página
      if (window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      isPulling.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      if (window.scrollY > 0) {
        startY.current = null;
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        isPulling.current = true;
        // Resistencia: cuanto más se arrastra, menos avanza
        const resistance = 1 - Math.min(diff / 400, 0.6);
        const distance = Math.min(diff * resistance, MAX_PULL);
        setPullDistance(distance);
        // Prevenir el scroll nativo cuando estamos haciendo pull
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) {
        startY.current = null;
        return;
      }

      if (pullDistance >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPullDistance(THRESHOLD);
        try {
          router.refresh();
          // Pequeña espera para feedback visual
          await new Promise((resolve) => setTimeout(resolve, 600));
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }

      startY.current = null;
      isPulling.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [pullDistance, refreshing, router]);

  const showIndicator = pullDistance > 0 || refreshing;
  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 360;

  return (
    <>
      {showIndicator && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none z-[100]"
          style={{
            transform: `translateY(${Math.max(pullDistance - 40, 0)}px)`,
            transition: refreshing ? 'transform 200ms ease' : 'none',
          }}
        >
          <div className="bg-white shadow-lg rounded-full p-2.5 border border-slate-100">
            <RefreshCw
              className={`w-5 h-5 text-amber-500 ${refreshing ? 'animate-spin' : ''}`}
              style={{
                transform: refreshing ? undefined : `rotate(${rotation}deg)`,
                opacity: refreshing ? 1 : 0.4 + progress * 0.6,
              }}
            />
          </div>
        </div>
      )}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance / 2}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 200ms ease' : 'none',
        }}
      >
        {children}
      </div>
    </>
  );
}
