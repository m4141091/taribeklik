import React, { useRef, useEffect, useState, useMemo } from 'react';
import { HomepageElement } from '@/types/homepage';

/**
 * Animated dashed SVG lines connecting 6 homepage elements dynamically.
 * Reads positions from DB elements so the line follows when elements are moved.
 *
 * Connection order (matching Figma/Elementor script):
 * 1: פירות (left) -> ירקות (right)
 * 2: ירקות (bottom) -> עלים (top)
 * 3: עלים (bottom) -> איקון אתר (left)
 * 4: איקון אתר (right) -> איקון אריזה (left)
 * 5: איקון אריזה (right) -> איקון בית (right)
 */

type Socket = 'left' | 'right' | 'top' | 'bottom';

interface SegmentDef {
  fromName: string;
  fromSocket: Socket;
  toName: string;
  toSocket: Socket;
  duration: number;
  delay: number;
  gravity: number; // controls curve depth
}

const SEGMENT_DEFS: SegmentDef[] = [
  { fromName: 'פירות', fromSocket: 'left', toName: 'ירקות', toSocket: 'right', duration: 1500, delay: 0, gravity: 80 },
  { fromName: 'ירקות', fromSocket: 'bottom', toName: 'עלים', toSocket: 'top', duration: 1000, delay: 1500, gravity: 60 },
  { fromName: 'עלים', fromSocket: 'bottom', toName: 'איקון אתר', toSocket: 'left', duration: 1000, delay: 2500, gravity: 50 },
  { fromName: 'איקון אתר', fromSocket: 'right', toName: 'איקון אריזה', toSocket: 'left', duration: 1000, delay: 3500, gravity: 70 },
  { fromName: 'איקון אריזה', fromSocket: 'right', toName: 'איקון בית', toSocket: 'right', duration: 1000, delay: 4500, gravity: 60 },
];

const ELEMENT_NAMES = ['פירות', 'ירקות', 'עלים', 'איקון אתר', 'איקון אריזה', 'איקון בית'];

function parseSize(value: string, containerDimension: number): number {
  if (value.endsWith('px')) return parseFloat(value);
  if (value.endsWith('%')) return (parseFloat(value) / 100) * containerDimension;
  return parseFloat(value) || 0;
}

function getSocketPoint(
  el: HomepageElement,
  socket: Socket,
  containerWidth: number,
  containerHeight: number,
): { x: number; y: number } {
  const cx = (el.position_x / 100) * containerWidth;
  const cy = (el.position_y / 100) * containerHeight;
  const halfW = parseSize(el.width, containerWidth) / 2;
  const halfH = parseSize(el.height, containerHeight) / 2;

  switch (socket) {
    case 'left': return { x: cx - halfW, y: cy };
    case 'right': return { x: cx + halfW, y: cy };
    case 'top': return { x: cx, y: cy - halfH };
    case 'bottom': return { x: cx, y: cy + halfH };
  }
}

function buildCurvePath(
  from: { x: number; y: number },
  fromSocket: Socket,
  to: { x: number; y: number },
  toSocket: Socket,
  gravity: number,
): string {
  // Control points extend from the socket direction
  const cp1 = { ...from };
  const cp2 = { ...to };

  switch (fromSocket) {
    case 'left': cp1.x -= gravity; break;
    case 'right': cp1.x += gravity; break;
    case 'top': cp1.y -= gravity; break;
    case 'bottom': cp1.y += gravity; break;
  }

  switch (toSocket) {
    case 'left': cp2.x -= gravity; break;
    case 'right': cp2.x += gravity; break;
    case 'top': cp2.y -= gravity; break;
    case 'bottom': cp2.y += gravity; break;
  }

  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
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
      {/* Draw animation: solid line that reveals via dashoffset */}
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
      {/* Flowing dash overlay - appears after draw completes */}
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

interface AnimatedPathLineProps {
  elements: HomepageElement[];
}

export const AnimatedPathLine: React.FC<AnimatedPathLineProps> = ({ elements }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTriggered, setIsTriggered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Map element names to elements
  const elementMap = useMemo(() => {
    const map: Record<string, HomepageElement> = {};
    for (const el of elements) {
      if (el.name && ELEMENT_NAMES.includes(el.name)) {
        map[el.name] = el;
      }
    }
    return map;
  }, [elements]);

  const allFound = ELEMENT_NAMES.every((name) => elementMap[name]);

  useEffect(() => {
    if (!containerRef.current) return;

    const parent = containerRef.current.parentElement;
    if (!parent) return;

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
      { root: null, rootMargin: '200px 0px 0px 0px', threshold: 0 },
    );
    intersectionObserver.observe(containerRef.current);

    return () => {
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  const { width, height } = dimensions;
  const hasSize = width > 0 && height > 0;

  // Build segments from dynamic element positions
  const { segments, endPoint } = useMemo(() => {
    if (!hasSize || !allFound) return { segments: [] as { path: string; duration: number; delay: number }[], endPoint: { x: 0, y: 0 } };

    const segs = SEGMENT_DEFS.map((def) => {
      const fromEl = elementMap[def.fromName];
      const toEl = elementMap[def.toName];
      const from = getSocketPoint(fromEl, def.fromSocket, width, height);
      const to = getSocketPoint(toEl, def.toSocket, width, height);
      const path = buildCurvePath(from, def.fromSocket, to, def.toSocket, def.gravity);
      return { path, duration: def.duration, delay: def.delay };
    });

    // End point is the last segment's target
    const lastDef = SEGMENT_DEFS[SEGMENT_DEFS.length - 1];
    const lastEl = elementMap[lastDef.toName];
    const ep = getSocketPoint(lastEl, lastDef.toSocket, width, height);

    return { segments: segs, endPoint: ep };
  }, [hasSize, allFound, elementMap, width, height]);

  if (!allFound) return null;

  return (
    <>
      <style>{`
        @keyframes dashFlow {
          to { stroke-dashoffset: -20; }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
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
            {/* End disc at last point */}
            {isTriggered && (
              <circle
                cx={endPoint.x}
                cy={endPoint.y}
                r="8"
                fill="#000000"
                style={{
                  opacity: 0,
                  animation: isTriggered ? 'fadeIn 0.3s ease forwards' : 'none',
                  animationDelay: '5.5s',
                }}
              />
            )}
          </svg>
        )}
      </div>
    </>
  );
};
