import React, { useRef, useEffect, useState } from 'react';

/**
 * Animated dashed SVG line connecting 6 homepage elements:
 * פירות -> ירקות -> עלים -> איקון אתר -> איקון אריזה -> איקון בית
 * 
 * All coordinates are percentages of the container dimensions,
 * matching the element positions from the database.
 */

// Waypoints as percentage coordinates (x%, y%) based on DB positions
// The line starts below each image/button and connects to the icon centers
const WAYPOINTS = {
  fruits:    { x: 81.33, y: 31.5 },   // below פירות
  vegs:      { x: 51.32, y: 31.5 },   // below ירקות
  leaves:    { x: 21.40, y: 31.5 },   // below עלים
  iconSite:  { x: 19.20, y: 36.97 },  // איקון אתר
  iconPack:  { x: 58.83, y: 38.04 },  // איקון אריזה
  iconHome:  { x: 77.00, y: 45.27 },  // איקון בית
};

function buildPath(): string {
  const w = WAYPOINTS;
  
  // All values are percentages — we'll use a 1000x1000 viewBox 
  // and scale percentages to that coordinate space
  const s = (pct: number) => (pct / 100) * 1000;

  const fx = s(w.fruits.x), fy = s(w.fruits.y);
  const vx = s(w.vegs.x), vy = s(w.vegs.y);
  const lx = s(w.leaves.x), ly = s(w.leaves.y);
  const sx = s(w.iconSite.x), sy = s(w.iconSite.y);
  const px = s(w.iconPack.x), py = s(w.iconPack.y);
  const hx = s(w.iconHome.x), hy = s(w.iconHome.y);

  // Build a smooth cubic bezier path through all waypoints
  // Right-to-left: fruits -> vegs -> leaves, then down to icons
  return [
    `M ${fx} ${fy}`,
    // Fruits -> Vegs (horizontal curve going left)
    `C ${fx - 40} ${fy + 30}, ${vx + 40} ${vy + 30}, ${vx} ${vy}`,
    // Vegs -> Leaves (continue left)
    `C ${vx - 40} ${vy + 25}, ${lx + 40} ${ly + 25}, ${lx} ${ly}`,
    // Leaves -> Icon Site (curve down)
    `C ${lx - 15} ${ly + 20}, ${sx - 15} ${sy - 20}, ${sx} ${sy}`,
    // Icon Site -> Icon Pack (curve right and slightly down)
    `C ${sx + 60} ${sy + 25}, ${px - 60} ${py - 20}, ${px} ${py}`,
    // Icon Pack -> Icon Home (curve right and down)
    `C ${px + 40} ${py + 30}, ${hx - 30} ${hy - 30}, ${hx} ${hy}`,
  ].join(' ');
}

const DASH_LENGTH = 12;
const GAP_LENGTH = 8;

export const AnimatedPathLine: React.FC = () => {
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<SVGSVGElement>(null);
  const [totalLength, setTotalLength] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const pathD = buildPath();

  useEffect(() => {
    if (pathRef.current) {
      setTotalLength(pathRef.current.getTotalLength());
    }
  }, []);

  // IntersectionObserver to trigger draw animation
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else if (entry.boundingClientRect.top > 0) {
            setIsVisible(false);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -30% 0px', threshold: 0 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Disc radius at the end point
  const endPoint = WAYPOINTS.iconHome;
  const endX = (endPoint.x / 100) * 1000;
  const endY = (endPoint.y / 100) * 1000;

  return (
    <svg
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
      style={{ zIndex: 5 }}
    >
      {/* Main animated dashed path */}
      <path
        ref={pathRef}
        d={pathD}
        fill="none"
        stroke="#251F20"
        strokeWidth="3"
        strokeDasharray={totalLength > 0 ? `${DASH_LENGTH} ${GAP_LENGTH}` : 'none'}
        strokeDashoffset={isVisible ? 0 : totalLength}
        strokeLinecap="round"
        style={{
          transition: isVisible 
            ? 'stroke-dashoffset 2s cubic-bezier(0.58, 0, 0.41, 1)' 
            : 'stroke-dashoffset 0.8s cubic-bezier(0.58, 0, 0.41, 1)',
        }}
      />

      {/* Disc at the end */}
      <circle
        cx={endX}
        cy={endY}
        r="5"
        fill="#251F20"
        opacity={isVisible ? 1 : 0}
        style={{
          transition: 'opacity 0.3s ease',
          transitionDelay: isVisible ? '1.8s' : '0s',
        }}
      />
    </svg>
  );
};
