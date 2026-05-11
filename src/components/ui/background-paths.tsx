import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// FloatingPaths — directed bundle from the headline accent words ("home,"
// and "you.") into the dashboard area on the right. Desktop only — on
// portrait phone the horizontal sweep has no analogue, so we don't render.
function FloatingPaths() {
  const O_HOME = { x: 500, y: 450 };
  const O_YOU  = { x: 460, y: 430 };
  const T = { x: 1240, y: 510 };
  const COUNT_PER_BUNDLE = 14;

  const makeBundle = (origin: { x: number; y: number }, prefix: string, ySign: number) =>
    Array.from({ length: COUNT_PER_BUNDLE }, (_, i) => {
      const t = i / (COUNT_PER_BUNDLE - 1);
      const fan = (t - 0.5) * 2;
      const sx = origin.x + fan * 4;
      const sy = origin.y + fan * 14;
      const ex = T.x + fan * 32;
      const ey = T.y + fan * 70;
      const midX = (origin.x + T.x) / 2;
      const midY = (origin.y + T.y) / 2;
      const cp1x = origin.x + (midX - origin.x) * 0.5 + fan * 30;
      const cp1y = origin.y + (midY - origin.y) * 0.4 + ySign * 60 + fan * 40;
      const cp2x = T.x - (T.x - midX) * 0.5 + fan * 40;
      const cp2y = T.y - (T.y - midY) * 0.3 + ySign * 30 + fan * 50;
      return {
        id: `${prefix}-${i}`,
        d: `M${sx} ${sy} C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`,
        width: 0.5 + i * 0.04,
        idx: i,
      };
    });

  const paths = [
    ...makeBundle(O_HOME, 'home', +1),
    ...makeBundle(O_YOU,  'you',  -1),
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="none"
        style={{ color: 'var(--ink)' }}
      >
        <title>Background Paths</title>
        {paths.map((path, i) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.12 + path.idx * 0.025}
            strokeLinecap="round"
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.7, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 18 + (i % 6) * 2 + Math.random() * 4,
              delay: -i * 0.4,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 720px)').matches;
  });
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

// BackgroundPaths — desktop only. On phone we skip the render entirely so the
// SVG, the 28 framer-motion paths, and the flow-field overlay never enter the
// DOM. The grid pattern + brackets carry the brand atmosphere on mobile.
export function BackgroundPaths() {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return (
    <div className="flow-field" aria-hidden="true">
      <div className="flow-field-fwd">
        <FloatingPaths />
      </div>
    </div>
  );
}
