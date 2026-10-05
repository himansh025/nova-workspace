"use client";

import React, { useState, useEffect } from "react";
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  GitCommit,
  ArrowRight,
  Sliders,
  Check,
  Server,
  Activity
} from "lucide-react";
import { Release, PreflightCheck } from "@/types";
import { ReleasesSkeleton } from "@/components/workspace/Skeletons";

export default function ReleasesPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [canaryPercentage, setCanaryPercentage] = useState<number>(25);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRelease = async () => {
    try {
      const res = await fetch("/api/releases");
      const data = await res.json();
      if (data.releases && data.releases.length > 0) {
        setRelease(data.releases[0]);
        setCanaryPercentage(data.releases[0].canaryPercentage);
      }
    } catch (err) {
      console.error("Error loading release", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelease();
  }, []);

  const handleUpdateCanary = async (percent: number) => {
    setCanaryPercentage(percent);
    try {
      await fetch("/api/releases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId: release?.id || "rel-1",
          canaryPercentage: percent
        })
      });
      fetchRelease();
    } catch (err) {
      console.error("Error updating canary", err);
    }
  };

  const handleRunChecks = async () => {
    setIsRunningChecks(true);
    try {
      const res = await fetch("/api/releases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId: release?.id || "rel-1",
          action: "run_checks"
        })
      });
      const data = await res.json();
      if (data.release) setRelease(data.release);
    } catch (err) {
      console.error("Error running checks", err);
    } finally {
      setIsRunningChecks(false);
    }
  };

  const handlePromoteToProduction = async () => {
    if (!confirm("Promote v2.4.0-production to 100% General Availability?")) return;
    setIsPromoting(true);
    try {
      const res = await fetch("/api/releases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          releaseId: release?.id || "rel-1",
          status: "released",
          canaryPercentage: 100
        })
      });
      const data = await res.json();
      if (data.release) {
        setRelease(data.release);
        setCanaryPercentage(100);
      }
    } catch (err) {
      console.error("Error promoting release", err);
    } finally {
      setIsPromoting(false);
    }
  };

  if (loading) {
    return <ReleasesSkeleton />;
  }

  return (
    <div className="min-h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)] px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] p-4 rounded-lg shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--nova-text-primary)]">
              Production Release Console
            </h1>
            <span className="text-xs font-mono text-[var(--nova-success-text)] bg-[var(--nova-success-subtle)] border border-[var(--nova-success-border)] px-2 py-0.5 rounded font-medium">
              SHIP ENGINE ACTIVE
            </span>
          </div>
          <p className="text-xs text-[var(--nova-text-secondary)] mt-0.5">
            Pre-flight verification, automated checks, and progressive canary traffic shaping
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunChecks}
            disabled={isRunningChecks}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded text-xs font-medium transition-colors duration-150"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningChecks ? "animate-spin text-[var(--nova-accent)]" : ""}`} />
            <span>{isRunningChecks ? "Running Checks..." : "Re-run Pre-flight"}</span>
          </button>

          <button
            onClick={handlePromoteToProduction}
            disabled={isPromoting || release?.status === "released"}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded text-xs font-medium shadow-xs transition-colors duration-150 disabled:opacity-50"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>{release?.status === "released" ? "Released at 100%" : "Ship to 100% Prod"}</span>
          </button>
        </div>
      </div>

      {/* Main Release Status Card & Canary Pipeline */}
      <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 sm:p-6 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--nova-success-subtle)] border border-[var(--nova-success-border)] flex items-center justify-center text-[var(--nova-success-text)]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--nova-text-primary)] font-mono">
                  {release?.version || "v2.4.0-production"}
                </h2>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-medium ${
                    release?.status === "released"
                      ? "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]"
                      : "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]"
                  }`}
                >
                  {release?.status === "released" ? "Full Production" : "Active Canary"}
                </span>
              </div>
              <p className="text-xs text-[var(--nova-text-secondary)] mt-0.5">
                Target: {release?.version || "Active Canary"} • Global Edge Mesh Deployment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[var(--nova-text-muted)] block text-[10px]">VERIFIED CHECKS</span>
              <span className="text-[var(--nova-success-text)] font-bold text-sm">
                {release?.checksPassed || 5} / {release?.totalChecks || 5} Passed
              </span>
            </div>
            <div className="h-8 w-px bg-[var(--nova-border)]" />
            <div>
              <span className="text-[var(--nova-text-muted)] block text-[10px]">LIVE CANARY SHARE</span>
              <span className="text-[var(--nova-text-primary)] font-bold text-sm">
                {canaryPercentage}% Edge Traffic
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Canary Traffic Pipeline / Slider */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--nova-accent)]" />
              <span className="font-medium text-[var(--nova-text-primary)]">Canary Traffic Split Controller</span>
            </div>
            <span className="font-mono text-[var(--nova-success-text)] font-bold text-sm">
              {canaryPercentage}%
            </span>
          </div>

          <div className="relative">
            <input
              type="range"
              min="1"
              max="100"
              value={canaryPercentage}
              onChange={(e) => handleUpdateCanary(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[var(--nova-deep)] rounded-lg appearance-none cursor-pointer accent-[var(--nova-accent)] border border-[var(--nova-border-muted)]"
            />
            {/* Visual Canary Progress Fill Track */}
            <div
              className="absolute left-0 top-0 h-2 bg-[var(--nova-success)] rounded-lg pointer-events-none transition-all duration-150"
              style={{ width: `${canaryPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-[var(--nova-text-muted)]">
            <span>1% (Internal)</span>
            <span>10% (Early Adopters)</span>
            <span>25% (Regional Canary)</span>
            <span>50% (Balanced)</span>
            <span>100% (Full GA)</span>
          </div>
        </div>
      </div>

      {/* Pre-flight Checks List */}
      <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">
              Pre-Flight Automated Verification Suite
            </h3>
            <p className="text-xs text-[var(--nova-text-secondary)]">Critical gates enforced prior to edge promotion</p>
          </div>
          <span className="text-xs font-mono text-[var(--nova-success-text)] flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Policy: Zero Failed Checks Allowed</span>
          </span>
        </div>

        <div className="divide-y divide-[var(--nova-border-muted)] border border-[var(--nova-border)] rounded-lg overflow-hidden bg-[var(--nova-deep)]">
          {release?.checks.map((check) => (
            <div key={check.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[var(--nova-success)] shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-[var(--nova-text-primary)] flex items-center gap-2">
                    <span>{check.name}</span>
                    <span className="text-[10px] font-mono text-[var(--nova-text-muted)] uppercase bg-[var(--nova-surface)] border border-[var(--nova-border)] px-1.5 py-0.2 rounded">
                      {check.category}
                    </span>
                  </div>
                  <p className="text-[var(--nova-text-secondary)] text-[11px] mt-0.5">{check.details}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto font-mono text-[11px]">
                <span className="text-[var(--nova-text-muted)]">{check.duration}</span>
                <span className="px-2 py-0.5 rounded bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)] uppercase text-[10px] font-medium">
                  {check.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Automated Changelog Preview */}
      <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">
              Automated Release Changelog
            </h3>
            <p className="text-xs text-[var(--nova-text-secondary)]">
              Synthesized from closed engineering issues &amp; verified PRs
            </p>
          </div>
          <button className="text-xs font-mono text-[var(--nova-accent)] hover:underline flex items-center gap-1 font-medium">
            <span>Export Release Notes</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)] space-y-2">
          {release?.changelog.map((log, index) => (
            <div key={index} className="flex items-start gap-2.5 text-xs text-[var(--nova-text-primary)]">
              <GitCommit className="w-3.5 h-3.5 text-[var(--nova-info)] shrink-0 mt-0.5" />
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
