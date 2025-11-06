"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CardInteractive } from "@/components/ui/card-interactive";

/**
 * Hook to detect current theme
 */
function useTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement;
      const isDarkMode =
        html.getAttribute("data-theme") === "dark" ||
        (!html.getAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDark(isDarkMode);
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    // Also listen to media query changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkTheme);
    };
  }, []);

  return isDark;
}

interface BentoCardProps {
  title: string;
  description: string;
  color: string;
  icon: LucideIcon;
  size: "small" | "medium" | "large";
  onClick: () => void;
  ariaLabel: string;
  animationDelay?: string;
  visible?: boolean;
  customContent?: React.ReactNode;
}

/**
 * Utility: create gradient ids that are stable per color.
 */
function getGradientId(color: string, suffix: string) {
  return `${suffix}-${color.replace(/[^a-zA-Z0-9]/g, "")}`;
}

/**
 * Custom animated SVG background for bento cards
 * 3D twisting wave with subtle parallax highlights
 * Theme-aware opacity and colors
 * Waves span full width and height for complete coverage
 */
function AnimatedBackground({ color }: { color: string }) {
  const isDark = useTheme();
  const gradientId = useMemo(
    () => getGradientId(color, "wave-gradient"),
    [color],
  );
  const highlightId = useMemo(
    () => getGradientId(color, "wave-highlight"),
    [color],
  );
  const meshId = useMemo(() => getGradientId(color, "wave-mesh"), [color]);
  const wave3Id = useMemo(() => getGradientId(color, "wave-3"), [color]);

  // Adjust opacity based on theme - light mode needs much more visibility
  const baseOpacity = isDark ? 0.2 : 0.35;
  const hoverOpacity = isDark ? 0.3 : 0.5;

  // Adjust stop opacities for light mode - significantly more visible
  const gradientStop1 = isDark ? 0.35 : 0.45;
  const gradientStop2 = isDark ? 0.18 : 0.28;
  const gradientStop3 = isDark ? 0.05 : 0.12;
  const highlightStop1 = isDark ? 0.25 : 0.35;
  const highlightStop2 = isDark ? 0.1 : 0.2;
  const wave3Stop1 = isDark ? 0.2 : 0.3;
  const wave3Stop2 = isDark ? 0.08 : 0.15;
  const meshOpacity = isDark ? 0.4 : 0.5;

  return (
    <svg
      className="absolute inset-0 w-full h-full transition-opacity duration-500"
      style={{
        opacity: baseOpacity,
      }}
      viewBox="0 0 400 300"
      preserveAspectRatio="none"
      aria-label="Card background pattern"
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = hoverOpacity.toString();
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = baseOpacity.toString();
      }}
    >
      <title>Card background pattern</title>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={gradientStop1} />
          <stop offset="50%" stopColor={color} stopOpacity={gradientStop2} />
          <stop offset="100%" stopColor={color} stopOpacity={gradientStop3} />
        </linearGradient>
        <linearGradient id={highlightId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={highlightStop1} />
          <stop offset="50%" stopColor={color} stopOpacity={highlightStop2} />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={wave3Id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={wave3Stop1} />
          <stop offset="50%" stopColor={color} stopOpacity={wave3Stop2} />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id={meshId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor={isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)"}
          />
          <stop
            offset="50%"
            stopColor={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
          />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Primary twisting wave - spans full width and height */}
      <path
        d="M 0 300 L 0 180 C 80 80, 160 240, 240 140 C 320 40, 400 200, 400 120 L 400 300 Z"
        fill={`url(#${gradientId})`}
      />

      {/* Secondary wave for depth - spans full width */}
      <path
        d="M 0 300 L 0 220 C 100 100, 200 260, 300 160 C 380 70, 400 230, 400 180 L 400 300 Z"
        fill={`url(#${highlightId})`}
      />

      {/* Third wave layer - adds more depth */}
      <path
        d="M 0 300 L 0 260 C 120 140, 240 280, 360 200 L 400 300 Z"
        fill={`url(#${wave3Id})`}
      />

      {/* Highlight mesh lines - full width */}
      <path
        d="M 0 100 C 100 40, 200 100, 300 60 C 350 40, 400 80, 400 100"
        stroke={`url(#${meshId})`}
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
        opacity={meshOpacity}
      />
      <path
        d="M 0 200 C 80 160, 160 200, 240 180 C 320 160, 400 200, 400 220"
        stroke={`url(#${meshId})`}
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        opacity={meshOpacity * 0.7}
      />
    </svg>
  );
}

/**
 * Animated counter component for stat displays
 */
function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  // Ensure value is a valid number, default to 0
  const safeValue = Number.isFinite(value) ? value : 0;
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1500;
          const steps = 30;
          const stepValue = safeValue / steps;
          let current = 0;

          const interval = setInterval(() => {
            current += stepValue;
            if (current >= safeValue) {
              setDisplayValue(safeValue);
              clearInterval(interval);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, duration / steps);

          return () => clearInterval(interval);
        }
      },
      { threshold: 0.5 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [safeValue, hasAnimated]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-bold tabular-nums">
      {displayValue}
      <span className="text-lg md:text-2xl font-semibold ml-1">{suffix}</span>
    </div>
  );
}

/**
 * Large bento card with full feature display
 */
