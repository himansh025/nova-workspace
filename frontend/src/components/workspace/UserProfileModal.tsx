"use client";

import React, { useState } from "react";
import {
  User,
  Shield,
  Key,
  Copy,
  Check,
  X,
  ExternalLink,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { useToast } from "./ToastProvider";

export interface Persona {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  initials: string;
  activeTasks: string[];
}

export const PERSONAS: Persona[] = [
  {
    id: "usr-1",
    name: "Elena Rostova",
    email: "elena@nova.dev",
    role: "Lead Architect",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    initials: "ER",
    activeTasks: ["NV-842: Zero-copy binary parser", "NV-865: CRDT state delta compaction"],
  },
  {
    id: "usr-2",
    name: "Marcus Chen",
    email: "marcus@nova.dev",
    role: "Staff Frontend Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    initials: "MC",
    activeTasks: ["NV-847: Optimistic offline mutations", "NV-868: Virtualized tree renderer"],
  },
  {
    id: "usr-3",
    name: "Siddharth N.",
    email: "siddharth@nova.dev",
    role: "Distributed Systems Lead",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    initials: "SN",
    activeTasks: ["NV-860: Connection pool exhaustion mitigation", "NV-870: Webhook exponential retry"],
  },
  {
    id: "usr-5",
    name: "Aaliyah Patel",
    email: "aaliyah@nova.dev",
    role: "Security & Compliance Lead",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    initials: "AP",
    activeTasks: ["NV-862: Strict CSP & SRI policies", "NV-873: Multi-tenant token isolation"],
  },
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: Persona;
  onSelectPersona: (p: Persona) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onSelectPersona,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const { addToast } = useToast();
  const sessionToken = `nova_sec_${activePersona.id}_${Buffer.from(activePersona.email).toString("base64").slice(0, 16)}`;

  if (!isOpen) return null;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(sessionToken);
    setCopiedToken(true);
    addToast({
      title: "API Token Copied",
      message: "Personal session token copied to clipboard",
      type: "accent",
    });
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSwitch = (p: Persona) => {
    onSelectPersona(p);
    addToast({
      title: "Active Persona Switched",
      message: `Logged in as ${p.name} (${p.role})`,
      type: "success",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#14161D] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 text-xs text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#171922]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              {activePersona.initials}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{activePersona.name}</h3>
              <p className="text-[11px] text-neutral-400">{activePersona.role} • {activePersona.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Persona Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Switch Active Persona
              </label>
              <span className="text-[10px] text-neutral-500">RBAC Identity Mesh</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERSONAS.map((p) => {
                const isCurrent = p.id === activePersona.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwitch(p)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors ${
                      isCurrent
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                        : "bg-[#0E1015] border-white/5 hover:border-white/10 text-neutral-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {p.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs truncate">{p.name}</div>
                        <div className="text-[10px] text-neutral-500 truncate">{p.role}</div>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Workload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Assigned Issues ({activePersona.activeTasks.length})
              </label>
              <span className="text-[10px] text-neutral-500">Sprint 48 Backlog</span>
            </div>
            <div className="space-y-1.5">
              {activePersona.activeTasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#0E1015] border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-neutral-200">{task}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Active SLA
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Personal API Session Token */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3 h-3 text-amber-400" />
                <span>Personal Session API Token</span>
              </label>
              <span className="text-[10px] text-emerald-400">Bearer Auth Valid</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value={sessionToken}
                className="flex-1 bg-[#0A0B0D] border border-white/10 rounded-lg px-3 py-2 text-neutral-400 font-mono text-xs focus:outline-hidden"
              />
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors shrink-0"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? "Copied" : "Copy Token"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#121316] flex justify-between items-center text-[10px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Trust Identity Mesh • Session Encrypted</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-white font-sans text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
