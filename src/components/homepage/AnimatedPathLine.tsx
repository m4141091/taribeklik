import React, { useRef, useEffect, useState } from 'react';

/**
 * Animated dashed SVG lines connecting 6 homepage elements.
 * Uses the exact SVG path from the Figma design, positioned as an overlay.
 * 
 * Element positions (from DB):
 * פירות: x=81.33%, y=31.5%
 * ירקות: x=51.32%, y=31.5%
 * עלים: x=21.40%, y=31.5%
 * איקון אתר: x=19.20%, y=36.97%
 * איקון אריזה: x=58.83%, y=38.04%
 * איקון בית: x=77.00%, y=45.27%
 */

// Build 5 path segments between the 6 points
// Coordinates in pixel space (will be placed in an SVG that matches the container)
function buildSegments(containerWidth: number, containerHeight: number) {
  const points = [
    { x: 0.8133 * containerWidth, y: 0.315 * containerHeight },   // פירות
    { x: 0.5132 * containerWidth, y: 0.315 * containerHeight },   // ירקות
    { x: 0.2140 * containerWidth, y: 0.315 * containerHeight },   // עלים
    { x: 0.1920 * containerWidth, y: 0.3697 * containerHeight },  // איקון אתר
    { x: 0.5883 * containerWidth, y: 0.3804 * containerHeight },  // איקון אריזה
    { x: 0.7700 * containerWidth, y: 0.4527 * containerHeight },  // איקון בית
  ];

  const p = points;
  const segments = [];

  // Line 1: פירות -> ירקות (horizontal curve, going left in RTL)
  const g1 = (p[0].x - p[1].x) * 0.4;
  segments.push({
    path: `M ${p[0].x} ${p[0].y} C ${p[0].x - g1} ${p[0].y + 40}, ${p[1].x + g1} ${p[1].y + 40}, ${p[1].x} ${p[1].y}`,
    duration: 1500,
    delay: 0,
  });

  // Line 2: ירקות -> עלים (continue left)
  const g2 = (p[1].x - p[2].x) * 0.4;
  segments.push({
    path: `M ${p[1].x} ${p[1].y} C ${p[1].x - g2} ${p[1].y + 35}, ${p[2].x + g2} ${p[2].y + 35}, ${p[2].x} ${p[2].y}`,
    duration: 1000,
    delay: 1500,
  });

  // Line 3: עלים -> איקון אתר (curve down-left)
  segments.push({
    path: `M ${p[2].x} ${p[2].y} C ${p[2].x - 20} ${p[2].y + (p[3].y - p[2].y) * 0.6}, ${p[3].x - 30} ${p[3].y - (p[3].y - p[2].y) * 0.3}, ${p[3].x} ${p[3].y}`,
    duration: 1000,
    delay: 2500,
  });

  // Line 4: איקון אתר -> איקון אריזה (curve right)
  const g4 = (p[4].x - p[3].x) * 0.35;
  segments.push({
    path: `M ${p[3].x} ${p[3].y} C ${p[3].x + g4} ${p[3].y + 50}, ${p[4].x - g4} ${p[4].y - 30}, ${p[4].x} ${p[4].y}`,
    duration: 1000,
    delay: 3500,
  });

  // Line 5: איקון אריזה -> איקון בית (curve right-down)
  const g5x = (p[5].x - p[4].x) * 0.4;
  const g5y = (p[5].y - p[4].y) * 0.4;
  segments.push({
    path: `M ${p[4].x} ${p[4].y} C ${p[4].x + g5x} ${p[4].y + g5y + 30}, ${p[5].x + 40} ${p[5].y - g5y}, ${p[5].x} ${p[5].y}`,
    duration: 1000,
    delay: 4500,
  });

  return { segments, endPoint: p[5] };
}

const DASH = '12 8';

const AnimatedSegment: React.FC<{
  pathD: string;
  duration: number;
  delay: number;
  isTriggered: boolean;
}> = ({ pathD, duration, delay, isTriggered }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (pathRef.current) {
      setLength(pathRef.current.getTotalLength());
    }
  }, [pathD]);

  useEffect(() => {
    if (!isTriggered) {
      setAnimate(false);
      return;
    }
    const timer = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [isTriggered, delay]);

  if (!pathD || pathD.includes('NaN')) return null;

  return (
    <>
      {/* Draw animation path */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="#000000"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={length > 0 ? `${length}` : '0'}
        strokeDashoffset={animate ? 0 : length}
        style={{
          transition: animate
            ? `stroke-dashoffset ${duration}ms cubic-bezier(0.58, 0, 0.41, 1)`
            : 'none',
        }}
      />
      {/* Flowing dash overlay */}
      {animate && length > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke="#000000"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={DASH}
          style={{
            animation: 'dashFlow 1s linear infinite',
            opacity: 1,
          }}
        />
      )}
    </>
  );
};

export const AnimatedPathLine: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTriggered, setIsTriggered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const parent = containerRef.current.parentElement;
    if (!parent) return;

    // Use ResizeObserver for reliable dimension tracking
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    resizeObserver.observe(parent);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsTriggered(true);
            intersectionObserver.disconnect();
          }
        });
      },
      { root: null, rootMargin: '200px 0px 0px 0px', threshold: 0 }
    );

    intersectionObserver.observe(containerRef.current);
    return () => {
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  const { width, height } = dimensions;
  const hasSize = width > 0 && height > 0;
  const { segments, endPoint } = hasSize
    ? buildSegments(width, height)
    : { segments: [], endPoint: { x: 0, y: 0 } };

  return (
    <>
      <style>{`
        @keyframes dashFlow {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
      >
        {hasSize && (
          <svg
            className="absolute inset-0"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ overflow: 'visible' }}
          >
            {segments.map((seg, i) => (
              <AnimatedSegment
                key={i}
                pathD={seg.path}
                duration={seg.duration}
                delay={seg.delay}
                isTriggered={isTriggered}
              />
            ))}
            {/* End disc */}
            {isTriggered && (
              <circle
                cx={endPoint.x}
                cy={endPoint.y}
                r="8"
                fill="#000000"
                opacity={isTriggered ? 1 : 0}
                style={{
                  transition: 'opacity 0.3s ease',
                  transitionDelay: '5.5s',
                }}
              />
            )}
          </svg>
        )}
      </div>
    </>
  );
};
