import * as React from 'react';

// CpuArchitecture — asymmetric PCB-trace network. The icon sits in the
// upper-left of the SVG (around viewBox 10..46 × 10..46). Traces extend
// rightward across the wordmark area with varied lengths and right-angle
// bends, ending at connection pads. Three of the traces carry an animated
// stroke-dash flow. The corresponding pads pulse on the same cycle so the
// pad visibly lights up when the data wave arrives.
//
// All motion driven by globals.css (`@keyframes animation-path` for the
// dash flow, `@keyframes cpu-pad-pulse` for the pad lighting).

export interface CpuArchitectureProps extends React.SVGProps<SVGSVGElement> {
  text?: string;
  showCore?: boolean;
}

export const CpuArchitecture = React.forwardRef<SVGSVGElement, CpuArchitectureProps>(
  ({ className, text = 'SV', showCore = false, ...props }, ref) => {
    const cls = `cpu-architecture${className ? ` ${className}` : ''}`;
    return (
      <svg
        ref={ref}
        className={cls}
        viewBox="0 0 200 56"
        fill="none"
        preserveAspectRatio="xMinYMid meet"
        aria-hidden="true"
        {...props}
      >
        {/* Static base traces — right-side endpoints extended by another 15%
            (138→159, 170→196, 175→201, 161→185). Distinct y-levels still
            preserved so no two traces overlap. */}
        <path className="cpu-trace" d="M30 18 V8 H10" />
        <path className="cpu-trace" d="M44 14 H80 V4 H174" />
        <path className="cpu-trace" d="M48 22 H72 V12 H100 V8 H196" />
        <path className="cpu-trace" d="M48 32 H80 V40 H120 V44 H201" />
        <path className="cpu-trace" d="M44 42 H100 V52 H219" />
        <path className="cpu-trace" d="M30 46 H22 V52 H10" />

        {/* Animated flow lines — five of the six traces carry live data.
            Each line gets its own duration + delay so the bundle reads as
            asynchronous activity, not a synchronized loop.
              line-1: top med-right     (path 2)
              line-2: top long-right    (path 3)
              line-3: mid-right far     (path 4)
              line-4: short top-left    (path 1)
              line-5: short bottom-left (path 6) */}
        <path className="cpu-line cpu-line-1" d="M44 14 H80 V4 H174" />
        <path className="cpu-line cpu-line-2" d="M48 22 H72 V12 H100 V8 H196" />
        <path className="cpu-line cpu-line-3" d="M48 32 H80 V40 H120 V44 H201" />
        <path className="cpu-line cpu-line-4" d="M30 18 V8 H10" />
        <path className="cpu-line cpu-line-5" d="M30 46 H22 V52 H10" />
        <path className="cpu-line cpu-line-6" d="M44 42 H100 V52 H219" />

        {/* Connection pads — five "powered" pads pulse on the same cycle as
            their associated flow line. The bottom-mid pad has no flow so it
            stays steady at base glow. */}
        <circle className="cpu-pad cpu-pad-4" cx="10" cy="8" r="1.8" />
        <circle className="cpu-pad cpu-pad-1" cx="174" cy="4" r="1.8" />
        <circle className="cpu-pad cpu-pad-2" cx="196" cy="8" r="1.8" />
        <circle className="cpu-pad cpu-pad-3" cx="201" cy="44" r="1.8" />
        <circle className="cpu-pad cpu-pad-6" cx="219" cy="52" r="1.8" />
        <circle className="cpu-pad cpu-pad-5" cx="10" cy="52" r="1.8" />

        {showCore && (
          <g className="cpu-core-group">
            <rect className="cpu-core" x="10" y="14" width="36" height="28" rx="2" />
            <text
              className="cpu-core-text"
              x="28"
              y="30"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {text}
            </text>
          </g>
        )}
      </svg>
    );
  },
);
CpuArchitecture.displayName = 'CpuArchitecture';
