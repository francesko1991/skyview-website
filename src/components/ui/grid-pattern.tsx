import { useId } from 'react';
import { cn } from '@/lib/utils';

interface GridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  squares?: Array<[x: number, y: number]>;
  strokeDasharray?: string;
  className?: string;
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = '0',
  squares,
  className,
  ...props
}: GridPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={cn('grid-pattern', className)}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      {squares && (
        <svg x={x} y={y} className="grid-pattern-squares">
          {squares.map(([sx, sy], i) => (
            <rect
              strokeWidth="0"
              key={`${sx}-${sy}-${i}`}
              width={width - 1}
              height={height - 1}
              x={sx * width + 1}
              y={sy * height + 1}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

// Full-viewport wrapper that fades the grid with a radial mask + seeds a
// handful of highlighted squares for blueprint character.
export function GridBackground() {
  return (
    <div className="grid-bg" aria-hidden="true">
      <GridPattern
        width={56}
        height={56}
        x={-1}
        y={-1}
        squares={[
          [3, 2], [7, 5], [12, 3], [4, 9], [14, 11],
          [9, 14], [18, 7], [22, 13], [6, 16], [16, 18],
        ]}
        className="grid-pattern-fade"
      />
    </div>
  );
}
