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

export default function ArchitecturePage() {
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ServiceNode | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activeEnv, setActiveEnv] = useState<string>("prod");
  const [isProbing, setIsProbing] = useState(false);
  const { addToast } = useToast();

  const fetchTopology = async () => {
    try {
      const res = await fetch("/api/architecture");
      const data = await res.json();
      if (data.nodes) {
        setNodes(data.nodes);
        setStats(data.stats);
        if (!selectedNode && data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        } else if (selectedNode) {
          const updated = data.nodes.find((n: ServiceNode) => n.id === selectedNode.id);
          if (updated) setSelectedNode(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch service topology", err);
    }
  };

  useEffect(() => {
    fetchTopology();
    window.addEventListener("nova:realtime_sync", fetchTopology);
    return () => window.removeEventListener("nova:realtime_sync", fetchTopology);
  }, []);

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
        return <Globe className="w-4 h-4 text-sky-400" />;
      case "database":
        return <Database className="w-4 h-4 text-emerald-400" />;
      case "cache":
        return <HardDrive className="w-4 h-4 text-amber-400" />;
      case "ai":
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Cpu className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0B0D] text-neutral-200">
      {/* Top Header & Stats Bar */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-white">System Architecture & Service Mesh</h1>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                MESH ACTIVE
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Interactive latency topology, microservice dependency graphs, and live diagnostic probes
            </p>
          </div>

          {/* Environment Selector */}
          <div className="flex bg-[#161820] border border-white/10 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveEnv("prod")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeEnv === "prod" ? "bg-indigo-600 text-white font-medium shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              Production Mesh
            </button>
            <button
              onClick={() => setActiveEnv("canary")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeEnv === "canary" ? "bg-purple-600 text-white font-medium shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              Canary Edge (25%)
            </button>
            <button
              onClick={() => setActiveEnv("staging")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeEnv === "staging" ? "bg-white/10 text-white font-medium shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              Staging Cluster
            </button>
          </div>
        </div>

        {/* Global Mesh Metrics KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-[#14161D] border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase">Services Online</div>
              <div className="text-sm font-bold text-white">6 / 6 Healthy</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#14161D] border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase">Avg p99 Latency</div>
              <div className="text-sm font-bold text-white">6.1ms</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#14161D] border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-500/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase">Mesh Throughput</div>
              <div className="text-sm font-bold text-white">102.4k req/s</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#14161D] border border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 font-mono uppercase">Global Availability</div>
              <div className="text-sm font-bold text-white">99.992%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas & Side Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        {/* Visual Topology Canvas */}
        <div className="flex-1 relative overflow-auto p-8 bg-[radial-gradient(#1A1D26_1px,transparent_1px)] [background-size:24px_24px]">
          {/* SVG Connection Lines with Animated Signals */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5E43F3" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Edge to Auth */}
            <path
              d="M 280 200 C 400 200, 420 120, 520 120"
              fill="none"
              stroke="rgba(94, 67, 243, 0.4)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Edge to Core */}
            <path
              d="M 280 200 C 400 200, 420 360, 520 360"
              fill="none"
              stroke="rgba(94, 67, 243, 0.5)"
              strokeWidth="2.5"
            />
            {/* Core to AI */}
            <path
              d="M 760 360 C 840 360, 860 120, 940 120"
              fill="none"
              stroke="rgba(168, 85, 247, 0.4)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Core to Cache */}
            <path
              d="M 760 360 C 840 360, 860 280, 940 280"
              fill="none"
              stroke="rgba(245, 158, 11, 0.5)"
              strokeWidth="2"
            />
            {/* Core to DB */}
            <path
              d="M 760 360 C 840 360, 860 480, 940 480"
              fill="none"
              stroke="rgba(16, 185, 129, 0.5)"
              strokeWidth="2.5"
            />
          </svg>

          {/* Service Node Cards in Topological Positions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10 py-6">
            {/* Column 1: Ingress Edge Gateways */}
            <div className="space-y-6 flex flex-col justify-center">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-sky-400" />
                <span>Ingress & Edge Runtime</span>
              </div>
              {nodes
                .filter((n) => n.type === "edge")
                .map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xl ${
                        isSelected
                          ? "bg-[#141622] border-indigo-500 shadow-indigo-500/20 scale-[1.02]"
                          : "bg-[#0E1015] border-white/10 hover:border-white/20 hover:bg-[#12141C]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-white">{node.name}</h3>
                            <span className="text-[10px] font-mono text-neutral-400">{node.runtime}</span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono">
                        <div className="text-neutral-400">p99: <span className="text-white font-bold">{node.p99Latency}</span></div>
                        <div className="text-neutral-400">RPS: <span className="text-emerald-400 font-bold">{node.requestsPerSec}</span></div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Column 2: Application Services */}
            <div className="space-y-6 flex flex-col justify-center">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-indigo-400" />
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
                      className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xl ${
                        isSelected
                          ? "bg-[#141622] border-indigo-500 shadow-indigo-500/20 scale-[1.02]"
                          : "bg-[#0E1015] border-white/10 hover:border-white/20 hover:bg-[#12141C]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-white">{node.name}</h3>
                            <span className="text-[10px] font-mono text-neutral-400">{node.runtime}</span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono">
                        <div className="text-neutral-400">p99: <span className="text-white font-bold">{node.p99Latency}</span></div>
                        <div className="text-neutral-400">RPS: <span className="text-emerald-400 font-bold">{node.requestsPerSec}</span></div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Column 3: Storage & Vector Clusters */}
            <div className="space-y-4 flex flex-col justify-center">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>State, Vector & Data Stores</span>
              </div>
              {nodes
                .filter((n) => ["database", "cache", "ai"].includes(n.type))
                .map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xl ${
                        isSelected
                          ? "bg-[#141622] border-indigo-500 shadow-indigo-500/20 scale-[1.02]"
                          : "bg-[#0E1015] border-white/10 hover:border-white/20 hover:bg-[#12141C]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <h3 className="text-xs font-semibold text-white">{node.name}</h3>
                            <span className="text-[10px] font-mono text-neutral-400">{node.runtime}</span>
                          </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-neutral-400">
                        <span>p99: <strong className="text-white">{node.p99Latency}</strong></span>
                        <span className="text-emerald-400">{node.uptime} Uptime</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Side: Diagnostics & Probe Inspector Drawer */}
        {selectedNode && (
          <div className="w-full lg:w-96 bg-[#0E1015] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shrink-0 overflow-y-auto z-20">
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 bg-[#12141C] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  {getNodeIcon(selectedNode.type)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedNode.name}</h3>
                  <p className="text-[10px] font-mono text-neutral-400">{selectedNode.version} • {selectedNode.region}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {selectedNode.status}
              </span>
            </div>

            {/* Diagnostic Metrics */}
            <div className="p-5 space-y-5">
              {/* Telemetry Grid */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-2">
                  Live Telemetry Health
                </label>
                <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#14161D] border border-white/5">
                    <span className="text-[10px] text-neutral-500 block">p99 Latency</span>
                    <span className="text-sm font-bold text-white">{selectedNode.p99Latency}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#14161D] border border-white/5">
                    <span className="text-[10px] text-neutral-500 block">Throughput</span>
                    <span className="text-sm font-bold text-emerald-400">{selectedNode.requestsPerSec}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#14161D] border border-white/5">
                    <span className="text-[10px] text-neutral-500 block">Error Rate</span>
                    <span className="text-sm font-bold text-neutral-300">{selectedNode.errorRate}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#14161D] border border-white/5">
                    <span className="text-[10px] text-neutral-500 block">TCP Connections</span>
                    <span className="text-sm font-bold text-indigo-400">{selectedNode.activeConnections.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Resource Utilization */}
              <div>
                <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-2">
                  Compute Utilization
                </label>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-neutral-400">CPU Allocation</span>
                      <span className="text-white">{selectedNode.cpuUsage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${selectedNode.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-neutral-400">Memory Working Set</span>
                      <span className="text-white">{selectedNode.memoryUsage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
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
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isProbing ? "animate-spin" : ""}`} />
                  <span>{isProbing ? "Sending Probes..." : "Run Diagnostic Health Probes"}</span>
                </button>
              </div>

              {/* Linked Backlog Issues */}
              {selectedNode.linkedTasks.length > 0 && (
                <div className="pt-2">
                  <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-2">
                    Linked Backlog Issues
                  </label>
                  <div className="space-y-2">
                    {selectedNode.linkedTasks.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#14161D] border border-white/5 text-xs text-neutral-300 flex items-start gap-2"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
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
