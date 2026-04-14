import React, { useRef, useEffect, useState, useMemo } from 'react';
import { HomepageElement } from '@/types/homepage';

type Socket = 'left' | 'right' | 'top' | 'bottom';

interface SegmentDef {
  fromName: string;
  fromSocket: Socket;
  toName: string;
  toSocket: Socket;
  duration: number;
  delay: number;
  startGravity: number;
  endGravity: number;
  endPlugSize: number; // 0 = no disc, >0 = disc radius
}

const SEGMENT_DEFS: SegmentDef[] = [
  { fromName: 'פירות', fromSocket: 'left', toName: 'ירקות', toSocket: 'right', duration: 1500, delay: 0, startGravity: 500, endGravity: 500, endPlugSize: 0 },
  { fromName: 'ירקות', fromSocket: 'bottom', toName: 'עלים', toSocket: 'top', duration: 1000, delay: 1500, startGravity: 80, endGravity: 80, endPlugSize: 0 },
  { fromName: 'עלים', fromSocket: 'bottom', toName: 'איקון אתר', toSocket: 'left', duration: 1000, delay: 2500, startGravity: 80, endGravity: 80, endPlugSize: 0 },
  { fromName: 'איקון אתר', fromSocket: 'right', toName: 'איקון אריזה', toSocket: 'left', duration: 1000, delay: 3500, startGravity: 700, endGravity: 700, endPlugSize: 0 },
  { fromName: 'איקון אריזה', fromSocket: 'right', toName: 'איקון בית', toSocket: 'right', duration: 1000, delay: 4500, startGravity: 150, endGravity: 150, endPlugSize: 9 },
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
  startGravity: number,
  endGravity: number,
): string {
  const cp1 = { ...from };
  const cp2 = { ...to };

  switch (fromSocket) {
    case 'left': cp1.x -= startGravity; break;
    case 'right': cp1.x += startGravity; break;
    case 'top': cp1.y -= startGravity; break;
    case 'bottom': cp1.y += startGravity; break;
  }

  switch (toSocket) {
    case 'left': cp2.x -= endGravity; break;
    case 'right': cp2.x += endGravity; break;
    case 'top': cp2.y -= endGravity; break;
    case 'bottom': cp2.y += endGravity; break;
  }

  return `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
}

const AnimatedSegment: React.FC<{
  pathD: string;
  duration: number;
  delay: number;
  isTriggered: boolean;
  endPlugSize: number;
  endPoint: { x: number; y: number };
}> = ({ pathD, duration, delay, isTriggered, endPlugSize, endPoint }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [drawDone, setDrawDone] = useState(false);

  useEffect(() => {
    if (pathRef.current) {
      setLength(pathRef.current.getTotalLength());
    }
  }, [pathD]);

  useEffect(() => {
    if (!isTriggered) {
      setAnimate(false);
      setDrawDone(false);
      return;
    }
    const startTimer = setTimeout(() => setAnimate(true), delay);
    const doneTimer = setTimeout(() => setDrawDone(true), delay + duration);
    return () => {
      clearTimeout(startTimer);
      clearTimeout(doneTimer);
    };
  }, [isTriggered, delay, duration]);

  if (!pathD || pathD.includes('NaN')) return null;

  return (
    <>
      {/* Draw animation layer */}
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
      {drawDone && length > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke="#000000"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="12 8"
          style={{
            animation: 'dashFlow 1s linear infinite',
          }}
        />
      )}
      {/* End disc */}
      {endPlugSize > 0 && drawDone && (
        <circle
          cx={endPoint.x}
          cy={endPoint.y}
          r={endPlugSize}
          fill="#000000"
          style={{
            opacity: 0,
            animation: 'fadeIn 0.3s ease forwards',
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

  const segments = useMemo(() => {
    if (!hasSize || !allFound) return [];

    return SEGMENT_DEFS.map((def) => {
      const fromEl = elementMap[def.fromName];
      const toEl = elementMap[def.toName];
      const from = getSocketPoint(fromEl, def.fromSocket, width, height);
      const to = getSocketPoint(toEl, def.toSocket, width, height);
      const path = buildCurvePath(from, def.fromSocket, to, def.toSocket, def.startGravity, def.endGravity);
      return { path, duration: def.duration, delay: def.delay, endPlugSize: def.endPlugSize, endPoint: to };
    });
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
                endPlugSize={seg.endPlugSize}
                endPoint={seg.endPoint}
              />
            ))}
          </svg>
        )}
      </div>
    </>
  );
};
