import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Animated dashed SVG lines connecting 6 homepage elements:
 * פירות -> ירקות -> עלים -> איקון אתר -> איקון אריזה -> איקון בית
 *
 * Mimics LeaderLine behavior: sequential draw animation with flowing dashes.
 * All coordinates are percentages matching element positions in the database.
 */

// Waypoints as percentage coordinates (x%, y%) based on DB positions
const WAYPOINTS = [
  { x: 81.33, y: 31.5, label: 'פירות' },
  { x: 51.32, y: 31.5, label: 'ירקות' },
  { x: 21.40, y: 31.5, label: 'עלים' },
  { x: 19.20, y: 36.97, label: 'איקון אתר' },
  { x: 58.83, y: 38.04, label: 'איקון אריזה' },
  { x: 77.00, y: 45.27, label: 'איקון בית' },
];

// Define the 5 line segments between 6 points
interface LineSegment {
  path: string;
  duration: number;
  delay: number;
}

function buildSegments(): LineSegment[] {
  const s = (pct: number) => (pct / 100) * 1000;
  const segments: LineSegment[] = [];

  const w = WAYPOINTS.map(p => ({ x: s(p.x), y: s(p.y) }));

  // Line 1: פירות -> ירקות (left, horizontal curve - RTL direction)
  segments.push({
    path: `M ${w[0].x} ${w[0].y} C ${w[0].x - 50} ${w[0].y + 40}, ${w[1].x + 50} ${w[1].y + 40}, ${w[1].x} ${w[1].y}`,
    duration: 1500,
    delay: 0,
  });

  // Line 2: ירקות -> עלים (continue left)
  segments.push({
    path: `M ${w[1].x} ${w[1].y} C ${w[1].x - 50} ${w[1].y + 35}, ${w[2].x + 50} ${w[2].y + 35}, ${w[2].x} ${w[2].y}`,
    duration: 1000,
    delay: 1500,
  });

  // Line 3: עלים -> איקון אתר (curve down)
  segments.push({
    path: `M ${w[2].x} ${w[2].y} C ${w[2].x - 20} ${w[2].y + 25}, ${w[3].x - 20} ${w[3].y - 20}, ${w[3].x} ${w[3].y}`,
    duration: 1000,
    delay: 2500,
  });

  // Line 4: איקון אתר -> איקון אריזה (curve right, slightly down)
  segments.push({
    path: `M ${w[3].x} ${w[3].y} C ${w[3].x + 80} ${w[3].y + 30}, ${w[4].x - 80} ${w[4].y - 20}, ${w[4].x} ${w[4].y}`,
    duration: 1000,
    delay: 3500,
  });

  // Line 5: איקון אריזה -> איקון בית (curve right and down)
  segments.push({
    path: `M ${w[4].x} ${w[4].y} C ${w[4].x + 50} ${w[4].y + 40}, ${w[5].x + 30} ${w[5].y - 30}, ${w[5].x} ${w[5].y}`,
    duration: 1000,
    delay: 4500,
  });

  return segments;
}

const DASH = '12 8';

const AnimatedSegment: React.FC<{
  pathD: string;
  duration: number;
  delay: number;
  isTriggered: boolean;
  isLast?: boolean;
}> = ({ pathD, duration, delay, isTriggered, isLast }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (pathRef.current) {
      setLength(pathRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    if (!isTriggered) {
      setAnimate(false);
      return;
    }
    const timer = setTimeout(() => setAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [isTriggered, delay]);

  return (
    <>
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="#251F20"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={length > 0 ? `${length}` : 'none'}
        strokeDashoffset={animate ? 0 : length}
        style={{
          transition: animate
            ? `stroke-dashoffset ${duration}ms cubic-bezier(0.58, 0, 0.41, 1)`
            : 'none',
        }}
      />
      {/* Flowing dash overlay - only visible after draw is complete */}
      {animate && length > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke="#251F20"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={DASH}
          opacity={animate ? 1 : 0}
          style={{
            animation: 'dashFlow 1s linear infinite',
            transition: `opacity ${duration}ms ease ${duration}ms`,
          }}
        />
      )}
      {/* Disc at the end of the last segment */}
      {isLast && animate && (
        <circle
          cx={pathD.split(' ').slice(-2, -1)[0]}
          cy={pathD.split(' ').slice(-1)[0]}
          r="6"
          fill="#251F20"
          opacity={animate ? 1 : 0}
          style={{
            transition: `opacity 0.3s ease`,
            transitionDelay: `${duration}ms`,
          }}
        />
      )}
    </>
  );
};

export const AnimatedPathLine: React.FC = () => {
  const containerRef = useRef<SVGSVGElement>(null);
  const [isTriggered, setIsTriggered] = useState(false);
  const segments = buildSegments();

  // End point for the disc
  const lastWp = WAYPOINTS[WAYPOINTS.length - 1];
  const endX = (lastWp.x / 100) * 1000;
  const endY = (lastWp.y / 100) * 1000;

  useEffect(() => {
    console.log('AnimatedPathLine mounted, containerRef:', !!containerRef.current);
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('AnimatedPathLine intersection:', entry.isIntersecting, 'boundingRect top:', entry.boundingClientRect.top);
          if (entry.isIntersecting) {
            console.log('AnimatedPathLine TRIGGERED - starting animation');
            setIsTriggered(true);
            observer.disconnect();
          }
        });
      },
      { root: null, rootMargin: '0px 0px -20% 0px', threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes dashFlow {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
      <svg
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        style={{ zIndex: 5 }}
      >
        {segments.map((seg, i) => (
          <AnimatedSegment
            key={i}
            pathD={seg.path}
            duration={seg.duration}
            delay={seg.delay}
            isTriggered={isTriggered}
            isLast={i === segments.length - 1}
          />
        ))}
        {/* End disc */}
        <circle
          cx={endX}
          cy={endY}
          r="6"
          fill="#251F20"
          opacity={isTriggered ? 1 : 0}
          style={{
            transition: 'opacity 0.3s ease',
            transitionDelay: '5.5s',
          }}
        />
      </svg>
    </>
  );
};