export function LargeBentoCard({
  title,
  description,
  color,
  icon: Icon,
  onClick,
  ariaLabel,
  animationDelay,
  visible,
  customContent,
}: BentoCardProps) {
  const isDark = useTheme();
  const iconBackground = useMemo(() => {
    // Lighter opacity for light mode
    const opacity1 = isDark ? "33" : "20";
    const opacity2 = isDark ? "14" : "0a";
    const shadowOpacity = isDark ? "25" : "15";
    return {
      background: `linear-gradient(135deg, ${color}${opacity1}, ${color}${opacity2})`,
      boxShadow: `0 10px 30px ${color}${shadowOpacity}`,
    };
  }, [color, isDark]);

  return (
    <CardInteractive
      moduleColor={color}
      onClick={onClick}
      ariaLabel={ariaLabel}
      className={`md:col-span-2 md:row-span-2 rounded-3xl p-8 md:p-10 relative overflow-hidden group ${
        visible ? "animate-lift-in" : "opacity-0"
      }`}
      style={{ animationDelay }}
    >
      <AnimatedBackground color={color} />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header with icon */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="p-4 rounded-2xl transition-all duration-300 group-hover:scale-110"
            style={iconBackground}
          >
            <Icon
              className="h-8 w-8"
              style={{ color, stroke: color }}
              aria-hidden="true"
            />
          </div>
          <h3 className="text-3xl md:text-4xl font-bold">{title}</h3>
        </div>

        {/* Description */}
        <p className="text-base md:text-lg text-muted-foreground mb-8 flex-1">
          {description}
        </p>

        {/* Custom content (stats, etc) */}
        {customContent && <div className="mb-6">{customContent}</div>}

        {/* CTA hint */}
        <div
          className="flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:translate-x-1"
          style={{ color }}
        >
          <span>Launch hub</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </CardInteractive>
  );
}

/**
 * Medium bento card with highlighted feature
 */
export function MediumBentoCard({
  title,
  description,
  color,
  icon: Icon,
  onClick,
  ariaLabel,
  animationDelay,
  visible,
  customContent,
}: BentoCardProps) {
  const isDark = useTheme();
  const iconBackground = useMemo(() => {
    // Lighter opacity for light mode
    const opacity1 = isDark ? "2e" : "1a";
    const opacity2 = isDark ? "10" : "08";
    const shadowOpacity = isDark ? "20" : "12";
    return {
      background: `linear-gradient(135deg, ${color}${opacity1}, ${color}${opacity2})`,
      boxShadow: `0 10px 25px ${color}${shadowOpacity}`,
      color,
    };
  }, [color, isDark]);

  return (
    <CardInteractive
      moduleColor={color}
      onClick={onClick}
      ariaLabel={ariaLabel}
      className={`md:col-span-4 rounded-2xl p-6 md:p-8 relative overflow-hidden group ${
        visible ? "animate-lift-in" : "opacity-0"
      }`}
      style={{ animationDelay }}
    >
      <AnimatedBackground color={color} />

      <div className="relative z-10 flex items-center gap-6 md:gap-8">
        {/* Icon section */}
        <div
          className="flex-shrink-0 p-4 rounded-2xl transition-all duration-300 group-hover:scale-110"
          style={iconBackground}
        >
          <Icon
            className="h-7 w-7 md:h-8 md:w-8"
            style={{ color, stroke: color }}
            aria-hidden="true"
          />
        </div>

        {/* Content section */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-bold mb-2">{title}</h3>
          <p className="text-sm md:text-base text-muted-foreground mb-3">
            {description}
          </p>
          {customContent && <div className="mt-4">{customContent}</div>}
        </div>

        {/* CTA hint */}
        <div
          className="hidden md:flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:translate-x-1 flex-shrink-0"
          style={{ color }}
        >
          <span>Explore</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    </CardInteractive>
  );
}

/**
 * Small bento card with compact display
 */
export function SmallBentoCard({
  title,
  description,
  color,
  icon: Icon,
  onClick,
  ariaLabel,
  animationDelay,
  visible,
}: BentoCardProps) {
  const isDark = useTheme();
  const iconBackground = useMemo(() => {
    // Lighter opacity for light mode
    const opacity1 = isDark ? "29" : "18";
    const opacity2 = isDark ? "0f" : "08";
    const shadowOpacity = isDark ? "1a" : "0f";
    return {
      background: `linear-gradient(135deg, ${color}${opacity1}, ${color}${opacity2})`,
      boxShadow: `0 8px 20px ${color}${shadowOpacity}`,
      color,
    };
  }, [color, isDark]);

  return (
    <CardInteractive
      moduleColor={color}
      onClick={onClick}
      ariaLabel={ariaLabel}
      className={`md:col-span-2 rounded-2xl p-6 relative overflow-hidden group ${
        visible ? "animate-lift-in" : "opacity-0"
      }`}
      style={{ animationDelay }}
    >
      <AnimatedBackground color={color} />

      <div className="relative z-10">
        {/* Icon */}
        <div
          className="w-12 h-12 mb-3 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={iconBackground}
        >
          <Icon
            className="h-6 w-6"
            style={{ color, stroke: color }}
            aria-hidden="true"
          />
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </CardInteractive>
  );
}

export { AnimatedCounter };
