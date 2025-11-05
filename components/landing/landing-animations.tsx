"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Icon constellation animation component
 * Creates a floating constellation of icons with gentle motion
 */
interface IconConstellationProps {
  icons: LucideIcon[];
  colors: string[];
}

export function IconConstellation({ icons, colors }: IconConstellationProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
      {icons.map((Icon, index) => {
        const position = getConstellationPosition(index, icons.length);
        const color = colors[index % colors.length];

        return (
          <div
            key={`constellation-${index}-${color}`}
            className="absolute animate-float"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              animationDelay: `${index * 0.2}s`,
              animationDuration: `${3 + (index % 3)}s`,
            }}
          >
            <Icon
              className="h-8 w-8 md:h-12 md:w-12"
              style={{ color }}
              aria-hidden="true"
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Calculate position for constellation icons in a distributed pattern
 */
function getConstellationPosition(index: number, _total: number) {
  const positions = [
    { x: 10, y: 15 },
    { x: 85, y: 20 },
    { x: 20, y: 75 },
    { x: 75, y: 70 },
    { x: 50, y: 30 },
    { x: 30, y: 50 },
  ];
  return positions[index % positions.length];
}

/**
 * Parallax effect hook for subtle depth on scroll
 */
export function useParallax(intensity = 0.5) {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const scrollPercent =
        1 - (rect.top + rect.height / 2) / window.innerHeight;
      setOffset(scrollPercent * intensity * 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, [intensity]);

  return { elementRef, offset };
}

/**
 * Time of day greeting
 */
export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Working late";
}

/**
 * Celebration confetti component (simple, CSS-based)
 */
export function CelebrationConfetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(15)].map((_, i) => (
        <div
          key={`confetti-${i}-${Math.random()}`}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10%",
            backgroundColor: [
              "#3b82f6",
              "#f97316",
              "#10b981",
              "#ec4899",
              "#8b5cf6",
            ][i % 5],
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}
