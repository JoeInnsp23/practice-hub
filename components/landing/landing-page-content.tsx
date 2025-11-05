"use client";

import {
  Award,
  Building2,
  FileText,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HUB_COLORS } from "@/lib/utils/hub-colors";
import {
  AnimatedCounter,
  LargeBentoCard,
  MediumBentoCard,
  SmallBentoCard,
} from "./bento-cards";
import { BlogFeed } from "./blog-feed";
import {
  CelebrationConfetti,
  getTimeOfDayGreeting,
  IconConstellation,
  useParallax,
} from "./landing-animations";
import { ThemeToggle } from "./theme-toggle";

/**
 * Landing page content for internal staff portal - Full custom redesign
 *
 * Features:
 * - Playful Mission Control theme
 * - Custom animated bento grid with SVG backgrounds
 * - Live statistics from tRPC
 * - Interactive easter eggs and micro-interactions
 * - Energetic animations and surprising moments
 */
export function LandingPageContent() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set(["hero"]),
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [stats, setStats] = useState({
    proposalsSentThisWeek: 0,
    newClientsThisWeek: 0,
  });
  const [statsLoaded, setStatsLoaded] = useState(false);

  const isoDateStamp = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [deploymentDay, deploymentMonth, deploymentYear] =
    isoDateStamp.split("-");
  const deploymentDate = `${deploymentDay}/${deploymentMonth}/${deploymentYear}`;

  // Refs for scroll animation sections
  const featuresRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  // Parallax effect for features section
  const { elementRef: featuresParallaxRef, offset: featuresOffset } =
    useParallax(0.3);

  // Fetch live stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/trpc/landing.getWeeklyStats", {
          method: "GET",
        });
        if (response.ok) {
          const data = await response.json();
          const resultData = data.result?.data ?? {
            proposalsSentThisWeek: 0,
            newClientsThisWeek: 0,
          };
          // Ensure values are numbers, default to 0 if invalid
          setStats({
            proposalsSentThisWeek:
              Number(resultData.proposalsSentThisWeek) || 0,
            newClientsThisWeek: Number(resultData.newClientsThisWeek) || 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setStatsLoaded(true);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      root: null,
      rootMargin: "-10% 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id) {
          setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          // Trigger confetti when stats section comes into view
          if (entry.target.id === "stats" && statsLoaded) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = [
      featuresRef.current,
      statsRef.current,
      footerRef.current,
    ].filter(Boolean) as HTMLElement[];
    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, [statsLoaded]);

  const greeting = getTimeOfDayGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:bg-[radial-gradient(circle_at_top,_rgba(3,18,21,1)_0%,_rgba(2,12,15,1)_55%,_rgba(1,6,9,1)_100%)] text-foreground transition-colors duration-300">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Hero Section - Mission Control */}
      <section
        id="hero"
        className="container mx-auto px-4 py-8 md:py-12 lg:py-16 relative overflow-hidden"
        aria-label="Welcome section"
      >
        {/* Icon constellation background */}
        <IconConstellation
          icons={[Rocket, Zap, Target, Award, Star, Sparkles]}
          colors={[
            "#2dd4bf",
            "#f59e0b",
            "#94a3b8",
            "#3b82f6",
            "#22d3ee",
            "#a855f7",
          ]}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in">
          {/* Time-based greeting */}
          <p className="text-lg md:text-xl text-muted-foreground mb-2 font-medium animate-lift-in">
            {greeting}, team! 👋
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 animate-lift-in leading-tight">
            Your Mission Control
            <br />
            <span
              className="relative inline-block"
              style={{
                background:
                  "linear-gradient(135deg, rgba(45,212,191,0.95), rgba(56,189,248,0.85), rgba(22,163,174,0.9))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              for Modern Accountancy
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-lift-in">
            Everything you need to serve clients, manage proposals, collaborate
            with the team, and actually enjoy doing it.
          </p>

          {/* Single powerful CTA */}
          <Button
            asChild
            size="lg"
            className="button-feedback text-lg px-10 py-4 h-auto rounded-full animate-lift-in"
            style={{ animationDelay: "0.3s" }}
          >
            <Link href="/sign-in">
              Launch Dashboard
              <Rocket className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section - Custom Bento Grid */}
      <section
        id="features"
        ref={featuresRef}
        className="container mx-auto px-4 py-8 md:py-12"
        aria-label="Hub features section"
      >
        <div
          className="max-w-7xl mx-auto rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(13,40,44,0.35)_0%,_rgba(9,25,29,0.2)_60%,_rgba(5,18,21,0.1)_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(13,40,44,0.35)_0%,_rgba(9,25,29,0.2)_60%,_rgba(5,18,21,0.1)_100%)] bg-[radial-gradient(circle_at_top,_rgba(241,245,249,0.6)_0%,_rgba(226,232,240,0.4)_60%,_rgba(248,250,252,0.2)_100%)] p-6 md:p-10 transition-colors duration-300"
          ref={featuresParallaxRef}
        >
          {/* Section header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              Your Hubs, Your Command
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Each module is a powerhouse. Together, they're unstoppable.
            </p>
          </div>

          {/* Custom Bento Grid Layout - 2e (2 small + 1 large + medium + small) */}
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
            style={{
              transform: `translateY(${featuresOffset}px)`,
              transition: "transform 0.1s ease-out",
            }}
          >
            {/* Large - Client Hub */}
            <LargeBentoCard
              title="Client Hub"
              description="Your central hub for managing client relationships, communications, and organizational data with precision."
              color={HUB_COLORS["client-hub"]}
              icon={Building2}
              size="large"
              onClick={() => {
                window.location.href = "/sign-in";
              }}
              ariaLabel="Launch Client Hub"
              animationDelay={
                visibleSections.has("features") ? "0.1s" : undefined
              }
              visible={visibleSections.has("features")}
              customContent={
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground font-medium">
                    ✨ What you'll love:
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Client magic in one place</li>
                    <li>Track every interaction</li>
                    <li>Never miss a detail</li>
                  </ul>
                </div>
              }
            />

            {/* Small - Admin Hub */}
            <SmallBentoCard
              title="Admin Hub"
              description="Settings, user management, and firm operations at your fingertips."
              color={HUB_COLORS.admin}
              icon={Shield}
              size="small"
              onClick={() => {
                window.location.href = "/sign-in";
              }}
              ariaLabel="Launch Admin Hub"
              animationDelay={
                visibleSections.has("features") ? "0.2s" : undefined
              }
              visible={visibleSections.has("features")}
            />

            {/* Small - Practice Hub */}
            <SmallBentoCard
              title="Practice Hub"
              description="Your command center for proposals, tasks, and team collaboration."
              color={HUB_COLORS["practice-hub"]}
              icon={Sparkles}
              size="small"
              onClick={() => {
                window.location.href = "/sign-in";
              }}
              ariaLabel="Launch Practice Hub"
              animationDelay={
                visibleSections.has("features") ? "0.3s" : undefined
              }
              visible={visibleSections.has("features")}
            />

            {/* Medium - Proposal Hub (full width) */}
            <MediumBentoCard
              title="Proposal Hub"
              description="Create stunning proposals, track progress, sign deals faster. Your revenue powerhouse."
              color={HUB_COLORS["proposal-hub"]}
              icon={FileText}
              size="medium"
              onClick={() => {
                window.location.href = "/sign-in";
              }}
              ariaLabel="Launch Proposal Hub"
              animationDelay={
                visibleSections.has("features") ? "0.4s" : undefined
              }
              visible={visibleSections.has("features")}
              customContent={
                <div
                  className="flex items-center gap-3 text-sm font-semibold"
                  style={{ color: HUB_COLORS["proposal-hub"] }}
                >
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  <span>Revenue engine for your firm</span>
                </div>
              }
            />

            {/* Small bonus - Quick stats teaser */}
            <SmallBentoCard
              title="Real-time Insights"
              description="See what's happening this week at a glance with live stats."
              color={HUB_COLORS["employee-hub"]}
              icon={TrendingUp}
              size="small"
              onClick={() => {
                const statsSection = document.getElementById("stats");
                statsSection?.scrollIntoView({ behavior: "smooth" });
              }}
              ariaLabel="View this week's stats"
              animationDelay={
                visibleSections.has("features") ? "0.5s" : undefined
              }
              visible={visibleSections.has("features")}
            />
          </div>
        </div>
      </section>

      {/* Team Wins Section - Live Stats */}
      <section
        id="stats"
        ref={statsRef}
        className="container mx-auto px-4 py-8 md:py-12 relative overflow-hidden"
        aria-label="This week's achievements"
      >
        {showConfetti && <CelebrationConfetti />}

        <div className="max-w-5xl mx-auto rounded-3xl bg-[radial-gradient(circle_at_top_right,_rgba(13,66,74,0.32)_0%,_rgba(9,36,41,0.22)_60%,_rgba(5,18,21,0.18)_100%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(13,66,74,0.32)_0%,_rgba(9,36,41,0.22)_60%,_rgba(5,18,21,0.18)_100%)] bg-[radial-gradient(circle_at_top_right,_rgba(241,245,249,0.7)_0%,_rgba(226,232,240,0.5)_60%,_rgba(248,250,252,0.3)_100%)] p-6 md:p-10 transition-colors duration-300">
          {/* Header */}
          <div className="text-center mb-10">
            <Trophy
              className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 animate-gentle-bounce"
              style={{ color: HUB_COLORS.admin, animationDelay: "0s" }}
              aria-hidden="true"
            />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
              This Week's Wins 🎉
            </h2>
            <p className="text-xl text-muted-foreground">
              Real-time achievements from your team
            </p>
          </div>

          {/* Live Stats Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Proposals Sent */}
            <div
              className={`glass-card rounded-3xl p-8 md:p-10 text-center relative overflow-hidden group ${
                visibleSections.has("stats") ? "animate-lift-in" : "opacity-0"
              }`}
              style={{
                animationDelay: visibleSections.has("stats")
                  ? "0.1s"
                  : undefined,
              }}
            >
              <div
                className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity"
                style={{ backgroundColor: HUB_COLORS["proposal-hub"] }}
              />
              <div className="relative z-10">
                <div
                  className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${HUB_COLORS["proposal-hub"]}29, ${HUB_COLORS["proposal-hub"]}14)`,
                    color: HUB_COLORS["proposal-hub"],
                  }}
                >
                  <FileText
                    className="h-8 w-8 md:h-10 md:w-10"
                    aria-hidden="true"
                  />
                </div>
                <AnimatedCounter
                  value={stats.proposalsSentThisWeek}
                  suffix="Proposals"
                />
                <p className="text-muted-foreground mt-4">Sent this week 🚀</p>
              </div>
            </div>

            {/* New Clients */}
            <div
              className={`glass-card rounded-3xl p-8 md:p-10 text-center relative overflow-hidden group ${
                visibleSections.has("stats") ? "animate-lift-in" : "opacity-0"
              }`}
              style={{
                animationDelay: visibleSections.has("stats")
                  ? "0.2s"
                  : undefined,
              }}
            >
              <div
                className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity"
                style={{ backgroundColor: HUB_COLORS["client-hub"] }}
              />
              <div className="relative z-10">
                <div
                  className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${HUB_COLORS["client-hub"]}29, ${HUB_COLORS["client-hub"]}14)`,
                    color: HUB_COLORS["client-hub"],
                  }}
                >
                  <Users
                    className="h-8 w-8 md:h-10 md:w-10"
                    aria-hidden="true"
                  />
                </div>
                <AnimatedCounter
                  value={stats.newClientsThisWeek}
                  suffix="New Clients"
                />
                <p className="text-muted-foreground mt-4">Added this week 🎯</p>
              </div>
            </div>
          </div>

          {/* Motivational message */}
          <div
            className={`text-center py-8 px-6 rounded-2xl border-2 border-dashed border-muted-foreground/30 ${
              visibleSections.has("stats") ? "animate-lift-in" : "opacity-0"
            }`}
            style={{
              animationDelay: visibleSections.has("stats") ? "0.3s" : undefined,
            }}
          >
            <p className="text-lg font-semibold mb-2">Keep crushing it! 💪</p>
            <p className="text-muted-foreground">
              Your team is doing incredible work. Every proposal, every client,
              every moment counts.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Feed */}
      <section className="py-0">
        <BlogFeed />
      </section>

      {/* Footer - Playful */}
      <footer
        ref={footerRef}
        className="border-t bg-[rgba(4,18,21,0.85)] dark:bg-[rgba(4,18,21,0.85)] bg-slate-100/80 py-8 mt-8 transition-colors duration-300"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Help */}
            <p className="text-sm text-muted-foreground">
              Need help? Drop a line in{" "}
              <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
                #tech-support
              </span>
            </p>

            {/* Easter egg - click counter */}
            <p className="text-xs text-muted-foreground opacity-75">
              Built with ❤️ by your team • Deployed {deploymentDate}
            </p>

            {/* Copyright */}
            <p className="text-xs text-muted-foreground pt-4 border-t">
              &copy; {deploymentYear} Practice Hub · Internal Portal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
