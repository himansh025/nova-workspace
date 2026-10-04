"use client";

import React, { useState, useEffect } from "react";
import {
  Network,
  Activity,
  ShieldCheck,
  Zap,
  Server,
  Database,
  HardDrive,
  Cpu,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  Play,
  Clock,
  Layers,
  CheckSquare,
} from "lucide-react";
import { ServiceNode } from "@/types";
import { useToast } from "@/components/workspace/ToastProvider";
import { MeshSkeleton } from "@/components/workspace/Skeletons";

export default function ArchitecturePage() {
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeEnv, setActiveEnv] = useState<string>("prod");
  const [isProbing, setIsProbing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchTopology = async () => {
    try {
      const res = await fetch(`/api/architecture?env=${activeEnv}`);
      const data = await res.json();
      if (data.nodes) {
        setNodes(data.nodes);
        setStats(data.stats);
        if (data.nodes.length > 0) {
          // Keep selection if it exists in the new env, otherwise select first
          const updated = selectedNode ? data.nodes.find((n: ServiceNode) => n.id === selectedNode.id) : null;
          setSelectedNode(updated || data.nodes[0]);
        } else {
          setSelectedNode(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch service topology", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
    window.addEventListener("nova:realtime_sync", fetchTopology);
    return () => window.removeEventListener("nova:realtime_sync", fetchTopology);
  }, [activeEnv]);

  const handleRunDiagnostic = async () => {
    if (!selectedNode) return;
    setIsProbing(true);
    try {
      const res = await fetch("/api/architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: selectedNode.id, action: "diagnose" }),
      });
      const data = await res.json();
      if (data.node) {
        setSelectedNode(data.node);
        setNodes((prev) =>
          prev.map((n) => (n.id === data.node.id ? data.node : n))
        );
        addToast({
          title: "Diagnostic Probe Complete",
          message: data.message,
          type: "success",
        });
      }
    } catch (err) {
      console.error("Diagnostic probe failed", err);
    } finally {
      setIsProbing(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "edge":
        return <Globe className="w-4 h-4 text-[var(--nova-info)]" />;
      case "database":
        return <Database className="w-4 h-4 text-[var(--nova-success)]" />;
      case "cache":
        return <HardDrive className="w-4 h-4 text-[var(--nova-warning)]" />;
      case "ai":
        return <Sparkles className="w-4 h-4 text-[var(--nova-ai)]" />;
      default:
        return <Cpu className="w-4 h-4 text-[var(--nova-accent)]" />;
    }
  };

  if (loading) {
    return <MeshSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)]">
      {/* Top Header & Stats Bar */}
      <div className="p-4 sm:px-6 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-[var(--nova-text-primary)]">
                System Architecture &amp; Service Mesh
              </h1>
              <span className="text-xs font-mono text-[var(--nova-success-text)] bg-[var(--nova-success-subtle)] border border-[var(--nova-success-border)] px-2 py-0.5 rounded flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--nova-success)] animate-pulse" />
                MESH ACTIVE
              </span>
            </div>
            <p className="text-xs text-[var(--nova-text-secondary)] mt-0.5">
              Interactive latency topology, microservice dependency graphs, and live diagnostic probes
            </p>
          </div>

          {/* Environment Selector */}
          <div className="flex bg-[var(--nova-deep)] border border-[var(--nova-border)] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveEnv("prod")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeEnv === "prod"
                  ? "bg-[var(--nova-accent)] text-white font-medium shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              Production Mesh
            </button>
            <button
              onClick={() => setActiveEnv("canary")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeEnv === "canary"
                  ? "bg-[var(--nova-ai)] text-white font-medium shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              Canary Edge (25%)
            </button>
            <button
              onClick={() => setActiveEnv("staging")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeEnv === "staging"
                  ? "bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] font-medium shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              Staging Cluster
            </button>
          </div>
        </div>

        {/* Global Mesh Metrics KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-md bg-[var(--nova-accent-subtle)] text-[var(--nova-accent)]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--nova-text-muted)] font-mono uppercase">Services Online</div>
              <div className="text-sm font-bold text-[var(--nova-text-primary)]">6 / 6 Healthy</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-md bg-[var(--nova-success-subtle)] text-[var(--nova-success)]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--nova-text-muted)] font-mono uppercase">Avg p99 Latency</div>
              <div className="text-sm font-bold text-[var(--nova-text-primary)]">6.1ms</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-md bg-[var(--nova-ai-subtle)] text-[var(--nova-ai)]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--nova-text-muted)] font-mono uppercase">Mesh Throughput</div>
              <div className="text-sm font-bold text-[var(--nova-text-primary)]">102.4k req/s</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-md bg-[var(--nova-warning-subtle)] text-[var(--nova-warning)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-[var(--nova-text-muted)] font-mono uppercase">Global Availability</div>
              <div className="text-sm font-bold text-[var(--nova-text-primary)]">99.992%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas & Side Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        {/* Visual Topology Canvas */}
        <div className="flex-1 relative overflow-auto p-8 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg tech-grid">
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Edge to Auth */}
            <path
              d="M 280 200 C 400 200, 420 120, 520 120"
              fill="none"
              stroke="rgba(99, 102, 241, 0.35)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Edge to Core */}
            <path
              d="M 280 200 C 400 200, 420 360, 520 360"
              fill="none"
              stroke="rgba(99, 102, 241, 0.45)"
              strokeWidth="2.5"
            />
            {/* Core to AI */}
            <path
              d="M 760 360 C 840 360, 860 120, 940 120"
              fill="none"
              stroke="rgba(139, 92, 246, 0.4)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Core to Cache */}
            <path
              d="M 760 360 C 840 360, 860 280, 940 280"
              fill="none"
              stroke="rgba(245, 158, 11, 0.45)"
              strokeWidth="2"
            />
            {/* Core to DB */}
            <path
              d="M 760 360 C 840 360, 860 480, 940 480"
              fill="none"
              stroke="rgba(16, 185, 129, 0.45)"
              strokeWidth="2.5"
            />
          </svg>

          {/* Service Node Cards in Topological Positions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10 py-6">
            {/* Column 1: Ingress Edge Gateways */}
            <div className="space-y-6 flex flex-col justify-center">
              <div className="text-[10px] font-mono text-[var(--nova-text-muted)] uppercase tracking-wider flex items-center gap-1.5 font-medium">
                <Globe className="w-3 h-3 text-[var(--nova-info)]" />
                <span>Ingress &amp; Edge Runtime</span>
              </div>
              {nodes
                .filter((n) => n.type === "edge")
                .map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? "bg-[var(--nova-accent-subtle)] border-[var(--nova-accent)] shadow-xs scale-[1.02]"
                          : "bg-[var(--nova-surface)] border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:border-[var(--nova-border-strong)] hover:bg-[var(--nova-deep)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[var(--nova-info-subtle)] border border-[var(--nova-info-border)]">
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-[var(--nova-text-primary)]">{node.name}</h3>
                            <span className="text-[10px] font-mono text-[var(--nova-text-muted)]">{node.runtime}</span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-[var(--nova-success)] animate-pulse" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--nova-border-muted)] text-[10px] font-mono">
                        <div className="text-[var(--nova-text-muted)]">p99: <span className="text-[var(--nova-text-primary)] font-bold">{node.p99Latency}</span></div>
                        <div className="text-[var(--nova-text-muted)]">RPS: <span className="text-[var(--nova-success-text)] font-bold">{node.requestsPerSec}</span></div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Column 2: Application Services */}
            <div className="space-y-6 flex flex-col justify-center">
              <div className="text-[10px] font-mono text-[var(--nova-text-muted)] uppercase tracking-wider flex items-center gap-1.5 font-medium">
                <Cpu className="w-3 h-3 text-[var(--nova-accent)]" />
                <span>Microservice Core Layer</span>
              </div>
              {nodes
                .filter((n) => n.type === "service")
                .map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? "bg-[var(--nova-accent-subtle)] border-[var(--nova-accent)] shadow-xs scale-[1.02]"
                          : "bg-[var(--nova-surface)] border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:border-[var(--nova-border-strong)] hover:bg-[var(--nova-deep)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)]">
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-[var(--nova-text-primary)]">{node.name}</h3>
                            <span className="text-[10px] font-mono text-[var(--nova-text-muted)]">{node.runtime}</span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-[var(--nova-success)]" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--nova-border-muted)] text-[10px] font-mono">
                        <div className="text-[var(--nova-text-muted)]">p99: <span className="text-[var(--nova-text-primary)] font-bold">{node.p99Latency}</span></div>
                        <div className="text-[var(--nova-text-muted)]">RPS: <span className="text-[var(--nova-success-text)] font-bold">{node.requestsPerSec}</span></div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Column 3: Storage & Vector Clusters */}
            <div className="space-y-4 flex flex-col justify-center">
              <div className="text-[10px] font-mono text-[var(--nova-text-muted)] uppercase tracking-wider flex items-center gap-1.5 font-medium">
                <Database className="w-3 h-3 text-[var(--nova-success)]" />
                <span>State, Vector &amp; Data Stores</span>
              </div>
              {nodes
                .filter((n) => ["database", "cache", "ai"].includes(n.type))
                .map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? "bg-[var(--nova-accent-subtle)] border-[var(--nova-accent)] shadow-xs scale-[1.02]"
                          : "bg-[var(--nova-surface)] border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:border-[var(--nova-border-strong)] hover:bg-[var(--nova-deep)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)]">
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-[var(--nova-text-primary)]">{node.name}</h3>
                            <span className="text-[10px] font-mono text-[var(--nova-text-muted)]">{node.runtime}</span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-[var(--nova-success)]" />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[var(--nova-text-muted)]">
                        <span>p99: <strong className="text-[var(--nova-text-primary)]">{node.p99Latency}</strong></span>
                        <span className="text-[var(--nova-success-text)]">{node.uptime} Uptime</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Side: Diagnostics & Probe Inspector Drawer */}
        {selectedNode && (
          <div className="w-full lg:w-96 bg-[var(--nova-surface)] border-t lg:border-t-0 lg:border-l border-[var(--nova-border)] flex flex-col shrink-0 overflow-y-auto z-20 text-[var(--nova-text-primary)]">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)]">
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">{selectedNode.name}</h3>
                  <p className="text-[10px] font-mono text-[var(--nova-text-muted)]">{selectedNode.version} • {selectedNode.region}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)] font-medium">
                {selectedNode.status}
              </span>
            </div>

            {/* Diagnostic Metrics */}
            <div className="p-5 space-y-5">
              {/* Telemetry Grid */}
              <div>
                <label className="text-[10px] font-mono text-[var(--nova-text-muted)] uppercase tracking-wider block mb-2 font-medium">
                  Live Telemetry Health
                </label>
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)]">
                    <span className="text-[10px] text-[var(--nova-text-muted)] block">p99 Latency</span>
                    <span className="text-sm font-bold text-[var(--nova-text-primary)]">{selectedNode.p99Latency}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)]">
                    <span className="text-[10px] text-[var(--nova-text-muted)] block">Throughput</span>
                    <span className="text-sm font-bold text-[var(--nova-success-text)]">{selectedNode.requestsPerSec}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)]">
                    <span className="text-[10px] text-[var(--nova-text-muted)] block">Error Rate</span>
                    <span className="text-sm font-bold text-[var(--nova-text-secondary)]">{selectedNode.errorRate}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)]">
                    <span className="text-[10px] text-[var(--nova-text-muted)] block">TCP Connections</span>
                    <span className="text-sm font-bold text-[var(--nova-accent)]">{selectedNode.activeConnections.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Resource Utilization */}
              <div>
                <label className="text-[10px] font-mono text-[var(--nova-text-muted)] uppercase tracking-wider block mb-2 font-medium">
                  Compute Utilization
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-[var(--nova-text-muted)]">CPU Allocation</span>
                      <span className="text-[var(--nova-text-primary)] font-medium">{selectedNode.cpuUsage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--nova-accent)] rounded-full"
                        style={{ width: `${selectedNode.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-[var(--nova-text-muted)]">Memory Working Set</span>
                      <span className="text-[var(--nova-text-primary)] font-medium">{selectedNode.memoryUsage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--nova-success)] rounded-full"
                        style={{ width: `${selectedNode.memoryUsage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnostic Probe Action */}
              <div className="pt-2">
                <button
                  onClick={handleRunDiagnostic}
                  disabled={isProbing}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-xs font-medium transition-colors duration-150 shadow-xs disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isProbing ? "animate-spin" : ""}`} />
                  <span>{isProbing ? "Sending Probes..." : "Run Diagnostic Health Probes"}</span>
                </button>
              </div>

              {/* Linked Backlog Issues */}
              {selectedNode.linkedTasks.length > 0 && (
                <div className="pt-2">
                  <label className="text-[10px] font-mono text-[var(--nova-text-muted)] uppercase tracking-wider block mb-2 font-medium">
                    Linked Backlog Issues
                  </label>
                  <div className="space-y-2">
                    {selectedNode.linkedTasks.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)] text-xs text-[var(--nova-text-primary)] flex items-start gap-2"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-[var(--nova-accent)] shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
